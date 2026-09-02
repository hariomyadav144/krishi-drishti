const express = require('express');
const router = express.Router();
const { getAiAdvice } = require('../controllers/aiAdviceController');

// POST /api/ai-advice
router.options('/', (req, res) => res.sendStatus(204));
router.post('/', getAiAdvice);

module.exports = router;
