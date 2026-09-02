const { askGeminiAdvisor } = require('../services/geminiService');

/**
 * @desc Get real-time conversational AI Advice from Google Gemini
 * @route POST /api/ai-advice
 * @access Public / Farmer
 */
const getAiAdvice = async (req, res) => {
  try {
    const {
      question,
      queryText,
      crop,
      cropName,
      cropStage,
      location,
      language,
      conversationHistory
    } = req.body;

    const query = (question || queryText || '').trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a farming question or topic.'
      });
    }

    const selectedCrop = crop || cropName || 'General';

    // Call real Google Gemini API
    const geminiResult = await askGeminiAdvisor({
      question: query,
      crop: selectedCrop,
      cropStage: cropStage || '',
      location: location || '',
      language: language || 'en',
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : []
    });

    return res.status(200).json({
      success: true,
      message: 'AI Advice generated successfully via Gemini API',
      data: {
        answer: geminiResult.answer,
        queryText: query,
        cropName: selectedCrop,
        model: geminiResult.model,
        timestamp: geminiResult.timestamp
      },
      answer: geminiResult.answer,
      queryText: query,
      cropName: selectedCrop
    });
  } catch (error) {
    console.error('AI Advice Error:', error.message || error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to connect to Google Gemini AI service.',
      error: error.message || 'Failed to connect to Google Gemini AI service.',
      errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  getAiAdvice
};
