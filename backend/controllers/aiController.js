const fs = require('fs');
const path = require('path');
const {
  getUnifiedAiAdvice,
  getUnifiedCropDiagnosis,
  getFriendlyBusyMessage
} = require('../services/aiService');
const { testGeminiDiagnostic } = require('../services/geminiService');

function cleanUserQuery(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/IMPORTANT:[\s\S]*?(?:Farmer Question:|सवाल:|प्रश्न:)/gi, '')
    .replace(/\[?(?:अनिवार्य निर्देश|कृषि संदर्भ|Agricultural Context|Farmer Question):[^\n]*\]?\n*/gim, '')
    .replace(/^Farmer Question:\s*/gi, '')
    .replace(/^(?:सवाल|प्रश्न):\s*/gi, '')
    .trim();
}

/**
 * @desc Get real-time conversational AI Advice through unified AI Service
 * @route POST /api/ai/advice (also /api/ai-advice, /ai/advice)
 * @access Public / Farmer
 */
const getAiAdvice = async (req, res) => {
  const {
    question,
    queryText,
    crop,
    cropName,
    stage,
    cropStage,
    soil,
    weather,
    location,
    language = 'hi',
    conversationHistory
  } = req.body || {};

  try {
    const rawInput = (question || queryText || '').trim();
    const query = cleanUserQuery(rawInput);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: language === 'en' ? 'Please provide a farming question or topic.' : 'कृपया खेती से जुड़ा कोई सवाल पूछें।'
      });
    }

    const selectedCrop = crop || cropName || 'General';
    const selectedStage = stage || cropStage || '';

    // Execute Unified AI Service (Primary -> Cloud Fallback -> Agronomy Engine)
    const result = await getUnifiedAiAdvice({
      question: query,
      crop: selectedCrop,
      cropStage: selectedStage,
      soil: soil || null,
      weather: weather || null,
      location: location || '',
      language: language || 'hi',
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : []
    });

    return res.status(200).json({
      success: true,
      answer: result.answer,
      language: result.language || language,
      crop: selectedCrop,
      stage: selectedStage,
      source: result.source || 'ai_service',
      timestamp: result.timestamp || new Date().toISOString(),
      message: 'Agricultural advice generated successfully',
      data: {
        answer: result.answer,
        queryText: query,
        cropName: selectedCrop,
        cropStage: selectedStage,
        timestamp: result.timestamp || new Date().toISOString()
      },
      // Backwards-compatible root aliases
      queryText: query,
      cropName: selectedCrop
    });
  } catch (error) {
    console.error('[Krishi Drishti] AI Advice Catch:', error.message || error);
    // Never expose technical quota / 429 errors to farmers
    const friendlyMsg = getFriendlyBusyMessage(language);
    return res.status(200).json({
      success: true,
      answer: friendlyMsg,
      language,
      message: friendlyMsg,
      data: {
        answer: friendlyMsg,
        queryText: question || queryText || '',
        cropName: crop || cropName || 'General'
      }
    });
  }
};

/**
 * @desc Diagnose crop disease from uploaded image & farmer question using Gemini Multimodal Vision
 * @route POST /api/ai/diagnose (also /ai/diagnose)
 * @access Public / Farmer
 */
const diagnoseCrop = async (req, res) => {
  try {
    const {
      question,
      symptomDescription,
      crop,
      cropName,
      stage,
      cropStage,
      language,
      sampleImageUrl,
      imageBase64
    } = req.body || {};

    const selectedCrop = crop || cropName || 'Tomato';
    const selectedStage = stage || cropStage || 'Flowering Stage';
    const farmerQuery = cleanUserQuery(question || symptomDescription || '');

    let imageBuffer = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBuffer = fs.readFileSync(req.file.path);
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (imageBase64) {
      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        imageBuffer = Buffer.from(imageBase64, 'base64');
      }
    } else if (sampleImageUrl) {
      // If a local sample image path or external URL
      if (sampleImageUrl.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '..', sampleImageUrl);
        if (fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
        }
      }
    }

    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        message: language === 'en' ? 'Please upload a photo of the affected leaf, fruit, stem, or plant to diagnose.' : 'कृपया प्रभावित पौधे, पत्ती या फल की फोटो अपलोड करें।'
      });
    }

    const diagnosisResult = await getUnifiedCropDiagnosis({
      imageBuffer,
      mimeType,
      question: farmerQuery,
      crop: selectedCrop,
      cropStage: selectedStage,
      language: language || 'hi'
    });

    return res.status(200).json({
      success: true,
      answer: diagnosisResult.answer,
      language: diagnosisResult.language || language,
      crop: diagnosisResult.crop || selectedCrop,
      stage: diagnosisResult.stage || selectedStage,
      source: diagnosisResult.source || 'vision_service',
      timestamp: diagnosisResult.timestamp || new Date().toISOString(),
      diagnosis: diagnosisResult.diagnosis,
      data: diagnosisResult.data || { answer: diagnosisResult.answer }
    });
  } catch (error) {
    console.error('[Krishi Drishti] AI Diagnose Error:', error.message || error);
    const friendlyMsg = getFriendlyBusyMessage(req.body?.language || 'hi');
    return res.status(200).json({
      success: true,
      answer: friendlyMsg,
      message: friendlyMsg,
      diagnosis: 'अस्थायी रूप से व्यस्त',
      data: {
        answer: friendlyMsg,
        detectedProblemHi: 'सेवा अस्थायी रूप से व्यस्त'
      }
    });
  }
};

/**
 * @desc Diagnostic check for Gemini configuration and health
 * @route GET /api/health/gemini
 */
const checkGeminiHealth = async (req, res) => {
  try {
    const result = await testGeminiDiagnostic();
    const statusCode = result.status === 'ok' ? 200 : (result.geminiConfigured ? 502 : 503);
    return res.status(statusCode).json(result);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      geminiConfigured: false,
      message: error.message || 'Internal health check error'
    });
  }
};

module.exports = {
  getAiAdvice,
  diagnoseCrop,
  checkGeminiHealth
};
