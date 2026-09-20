const axios = require('axios');
const {
  askGeminiAdvisor,
  diagnoseCropWithGemini,
  sanitizeAiResponse,
  cleanLatexAndFormat
} = require('./geminiService');
const { getAgronomyFallbackAdvice } = require('./agronomyFallbackEngine');
const { analyzeCropImage } = require('./aiVisionService');
const { generateStandardStructuredAdvice } = require('../utils/universalAgricultureEngine');

// Request in-flight deduplication cache
const activeRequests = new Map();

/**
 * Execute a promise with a hard timeout
 */
function withTimeout(promise, ms, label = 'AI Provider') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutErr = new Error(`${label} request timed out after ${ms}ms`);
        timeoutErr.code = 'ETIMEDOUT';
        reject(timeoutErr);
      }, ms);
    })
  ]);
}

/**
 * Sleep helper for exponential backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detect if error is a rate limit / quota exhaustion
 */
function isQuotaOrRateLimitError(err) {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || err.response?.status;
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  );
}

/**
 * Friendly localized fallback message when every external & internal provider fails
 */
function getFriendlyBusyMessage(lang = 'hi') {
  if (lang === 'en') {
    return 'AI advice is temporarily busy. Please try again shortly.';
  }
  return 'अभी सलाह सेवा थोड़ी व्यस्त है। कृपया कुछ देर बाद फिर कोशिश करें।';
}

/**
 * Optional cloud fallback provider (Groq / OpenAI / Secondary Gemini)
 */
async function callCloudFallbackProvider({ question, crop, cropStage, language, conversationHistory }) {
  const fallbackProvider = (process.env.FALLBACK_AI_PROVIDER || '').toLowerCase();
  const fallbackKey = (
    process.env.FALLBACK_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY_FALLBACK ||
    ''
  ).trim();

  if (!fallbackKey) return null;

  const systemInstruction = `You are Fasal Drishti Agricultural AI, an expert, practical agronomist advising an Indian farmer. You must answer ONLY in pure Hindi (हिंदी / Devanagari script). Do not output English explanations. Structure your answer with:
1. संभावित समस्या या स्थिति
2. होने का मुख्य कारण
3. तुरंत क्या करें
4. उपचार एवं प्रबंधन (जैविक व रासायनिक उपाय)
5. भविष्य में बचाव के उपाय`;

  const promptContent = `Crop: ${crop || 'General'}${cropStage ? ` | Stage: ${cropStage}` : ''}\nFarmer Question: ${question}`;

  // 1. Groq Fallback (ultra-fast, free tier friendly)
  if (fallbackProvider === 'groq' || process.env.GROQ_API_KEY) {
    try {
      const response = await withTimeout(
        axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: promptContent }
            ],
            temperature: 0.6,
            max_tokens: 1024
          },
          {
            headers: {
              Authorization: `Bearer ${fallbackKey}`,
              'Content-Type': 'application/json'
            }
          }
        ),
        14000,
        'Groq Fallback'
      );

      const answer = response.data?.choices?.[0]?.message?.content?.trim();
      if (answer) {
        return {
          success: true,
          answer: cleanLatexAndFormat(answer),
          source: 'cloud_fallback_groq'
        };
      }
    } catch (groqErr) {
      console.warn('[AI Service] Groq fallback failed:', groqErr.message);
    }
  }

  // 2. OpenAI Fallback
  if (fallbackProvider === 'openai' || process.env.OPENAI_API_KEY) {
    try {
      const response = await withTimeout(
        axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: promptContent }
            ],
            temperature: 0.6,
            max_tokens: 1024
          },
          {
            headers: {
              Authorization: `Bearer ${fallbackKey}`,
              'Content-Type': 'application/json'
            }
          }
        ),
        14000,
        'OpenAI Fallback'
      );

      const answer = response.data?.choices?.[0]?.message?.content?.trim();
      if (answer) {
        return {
          success: true,
          answer: cleanLatexAndFormat(answer),
          source: 'cloud_fallback_openai'
        };
      }
    } catch (openaiErr) {
      console.warn('[AI Service] OpenAI fallback failed:', openaiErr.message);
    }
  }

  return null;
}

/**
 * Unified AI Advice Service:
 * 1. Primary AI (Gemini) with controlled exponential backoff (max 2 retries)
 * 2. Cloud Fallback AI (Groq / OpenAI / Secondary Key) if configured
 * 3. Agronomy Expert Knowledge Engine (verified, comprehensive Hindi agricultural advice)
 * 4. Zero technical errors exposed to farmers
 */
async function getUnifiedAiAdvice(params) {
  const {
    question,
    crop = 'General',
    cropStage = '',
    soil = null,
    weather = null,
    location = '',
    language = 'hi',
    conversationHistory = [],
    unifiedPrompt = null,
    farmContext = null
  } = params || {};

  const cleanQ = (question || '').trim();
  if (!cleanQ && !unifiedPrompt) {
    const error = new Error('Please provide a farming question or topic.');
    error.statusCode = 400;
    throw error;
  }

  // In-flight deduplication key: prevent duplicate simultaneous calls for same question
  const dedupKey = `${crop}:${cleanQ.toLowerCase()}`;
  if (activeRequests.has(dedupKey)) {
    try {
      return await activeRequests.get(dedupKey);
    } catch (_) {
      // In case the previous failed, proceed with a fresh attempt
    }
  }

  const executionPromise = (async () => {
    let primaryError = null;

    // STEP 1: Attempt Primary Provider (Gemini) with controlled retries (max 2 attempts)
    const MAX_PRIMARY_RETRIES = 2;
    for (let attempt = 1; attempt <= MAX_PRIMARY_RETRIES; attempt++) {
      try {
        const geminiResult = await withTimeout(
          askGeminiAdvisor({
            question: cleanQ,
            crop,
            cropStage,
            soil,
            weather,
            location,
            language,
            conversationHistory,
            unifiedPrompt,
            farmContext
          }),
          16000,
          'Gemini Primary'
        );

        if (geminiResult && (geminiResult.answer || geminiResult.structuredAdvice)) {
          const structured = geminiResult.structuredAdvice || generateStandardStructuredAdvice({
            query: cleanQ,
            crop,
            farmContext,
            language
          });
          return {
            success: true,
            answer: geminiResult.answer,
            structuredAdvice: structured,
            language: geminiResult.language || language,
            crop: structured.crop_name || geminiResult.crop || crop,
            stage: geminiResult.stage || cropStage,
            source: 'primary_ai',
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        primaryError = err;
        const isQuota = isQuotaOrRateLimitError(err);
        console.warn(`[AI Service] Primary attempt ${attempt}/${MAX_PRIMARY_RETRIES} failed (${err.message}).`);

        if (isQuota && attempt < MAX_PRIMARY_RETRIES) {
          const backoffTime = attempt * 600; // 600ms on first retry
          console.log(`[AI Service] Rate limit encountered. Waiting ${backoffTime}ms before retry...`);
          await sleep(backoffTime);
        } else if (!isQuota) {
          // Non-quota error (e.g. key missing, bad request) -> skip further retries
          break;
        }
      }
    }

    console.log('[AI Service] Primary provider unavailable. Seamlessly engaging Fallback Engine...');

    const dynamicFallback = generateStandardStructuredAdvice({
      query: cleanQ,
      crop,
      farmContext,
      language
    });

    // STEP 2: Attempt Cloud Fallback Provider if configured (Groq, OpenAI, Secondary Gemini)
    try {
      const cloudFallback = await callCloudFallbackProvider({
        question: cleanQ,
        crop,
        cropStage,
        language,
        conversationHistory
      });

      if (cloudFallback && cloudFallback.answer) {
        console.log('[AI Service] Response successfully resolved via Cloud Fallback Provider.');
        return {
          success: true,
          answer: cloudFallback.answer,
          structuredAdvice: dynamicFallback,
          language,
          crop: dynamicFallback.crop_name || crop,
          stage: cropStage,
          source: 'cloud_fallback',
          timestamp: new Date().toISOString()
        };
      }
    } catch (fallbackErr) {
      console.warn('[AI Service] Cloud Fallback error:', fallbackErr.message);
    }

    // STEP 3: Fallback Agronomy Knowledge Engine
    try {
      const agronomyResult = getAgronomyFallbackAdvice({
        question: cleanQ,
        crop,
        cropStage,
        language
      });

      if (agronomyResult && agronomyResult.answer) {
        console.log('[AI Service] Response successfully resolved via Agronomy Knowledge Engine.');
        return {
          success: true,
          answer: agronomyResult.answer,
          structuredAdvice: dynamicFallback,
          language,
          crop: dynamicFallback.crop_name || agronomyResult.crop || crop,
          stage: cropStage,
          source: 'agronomy_knowledge_engine',
          timestamp: new Date().toISOString()
        };
      }
    } catch (agronomyErr) {
      console.error('[AI Service] Agronomy Fallback error:', agronomyErr.message);
    }

    // STEP 4: Absolute Emergency Safe Fallback with dynamic structured diagnosis
    return {
      success: true,
      answer: dynamicFallback.why_is_this_happening || getFriendlyBusyMessage(language),
      structuredAdvice: dynamicFallback,
      language,
      crop: dynamicFallback.crop_name || crop,
      stage: cropStage,
      source: 'kvk_scientific_rules_engine',
      timestamp: new Date().toISOString()
    };
  })();

  // Track in-flight request and clean up after completion
  activeRequests.set(dedupKey, executionPromise);
  try {
    const result = await executionPromise;
    return result;
  } finally {
    setTimeout(() => activeRequests.delete(dedupKey), 4000);
  }
}

/**
 * Unified Multimodal Image Diagnosis Service:
 * 1. Primary Gemini Vision
 * 2. Fallback Pathology Database Vision Engine (aiVisionService)
 */
async function getUnifiedCropDiagnosis(params) {
  const {
    imageBuffer,
    mimeType = 'image/jpeg',
    question = '',
    crop = 'Tomato',
    cropStage = 'Flowering Stage',
    language = 'hi'
  } = params || {};

  // STEP 1: Attempt Gemini Multimodal Vision with 18s timeout
  try {
    const visionResult = await withTimeout(
      diagnoseCropWithGemini({
        imageBuffer,
        mimeType,
        question,
        crop,
        cropStage,
        language
      }),
      18000,
      'Gemini Vision'
    );

    if (visionResult) {
      if (visionResult.isIdentifiable === false || visionResult.isPlant === false) {
        return {
          success: true,
          isPlant: false,
          isIdentifiable: false,
          unclearMessage: visionResult.unclearMessage || visionResult.answer,
          answer: visionResult.unclearMessage || visionResult.answer,
          crop: null,
          cropName: null,
          language: visionResult.language || language,
          data: visionResult.data,
          source: 'primary_vision',
          timestamp: new Date().toISOString()
        };
      }

      if (visionResult.answer || visionResult.diagnosis) {
        return {
          success: true,
          isPlant: true,
          isIdentifiable: true,
          answer: visionResult.answer,
          language: visionResult.language || language,
          crop: visionResult.crop || crop,
          cropName: visionResult.cropName || visionResult.crop || crop,
          plantPart: visionResult.plantPart,
          healthStatus: visionResult.healthStatus,
          detectedProblem: visionResult.detectedProblem,
          confidence: visionResult.confidence,
          confidenceLevel: visionResult.confidenceLevel,
          visibleSymptoms: visionResult.visibleSymptoms,
          recommendedActions: visionResult.recommendedActions,
          organicTreatment: visionResult.organicTreatment,
          chemicalTreatment: visionResult.chemicalTreatment,
          preventionTips: visionResult.preventionTips,
          whenToSeekExpert: visionResult.whenToSeekExpert,
          stage: visionResult.stage || cropStage,
          diagnosis: visionResult.diagnosis,
          data: visionResult.data,
          source: 'primary_vision',
          timestamp: new Date().toISOString()
        };
      }
    }
  } catch (visionErr) {
    console.warn('[AI Service] Primary vision diagnosis notice:', visionErr.message);
  }

  // STEP 2: Fallback to Agricultural Pathology Classification Engine
  try {
    const localResult = await analyzeCropImage({
      cropName: crop && crop !== 'Tomato' ? crop : '',
      symptomDescription: question,
      originalname: 'farmer_upload.jpg',
      filename: 'farmer_upload.jpg',
      language
    });

    if (localResult && localResult.isIdentifiable === false) {
      return {
        success: true,
        isIdentifiable: false,
        unclearMessage: localResult.unclearMessage,
        answer: localResult.unclearMessage,
        crop: null,
        language
      };
    }

    const isHi = language === 'hi';
    const detectedCrop = localResult.cropName || (isHi ? 'पहचानी गई फसल' : 'Identified Crop');
    const problemText = isHi ? (localResult.detectedProblemHi || localResult.detectedProblem) : (localResult.detectedProblem || localResult.detectedProblemHi);
    const causeText = isHi ? (localResult.causeHi || localResult.cause) : (localResult.cause || localResult.causeHi);
    const actionText = isHi ? (localResult.recommendedActionHi || localResult.recommendedAction) : (localResult.recommendedAction || localResult.recommendedActionHi);
    const organicText = localResult.organicTreatment || (isHi ? 'नीम तेल (5ml/L) का छिड़काव करें।' : 'Foliar spray of Neem Oil (5ml/L).');
    const chemicalText = localResult.chemicalTreatment || (isHi ? 'अनुशंसित फफूंदनाशक का छिड़काव करें।' : 'Apply recommended fungicide as per label directions.');
    const cautionText = localResult.importantNote || (isHi ? 'लेबल पर दिए निर्देशों का पालन करें।' : 'Follow instructions on the product label.');
    const preventionItems = (localResult.preventionTips || []).join('\n• ');

    const structuredAnswer = isHi ? [
      `1. पहचानी गई फसल:\n${detectedCrop}`,
      `2. संभावित समस्या या रोग:\n${problemText} (विश्वसनीयता: ${localResult.confidence}%)`,
      `3. होने का मुख्य कारण:\n${causeText}`,
      `4. तुरंत क्या करें (जरूरी कदम):\n${actionText}`,
      `5. उपचार एवं प्रबंधन:\n• जैविक उपाय: ${organicText}\n• रासायनिक उपाय: ${chemicalText}\n• सावधानी: ${cautionText}`,
      `6. भविष्य में बचाव:\n• ${preventionItems}`
    ].join('\n\n') : [
      `1. Identified Crop:\n${detectedCrop}`,
      `2. Detected Issue / Disease:\n${problemText} (Confidence: ${localResult.confidence}%)`,
      `3. Primary Cause:\n${causeText}`,
      `4. Immediate Action Needed:\n${actionText}`,
      `5. Recommended Treatment:\n• Organic Control: ${organicText}\n• Chemical Control: ${chemicalText}\n• Caution: ${cautionText}`,
      `6. Preventive Care:\n• ${preventionItems}`
    ].join('\n\n');

    return {
      success: true,
      isIdentifiable: true,
      answer: cleanLatexAndFormat(structuredAnswer),
      language,
      crop: detectedCrop,
      stage: cropStage,
      diagnosis: problemText,
      data: {
        ...localResult,
        cropName: detectedCrop,
        answer: structuredAnswer
      },
      source: 'fallback_pathology_engine',
      timestamp: new Date().toISOString()
    };
  } catch (pathologyErr) {
    console.error('[AI Service] Fallback pathology engine error:', pathologyErr.message);
  }

  // STEP 3: Safe Emergency Response
  return {
    success: true,
    answer: getFriendlyBusyMessage(language),
    language,
    crop,
    stage: cropStage,
    source: 'safe_emergency_response',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getUnifiedAiAdvice,
  getUnifiedCropDiagnosis,
  getFriendlyBusyMessage
};
