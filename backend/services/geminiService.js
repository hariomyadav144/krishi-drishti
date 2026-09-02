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

/**
 * Calls Google Gemini API with conversational context
 */
async function askGeminiAdvisor({
  question,
  crop = 'General',
  cropStage = '',
  location = '',
  language = 'en',
  conversationHistory = []
}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    const error = new Error('GEMINI_API_KEY is not configured on the backend server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    throw error;
  }

  if (!question || question.trim() === '') {
    const error = new Error('Please provide a valid farming question or topic.');
    error.statusCode = 400;
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build conversational contents
  const contents = [];

  // Add conversation history if present
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

  // Build current user prompt with agricultural metadata
  const contextNotes = [];
  if (crop && crop !== 'General') contextNotes.push(`Selected Crop: ${crop}`);
  if (cropStage) contextNotes.push(`Crop Stage: ${cropStage}`);
  if (location) contextNotes.push(`Location/District: ${location}`);
  if (language) contextNotes.push(`Preferred Language: ${language}`);

  let promptWithContext = question;
  if (contextNotes.length > 0) {
    promptWithContext = `[Context: ${contextNotes.join(' | ')}]\n\nFarmer's Question: ${question}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: promptWithContext }]
  });

  // Try gemini-2.5-flash first, fallback to gemini-1.5-flash if needed
  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const responseText = response?.text?.trim() || '';
      if (responseText) {
        return {
          success: true,
          answer: responseText,
          question,
          cropName: crop,
          model: modelName,
          timestamp: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} error:`, err.message || err);
      lastError = err;
    }
  }

  // If all models failed, throw genuine error (NO fake silent fallback)
  const errorMsg = lastError?.message || 'Gemini API call failed to generate an answer.';
  const apiError = new Error(`Gemini AI Error: ${errorMsg}`);
  apiError.statusCode = 502;
  throw apiError;
}

module.exports = {
  askGeminiAdvisor,
  SYSTEM_INSTRUCTION
};
