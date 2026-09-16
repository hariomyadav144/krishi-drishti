const fs = require('fs');
const path = require('path');
const {
  getUnifiedAiAdvice,
  getUnifiedCropDiagnosis,
  getFriendlyBusyMessage
} = require('../services/aiService');
const { testGeminiDiagnostic } = require('../services/geminiService');
const {
  loadFarmIntelligenceContext,
  crossValidateAgronomicSignals,
  constructUnifiedFarmPrompt
} = require('../services/farmIntelligenceEngine');

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
    fieldId,
    language = 'hi',
    conversationHistory
  } = req.body || {};

  try {
    const rawInput = (question || queryText || req.body?.query || req.body?.message || req.body?.prompt || '').trim();
    const query = cleanUserQuery(rawInput);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: language === 'en' ? 'Please provide a farming question or topic.' : 'कृपया खेती से जुड़ा कोई सवाल पूछें।'
      });
    }

    const userId = req.user ? req.user._id : (req.body?.farmerId || req.body?.userId || 'demo_farmer');

    // 1. Load Complete Farm Intelligence Context (8 Dimensions)
    const farmContext = await loadFarmIntelligenceContext(userId, fieldId || req.body?.fieldId || 'default');

    // Override or augment with any explicit payload values
    if (crop && crop !== 'Tomato') farmContext.cropInfo.crop = crop;
    if (cropName && cropName !== 'Tomato') farmContext.cropInfo.crop = cropName;
    if (stage || cropStage) farmContext.cropInfo.cropStage = stage || cropStage;
    if (soil && typeof soil === 'object') Object.assign(farmContext.soilInfo, soil);
    if (weather && typeof weather === 'object') Object.assign(farmContext.weatherEnvironment, weather);

    const selectedCrop = farmContext.cropInfo.crop || 'Wheat';
    const selectedStage = farmContext.cropInfo.cropStage || 'Vegetative';

    // 2. Perform Multi-Factor Agronomic Cross-Validation
    const crossValidationSignals = crossValidateAgronomicSignals(farmContext, query);

    // 3. Construct Unified Farm Context Prompt
    const unifiedPrompt = constructUnifiedFarmPrompt(farmContext, query, crossValidationSignals, language);

    // 4. Execute Unified AI Service with Complete Farm Intelligence Context
    const result = await getUnifiedAiAdvice({
      question: query,
      crop: selectedCrop,
      cropStage: selectedStage,
      soil: farmContext.soilInfo,
      weather: farmContext.weatherEnvironment,
      location: location || `${farmContext.farmInfo.district}, ${farmContext.farmInfo.state}`,
      language: language || 'hi',
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      unifiedPrompt,
      farmContext
    });

    return res.status(200).json({
      success: true,
      answer: result.answer,
      language: result.language || language,
      crop: result.crop || selectedCrop,
      stage: selectedStage,
      source: result.source || 'farm_intelligence_engine',
      timestamp: result.timestamp || new Date().toISOString(),
      farmContext: {
        fieldId: farmContext.fieldInfo.fieldId,
        fieldName: farmContext.fieldInfo.fieldName,
        crop: selectedCrop,
        stage: selectedStage,
        soilType: farmContext.fieldInfo.soilType,
        healthStatus: farmContext.cropHealth.overallStatus,
        healthScore: farmContext.cropHealth.healthScore,
        weather: {
          temp: farmContext.weatherEnvironment.temperatureC,
          humidity: farmContext.weatherEnvironment.humidityPercent,
          rain24h: farmContext.weatherEnvironment.precipitationForecast24h
        },
        signals: crossValidationSignals
      },
      message: 'Complete farm intelligence advisory generated successfully',
      data: {
        answer: result.answer,
        queryText: query,
        cropName: result.crop || selectedCrop,
        cropStage: selectedStage,
        timestamp: result.timestamp || new Date().toISOString()
      },
      // Backwards-compatible root aliases
      queryText: query,
      cropName: result.crop || selectedCrop
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
        cropName: crop && crop !== 'Tomato' ? crop : 'General'
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
      language = 'hi',
      sampleImageUrl,
      imageBase64
    } = req.body || {};

    // Do NOT hardcode Tomato — let AI detect the crop from the image
    const selectedCrop = crop && crop !== 'Tomato' ? crop : (cropName && cropName !== 'Tomato' ? cropName : '');
    const selectedStage = stage || cropStage || '';
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

    // Handle low-confidence / unclear image flagged by AI
    if (diagnosisResult && diagnosisResult.isIdentifiable === false) {
      return res.status(200).json({
        success: true,
        isIdentifiable: false,
        unclearMessage: diagnosisResult.unclearMessage,
        message: diagnosisResult.unclearMessage,
        answer: diagnosisResult.unclearMessage,
        crop: null,
        cropName: null,
        data: {
          isIdentifiable: false,
          unclearMessage: diagnosisResult.unclearMessage,
          cropName: null,
          detectedProblem: null
        }
      });
    }

    const detectedCropName = diagnosisResult.crop || (language === 'en' ? 'Identified Crop' : 'पहचानी गई फसल');

    return res.status(200).json({
      success: true,
      isPlant: true,
      isIdentifiable: true,
      answer: diagnosisResult.answer,
      language: diagnosisResult.language || language,
      crop: detectedCropName,
      cropName: detectedCropName,
      plantPart: diagnosisResult.plantPart || diagnosisResult.data?.plantPart || (language === 'en' ? 'Leaf / Plant' : 'पत्ती / पौधा'),
      healthStatus: diagnosisResult.healthStatus || diagnosisResult.data?.healthStatus || 'Diseased',
      detectedProblem: diagnosisResult.detectedProblem || diagnosisResult.data?.detectedProblem || (language === 'en' ? 'Visual Examination' : 'दृश्य परीक्षण'),
      confidence: diagnosisResult.confidence || diagnosisResult.data?.confidence || 90,
      confidenceLevel: diagnosisResult.confidenceLevel || diagnosisResult.data?.confidenceLevel || 'High',
      visibleSymptoms: diagnosisResult.visibleSymptoms || diagnosisResult.data?.visibleSymptoms || diagnosisResult.data?.whatAiFound || '',
      recommendedActions: diagnosisResult.recommendedActions || diagnosisResult.data?.recommendedActions || (diagnosisResult.data?.recommendedAction ? [diagnosisResult.data.recommendedAction] : []),
      organicTreatment: diagnosisResult.organicTreatment || diagnosisResult.data?.organicTreatment || '',
      chemicalTreatment: diagnosisResult.chemicalTreatment || diagnosisResult.data?.chemicalTreatment || '',
      preventionTips: diagnosisResult.preventionTips || diagnosisResult.data?.preventionTips || [],
      whenToSeekExpert: diagnosisResult.whenToSeekExpert || diagnosisResult.data?.whenToSeekExpert || diagnosisResult.data?.importantNote || '',
      stage: diagnosisResult.stage || selectedStage,
      source: diagnosisResult.source || 'vision_service',
      timestamp: diagnosisResult.timestamp || new Date().toISOString(),
      diagnosis: diagnosisResult.diagnosis,
      data: {
        ...(diagnosisResult.data || {}),
        cropName: detectedCropName,
        answer: diagnosisResult.answer,
        plantPart: diagnosisResult.plantPart || diagnosisResult.data?.plantPart || (language === 'en' ? 'Leaf / Plant' : 'पत्ती / पौधा'),
        healthStatus: diagnosisResult.healthStatus || diagnosisResult.data?.healthStatus || 'Diseased',
        detectedProblem: diagnosisResult.detectedProblem || diagnosisResult.data?.detectedProblem,
        confidence: diagnosisResult.confidence || diagnosisResult.data?.confidence || 90,
        confidenceLevel: diagnosisResult.confidenceLevel || diagnosisResult.data?.confidenceLevel || 'High',
        visibleSymptoms: diagnosisResult.visibleSymptoms || diagnosisResult.data?.visibleSymptoms || diagnosisResult.data?.whatAiFound,
        recommendedActions: diagnosisResult.recommendedActions || diagnosisResult.data?.recommendedActions,
        organicTreatment: diagnosisResult.organicTreatment || diagnosisResult.data?.organicTreatment,
        chemicalTreatment: diagnosisResult.chemicalTreatment || diagnosisResult.data?.chemicalTreatment,
        preventionTips: diagnosisResult.preventionTips || diagnosisResult.data?.preventionTips,
        whenToSeekExpert: diagnosisResult.whenToSeekExpert || diagnosisResult.data?.whenToSeekExpert
      }
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
