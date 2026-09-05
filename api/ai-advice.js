const { GoogleGenAI } = require('@google/genai');

const SYSTEM_INSTRUCTION = `You are Krishi Drishti AI, a friendly and practical agricultural advisor for Indian farmers.

Your job is to speak like an experienced and helpful agricultural expert who understands the everyday language of farmers.

Understand:
- Hindi (हिंदी)
- Hinglish
- English
- Mixed Hindi-English farmer language.

Respond in the language/script the farmer asks in:
- If asked in Hindi, reply in clear, friendly Hindi.
- If asked in Hinglish, reply in easy-to-read Hinglish / Hindi.
- If asked in English, reply in clean, accessible English.

Do not sound robotic, generic, or like a textbook.
Give practical, easy-to-understand advice.
First understand what the farmer is actually asking.
If the question is unclear, politely ask for the missing information instead of inventing an answer.

When relevant, consider:
- crop
- crop stage
- season
- location
- weather
- irrigation
- soil
- common farming practices

Explain naturally:
1. What the farmer can do (स्पष्ट समाधान)
2. Why it may help (कारण / लाभ)
3. When to do it (समय / कब करें)
4. Important precautions (सावधानियां / क्या न करें)

Use simple farmer-friendly language.
Do not force the same fixed answer format for every question.
Every response must be specifically generated for the user's actual question.
Maintain conversation context.
If the farmer asks a follow-up question such as 'iske liye kya karu?', understand the previous question and answer in context.
Do not pretend to know real-time weather, prices, government schemes, or current local conditions unless that information is actually provided to you by the user or system context.`;

module.exports = async function handler(req, res) {
  // Enable CORS for GitHub Pages and all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return res.status(503).json({
      success: false,
      message: 'GEMINI_API_KEY is not configured on the backend server environment. Please set GEMINI_API_KEY in your server environment variables.'
    });
  }

  const {
    question,
    queryText,
    crop,
    cropName,
    cropStage,
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

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = [];

    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role && msg.content) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: String(msg.content) }]
          });
        }
      }
    }

    const selectedCrop = crop || cropName || 'General';
    const contextNotes = [];
    if (selectedCrop && selectedCrop !== 'General') contextNotes.push(`Selected Crop: ${selectedCrop}`);
    if (cropStage) contextNotes.push(`Crop Stage: ${cropStage}`);
    if (location) contextNotes.push(`Location: ${location}`);
    if (language) contextNotes.push(`Preferred Language: ${language}`);

    let promptWithContext = query;
    if (contextNotes.length > 0) {
      promptWithContext = `[Context: ${contextNotes.join(' | ')}]\n\nFarmer's Question: ${query}`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: promptWithContext }]
    });

    const candidateModels = [
      process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash'
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    let answer = '';
    let usedModel = '';
    let lastErr = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7
          }
        });
        const text = response?.text?.trim() || '';
        if (text) {
          answer = text;
          usedModel = modelName;
          break;
        }
      } catch (err) {
        lastErr = err;
      }
    }

    if (!answer) {
      throw lastErr || new Error('Failed to generate response from Gemini Flash');
    }

    return res.status(200).json({
      success: true,
      message: 'AI Advice generated successfully via Gemini API',
      data: {
        answer,
        queryText: query,
        cropName: selectedCrop
      },
      answer,
      queryText: query,
      cropName: selectedCrop
    });
  } catch (error) {
    console.error('Serverless Gemini Error:', error.message || error);
    return res.status(502).json({
      success: false,
      message: `Gemini AI Error: ${error.message || 'Failed to generate response'}`
    });
  }
};
