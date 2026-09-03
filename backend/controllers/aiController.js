const fs = require('fs');
const path = require('path');
const {
  askGeminiAdvisor,
  diagnoseCropWithGemini,
  testGeminiDiagnostic
} = require('../services/geminiService');

/**
 * @desc Get real-time conversational AI Advice from Google Gemini
 * @route POST /api/ai/advice (also /api/ai-advice, /ai/advice)
 * @access Public / Farmer
 */
const getAiAdvice = async (req, res) => {
  try {
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
      language,
      conversationHistory
    } = req.body || {};

    const query = (question || queryText || '').trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a farming question or topic.'
      });
    }

    const selectedCrop = crop || cropName || 'General';
    const selectedStage = stage || cropStage || '';

    // Call real Google Gemini API
    const geminiResult = await askGeminiAdvisor({
      question: query,
      crop: selectedCrop,
      cropStage: selectedStage,
      soil: soil || null,
      weather: weather || null,
      location: location || '',
      language: language || 'en',
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : []
    });

    return res.status(200).json({
      success: true,
      answer: geminiResult.answer,
      language: geminiResult.language,
      crop: selectedCrop,
      stage: selectedStage,
      model: geminiResult.model,
      timestamp: geminiResult.timestamp,
      message: 'AI Advice generated successfully via Gemini API',
      data: {
        answer: geminiResult.answer,
        queryText: query,
        cropName: selectedCrop,
        cropStage: selectedStage,
        model: geminiResult.model,
        timestamp: geminiResult.timestamp
      },
      // Backwards-compatible root aliases
      queryText: query,
      cropName: selectedCrop
    });
  } catch (error) {
    console.error('[Krishi Drishti] AI Advice Error:', error.message || error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'AI service is temporarily unavailable. Please try again in a few moments.',
      error: error.message || 'AI service is temporarily unavailable.'
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
    const farmerQuery = question || symptomDescription || '';

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
        message: 'Please upload a photo of the affected leaf, fruit, stem, or plant to diagnose.'
      });
    }

    const diagnosisResult = await diagnoseCropWithGemini({
      imageBuffer,
      mimeType,
      question: farmerQuery,
      crop: selectedCrop,
      cropStage: selectedStage,
      language: language || 'en'
    });

    return res.status(200).json({
      success: true,
      answer: diagnosisResult.answer,
      language: diagnosisResult.language,
      crop: diagnosisResult.crop,
      stage: diagnosisResult.stage,
      model: diagnosisResult.model,
      timestamp: diagnosisResult.timestamp,
      diagnosis: diagnosisResult.diagnosis,
      data: diagnosisResult.data
    });
  } catch (error) {
    console.error('[Krishi Drishti] AI Diagnose Error:', error.message || error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'AI diagnosis service is temporarily unavailable. Please try again in a few moments.'
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
