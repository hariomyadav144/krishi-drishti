const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/auth');
const { getAiAdvice } = require('../controllers/aiController');

// POST /api/ai-advice (legacy alias for /api/ai/advice)
router.options('*', (req, res) => res.sendStatus(204));
router.post('/', optionalProtect, getAiAdvice);
router.post('/advice', optionalProtect, getAiAdvice);

module.exports = router;
