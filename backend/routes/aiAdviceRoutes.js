const express = require('express');
const router = express.Router();
const { getAiAdvice } = require('../controllers/aiAdviceController');

// POST /api/ai-advice
router.post('/', getAiAdvice);

module.exports = router;
