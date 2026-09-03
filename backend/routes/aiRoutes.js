const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { optionalProtect } = require('../middleware/auth');
const { getAiAdvice, diagnoseCrop, checkGeminiHealth } = require('../controllers/aiController');

// Allow OPTIONS preflight on all routes
router.options('*', (req, res) => res.sendStatus(204));

// POST /api/ai/advice
router.post('/advice', optionalProtect, getAiAdvice);

// POST /api/ai/diagnose (multipart/form-data with image)
router.post('/diagnose', optionalProtect, upload.single('image'), diagnoseCrop);

// Safe diagnostic endpoint
router.get('/health/gemini', checkGeminiHealth);

module.exports = router;
