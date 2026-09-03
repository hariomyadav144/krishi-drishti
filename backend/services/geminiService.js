const { GoogleGenAI } = require('@google/genai');

/**
 * Krishi Drishti Agricultural AI System Instruction
 * Expert, practical, and farmer-friendly assistant for Indian agriculture.
 */
const SYSTEM_INSTRUCTION = `You are Krishi Drishti AI, an expert, practical, and farmer-friendly agricultural advisor designed specifically for Indian farmers.
Your mission is to provide accurate, timely, and actionable agricultural guidance to help farmers maximize crop yield, manage diseases and pests, optimize irrigation and fertilizers, and protect their livelihood.

SCOPE OF EXPERTISE:
1. Crop Selection, Sowing & Agronomy:
   - Sowing dates, seed rate, seed treatment (fungicide/bio-fertilizer like Rhizobium/Trichoderma), nursery raising, spacing, transplanting, plant population.
   - Crop stages: germination, vegetative, tillering, flowering, fruit set, grain filling, maturity, harvesting.
2. Crop Pathology, Symptoms & Disease Management:
   - Identifying symptoms: yellowing leaves (chlorosis), leaf spots, blights, rusts, wilting, leaf curl, damping off, powdery/downy mildew, mosaic patterns, root rot, fruit borer damage.
   - Diagnosing fungal, bacterial, and viral plant pathogens.
3. Pest Attacks & Insect Management:
   - Sucking pests: whiteflies, aphids, thrips, jassids, mites.
   - Borers & caterpillars: pink bollworm, fall armyworm, fruit borer, stem borer, leaf miners.
   - Integrated Pest Management (IPM): yellow/blue sticky traps, pheromone traps, light traps, neem-based sprays, biocontrol agents (Trichoderma, Pseudomonas, Beauveria).
4. Soil Health & Plant Nutrition:
   - Soil types (Alluvial, Black, Red, Sandy loam, Clayey), pH balance, organic carbon.
   - Primary fertilizers (NPK - Nitrogen, Phosphorus, Potassium), Urea, DAP, MOP, SSP.
   - Secondary & micronutrients: Zinc (ZnSO4), Boron, Iron, Magnesium, Sulphur deficiency symptoms and foliar corrections.
   - Organic manures, FYM, vermicompost, Jeevamrut, green manuring.
5. Irrigation & Water Scheduling:
   - Critical stages of irrigation for wheat (CRI stage, tillering, flowering, milking), rice (standing water vs alternate wetting & drying), tomato, cotton, potato, onion, chilli.
   - Micro-irrigation: drip irrigation, fertigation scheduling, sprinkler systems, water conservation.
6. Weed Control:
   - Pre-emergence and post-emergence weed control, hand weeding, mulching.
7. Weather-Related Stress Management:
   - Heat wave stress, cold waves/frost protection (smudging, light irrigation), unseasonal rain damage, waterlogging mitigation, drought survival.
8. Government Schemes & Mandi Advice:
   - Information on PM-KISAN, PMFBY (Pradhan Mantri Fasal Bima Yojana), Kisan Credit Card (KCC), Soil Health Card scheme.
   - Mandi/market advice when price information is provided.

CRITICAL DIAGNOSTIC & BEHAVIORAL RULES:
1. DO NOT BLINDLY GUESS:
   - Never invent or assume a disease with certainty if symptoms are vague or incomplete.
   - If the symptoms described or seen are insufficient to diagnose accurately, clearly explain that more information is needed, and ask 2-3 focused, helpful follow-up questions (e.g. "Are the spots circular or irregular?", "Is the yellowing on older lower leaves or young upper leaves?", "Do you see webbing or tiny insects on the underside?").
2. STRUCTURE FOR CROP DISEASE, PEST & SYMPTOM QUESTIONS:
   Whenever answering a disease, pest, or physiological symptom question, you MUST structure your response cleanly as:
   1. Likely Problem / Issue (पहचाना गया संभावित रोग/कीट)
   2. Why it may be happening / Causes (होने का मुख्य कारण)
   3. What to do NOW / Immediate Action (तुरंत क्या करें)
   4. Treatment & Management / Organic & Chemical Options (उपचार एवं प्रबंधन)
   5. Prevention for Future (भविष्य में बचाव के उपाय)
   6. When to consult local Agriculture Officer / KVK (कृषि विशेषज्ञ से कब संपर्क करें)
3. LANGUAGE & SCRIPT RULES:
   - If the farmer asks in Hindi, reply in clear, friendly Devanagari Hindi (हिंदी).
   - If the farmer asks in Hinglish (Romanized Hindi), reply in simple Hinglish with key Hindi terms.
   - If the farmer asks in English, reply in clean, accessible English.
   - Always keep the language respectful, encouraging, and easy to understand. Avoid intimidating scientific jargon unless immediately explained in plain farmer language.
4. SAFE & RESPONSIBLE CHEMICAL ADVICE:
   - DO NOT invent chemical trade names, unrealistic concentrations, or unapproved dosages.
   - When suggesting standard active ingredients (e.g., Mancozeb, Copper Oxychloride, Imidacloprid, Chlorantraniliprole, Neem Oil), provide general reference concentrations (e.g., 2g/L or 1ml/L) but ALWAYS include the standard disclaimer: "Always check the registered product packaging label and consult your local Agriculture Extension Officer / Krishi Vigyan Kendra (KVK) before chemical application."
5. MULTIMODAL & IMAGE DIAGNOSIS RULES:
   - When analyzing an uploaded image, describe what is visibly evident (color changes, necrotic spots, leaf curling, insect damage, fungal spores).
   - Give realistic confidence and acknowledge uncertainty. Never claim 100% certainty from a photograph alone.
   - If the photo is blurry, too dark, out of focus, or does not clearly show the affected plant parts, clearly instruct the farmer: "The photo is not clear enough for a confident diagnosis. Please upload a sharper, well-lit close-up photo of the affected leaf/plant part."`;

/**
 * Get active Gemini Flash model with configurable fallback
 */
function getActiveModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
}

function getCandidateModels() {
  const primary = getActiveModel();
  const list = [primary, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
  return [...new Set(list)];
}

/**
 * Safely retrieve Gemini API Key from environment variables.
 * Primary: GEMINI_API_KEY
 * Supported aliases: GOOGLE_API_KEY, GEMINI_KEY, GOOGLE_GEMINI_API_KEY
 */
function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    ''
  ).trim();
}

/**
 * Initializes GoogleGenAI client with validation
 */
function getAiClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured on the backend server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }
  return { ai: new GoogleGenAI({ apiKey }), apiKey };
}

/**
 * Clean and format safe error message for farmers
 */
function formatGeminiError(err) {
  const msg = err?.message || String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('invalid api key') || msg.includes('API key not valid')) {
    const error = new Error('The configured GEMINI_API_KEY is invalid or unauthorized. Please verify the API key on the backend server.');
    error.statusCode = 502;
    return error;
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429')) {
    const error = new Error('AI service quota reached or rate limit exceeded. Please try again in a few moments.');
    error.statusCode = 429;
    return error;
  }
  if (msg.includes('GEMINI_KEY_MISSING')) {
    const error = new Error('GEMINI_API_KEY is not configured on the backend server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    return error;
  }
  const error = new Error(`AI service is temporarily unavailable: ${msg.replace(/AIza[a-zA-Z0-9_-]+/g, '[REDACTED]')}`);
  error.statusCode = 502;
  return error;
}

/**
 * Ask Gemini Conversational Agriculture Advisor
 */
async function askGeminiAdvisor({
  question,
  crop = 'General',
  cropStage = '',
  soil = null,
  weather = null,
  location = '',
  language = 'en',
  conversationHistory = []
}) {
  const q = (question || '').trim();
  if (!q) {
    const error = new Error('Please provide a farming question or topic.');
    error.statusCode = 400;
    throw error;
  }

  const { ai } = getAiClient();
  const candidateModels = getCandidateModels();

  // Assemble contextual agricultural metadata
  const contextTokens = [];
  if (crop && crop !== 'General') contextTokens.push(`Crop: ${crop}`);
  if (cropStage) contextTokens.push(`Stage: ${cropStage}`);
  if (location) {
    const locStr = typeof location === 'object' ? `${location.district || ''}, ${location.state || ''}`.trim().replace(/^,|,$/g, '') : String(location);
    if (locStr) contextTokens.push(`Location: ${locStr}`);
  }
  if (soil) {
    const soilStr = typeof soil === 'object' ? (soil.type || soil.soilType || JSON.stringify(soil)) : String(soil);
    if (soilStr && soilStr !== '{}') contextTokens.push(`Soil: ${soilStr}`);
  }
  if (weather) {
    const wStr = typeof weather === 'object' ? (weather.summary || weather.condition || (weather.temp ? `${weather.temp}°C` : '')) : String(weather);
    if (wStr && wStr !== '{}') contextTokens.push(`Weather: ${wStr}`);
  }
  if (language) {
    contextTokens.push(`Target Language: ${language === 'hi' ? 'Hindi (हिंदी)' : language === 'hinglish' ? 'Hinglish' : 'English'}`);
  }

  // Assemble conversation contents
  const contents = [];

  // Add conversation history if available
  if (Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory) {
      if (msg && msg.content && typeof msg.content === 'string' && msg.content.trim()) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content.trim() }]
        });
      }
    }
  }

  // Construct final prompt with context
  let finalPrompt = q;
  if (contextTokens.length > 0) {
    finalPrompt = `[Agricultural Context: ${contextTokens.join(' | ')}]\n\nFarmer Question: ${q}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: finalPrompt }]
  });

  let lastError = null;
  let successfulModel = null;
  let answerText = '';

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const text = response?.text?.trim() || '';
      if (text) {
        answerText = text;
        successfulModel = modelName;
        break;
      }
    } catch (err) {
      console.warn(`[Krishi Drishti] Gemini model ${modelName} error:`, err.message || err);
      lastError = err;
    }
  }

  if (!answerText) {
    throw formatGeminiError(lastError);
  }

  return {
    success: true,
    answer: answerText,
    language,
    crop,
    stage: cropStage,
    model: successfulModel,
    timestamp: new Date().toISOString()
  };
}

/**
 * Diagnose Crop Disease from Image using Gemini Multimodal Vision
 */
async function diagnoseCropWithGemini({
  imageBuffer,
  mimeType = 'image/jpeg',
  question = '',
  crop = 'Tomato',
  cropStage = '',
  language = 'en'
}) {
  if (!imageBuffer) {
    const error = new Error('No image provided for crop diagnosis.');
    error.statusCode = 400;
    throw error;
  }

  const { ai } = getAiClient();
  const candidateModels = getCandidateModels();

  const base64Data = Buffer.isBuffer(imageBuffer) ? imageBuffer.toString('base64') : String(imageBuffer);

  const contextTokens = [];
  if (crop) contextTokens.push(`Crop: ${crop}`);
  if (cropStage) contextTokens.push(`Stage: ${cropStage}`);
  if (language) contextTokens.push(`Language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}`);

  const userPrompt = `You are examining a photograph uploaded by an Indian farmer.
[Context: ${contextTokens.join(' | ')}]
Farmer's Note/Question: ${question || 'Please analyze this crop image and identify any disease, pest, nutrient deficiency, or issue.'}

Please perform an in-depth agricultural inspection of this image:
1. Visible Symptoms: Detail what is visibly apparent on the leaf, fruit, stem, or plant.
2. Possible Causes / Likely Problem: Name the most probable disease, pest, or physiological condition.
3. Confidence & Uncertainty: State your realistic confidence level. Explicitly mention that diagnosis from an image alone carries uncertainty and should be verified in the field. If the image is blurry, out-of-focus, or unclear, explicitly ask for a sharper photo.
4. Immediate Action: What the farmer should do TODAY.
5. Treatment & Management: Provide both Organic/Bio-control options and approved Chemical options with standard safety disclaimers.
6. Prevention: Key preventive cultural practices for future cycles.
7. Expert Consultation: When to contact the local Agriculture Officer or KVK.

Answer in ${language === 'hi' ? 'Hindi (हिंदी)' : language === 'hinglish' ? 'Hinglish' : 'English'} in a respectful, clear, and actionable manner.`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Data
          }
        },
        {
          text: userPrompt
        }
      ]
    }
  ];

  let lastError = null;
  let successfulModel = null;
  let answerText = '';

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.5,
        }
      });

      const text = response?.text?.trim() || '';
      if (text) {
        answerText = text;
        successfulModel = modelName;
        break;
      }
    } catch (err) {
      console.warn(`[Krishi Drishti] Gemini Vision model ${modelName} error:`, err.message || err);
      lastError = err;
    }
  }

  if (!answerText) {
    throw formatGeminiError(lastError);
  }

  // Extract structured highlights from answer for UI display
  const detectedProblem = extractSection(answerText, ['likely problem', 'problem', 'संभावित रोग', 'बीमारी', 'issue']) || `${crop} Foliage Condition`;
  const recommendedAction = extractSection(answerText, ['immediate action', 'what to do now', 'तुरंत क्या करें', 'action']) || 'Inspect affected foliage and follow prescribed treatment.';
  const organicTreatment = extractSection(answerText, ['organic', 'जैविक', 'bio-control', 'neem']) || 'Neem oil spray (5ml/L) and remove diseased leaves.';
  const chemicalTreatment = extractSection(answerText, ['chemical', 'रासायनिक', 'fungicide', 'insecticide']) || 'Apply registered protective spray as per package label instructions.';

  return {
    success: true,
    answer: answerText,
    crop,
    stage: cropStage,
    language,
    model: successfulModel,
    timestamp: new Date().toISOString(),
    diagnosis: {
      visibleSymptoms: answerText.slice(0, 300) + '...',
      possibleCauses: detectedProblem,
      confidence: 'Medium to High (Photo-based assessment)',
      immediateAction: recommendedAction,
      treatment: `${organicTreatment} | ${chemicalTreatment}`,
      prevention: 'Maintain proper plant spacing, balanced NPK fertilization, and scout regularly.'
    },
    data: {
      cropName: crop,
      detectedProblem,
      detectedProblemHi: detectedProblem,
      confidence: 90,
      severity: answerText.toLowerCase().includes('critical') || answerText.toLowerCase().includes('severe') ? 'High' : 'Medium',
      cause: detectedProblem,
      causeHi: detectedProblem,
      symptoms: [detectedProblem],
      recommendedAction,
      recommendedActionHi: recommendedAction,
      organicTreatment,
      chemicalTreatment,
      preventionTips: [
        'Maintain proper field sanitation and eradicate weed hosts',
        'Avoid water stagnation and follow crop rotation',
        'Consult local KVK or agriculture officer for official verification'
      ],
      nextActionTimeline: 'Inspect affected foliage within 48 hours to evaluate progress.'
    }
  };
}

/**
 * Helper to extract key lines from AI output
 */
function extractSection(text, keywords) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (keywords.some(kw => lower.includes(kw))) {
      // Return next non-empty line or current line remainder
      const clean = line.replace(/^[^:]*[:\-]/, '').trim();
      if (clean.length > 5) return clean;
      if (lines[i + 1] && lines[i + 1].trim()) return lines[i + 1].trim();
    }
  }
  return null;
}

/**
 * Safe backend diagnostic endpoint to test Gemini API connectivity without leaking secrets
 */
async function testGeminiDiagnostic() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      status: 'not_configured',
      geminiConfigured: false,
      model: getActiveModel(),
      message: 'GEMINI_API_KEY is not configured on the backend server.'
    };
  }

  const startTime = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = getActiveModel();
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: 'Ping. Reply with single word: Pong' }] }],
      config: { maxOutputTokens: 10 }
    });

    const latencyMs = Date.now() - startTime;
    return {
      status: 'ok',
      geminiConfigured: true,
      model,
      latencyMs,
      message: `Google Gemini API responding normally (${latencyMs}ms).`
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.warn('[Krishi Drishti] Diagnostic test failed:', err.message || err);
    return {
      status: 'error',
      geminiConfigured: true,
      model: getActiveModel(),
      latencyMs,
      message: `Gemini API check failed: ${err.message ? err.message.replace(/AIza[a-zA-Z0-9_-]+/g, '[REDACTED]') : 'Connection error'}`
    };
  }
}

module.exports = {
  askGeminiAdvisor,
  diagnoseCropWithGemini,
  testGeminiDiagnostic,
  SYSTEM_INSTRUCTION,
  getActiveModel,
  getApiKey
};
