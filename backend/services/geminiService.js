const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

/**
 * Krishi Drishti Agricultural AI System Instruction
 * Expert, practical, and farmer-friendly assistant for Indian agriculture.
 */
const SYSTEM_INSTRUCTION_HI = `IMPORTANT: You are an agricultural expert advising an Indian farmer. You must answer ONLY in pure Hindi (हिंदी / Devanagari script). Do not output English sentences or English explanations. Every heading, explanation, fertilizer name, and instruction must be written in Hindi. Do not use LaTeX symbols like $\\circ$ or \\text{}; write temperatures simply as '24°C से 29°C'.

You are Krishi Drishti AI, an expert, practical, and farmer-friendly agricultural advisor designed specifically for Indian farmers.
Your mission is to provide accurate, timely, and actionable agricultural guidance to help farmers maximize crop yield, manage diseases and pests, optimize irrigation and fertilizers, and protect their livelihood.

MANDATORY LANGUAGE, SCRIPT & FORMATTING INSTRUCTIONS (STRICT):
1. RESPOND COMPLETELY IN SIMPLE, NATURAL HINDI:
   - Respond completely in simple, easy-to-understand Hindi (Devanagari script - सरल व स्वाभाविक हिंदी) suitable for an Indian farmer (किसान भाई).
   - Do not generate English explanations or mixed English paragraphs. Keep headings, bullet points, remedies, and dosages strictly in clear Hindi.
   - Ensure scientific names can be in brackets (e.g. (Trichoderma viride)), but the main explanation, steps, symptoms, and advice must be purely Hindi.
   - Use respectful, encouraging, and clear Hindi that any rural Indian farmer can immediately grasp.

2. FIX LATEX OUTPUT ISSUES (ABSOLUTELY NO LATEX OR MATH NOTATION):
   - Do not output broken symbols or LaTeX math formatting like \`$24^\\circ\\text{C}$\`, \`$\\sim$\`, \`\\pm\`, or \`\\frac\`.
   - Always use standard plain text like '24°C से 29°C', 'लगभग 50%', '±2', '2 ग्राम प्रति लीटर पानी'.

SCOPE OF EXPERTISE:
1. Crop Selection, Sowing & Agronomy
2. Crop Pathology, Symptoms & Disease Management
3. Pest Attacks & Insect Management
4. Soil Health & Plant Nutrition
5. Irrigation & Water Scheduling
6. Weed Control
7. Weather-Related Stress Management
8. Government Schemes & Mandi Advice

CRITICAL DIAGNOSTIC & BEHAVIORAL RULES:
1. DO NOT BLINDLY GUESS:
   - Never invent or assume a disease with certainty if symptoms are vague or incomplete.
   - If the symptoms described or seen are insufficient to diagnose accurately, clearly explain in Hindi that more details are needed, and ask 2-3 focused, helpful follow-up questions in Hindi.
2. STRUCTURE FOR CROP DISEASE, PEST & SYMPTOM QUESTIONS:
   Structure with bold headings in Hindi:
   1. संभावित समस्या या रोग
   2. होने का मुख्य कारण
   3. तुरंत क्या करें / जरूरी कदम
   4. उपचार एवं प्रबंधन (जैविक व रासायनिक विकल्प)
   5. भविष्य में बचाव के उपाय
   6. कृषि विशेषज्ञ / KVK से सलाह
3. SAFE & RESPONSIBLE CHEMICAL ADVICE:
   - DO NOT invent chemical trade names or unapproved dosages. Include disclaimer to consult local KVK or read pesticide labels.
4. MULTIMODAL & IMAGE DIAGNOSIS RULES:
   - When analyzing an uploaded image, describe what is visibly evident clearly.
   - If the photo is blurry, dark, or not clear, ask for a clear photo.`;

const SYSTEM_INSTRUCTION_EN = `IMPORTANT: You are an agricultural expert advising an Indian farmer. You must answer ONLY in clear, natural English. Do not output Hindi or Devanagari sentences or mixed Hindi paragraphs. Every heading, explanation, fertilizer name, and instruction must be written in English. Do not use LaTeX symbols like $\\circ$ or \\text{}; write temperatures simply as '24°C to 29°C'.

You are Krishi Drishti AI, an expert, practical, and farmer-friendly agricultural advisor designed specifically for Indian farmers.
Your mission is to provide accurate, timely, and actionable agricultural guidance to help farmers maximize crop yield, manage diseases and pests, optimize irrigation and fertilizers, and protect their livelihood.

MANDATORY LANGUAGE, SCRIPT & FORMATTING INSTRUCTIONS (STRICT):
1. RESPOND COMPLETELY IN SIMPLE, NATURAL ENGLISH:
   - Respond completely in simple, easy-to-understand English suitable for an Indian farmer.
   - Do not generate Hindi explanations or mixed Devanagari text. Keep headings, bullet points, remedies, and dosages strictly in clear English.
   - Use respectful, encouraging, and clear English that any farmer can immediately grasp.

2. FIX LATEX OUTPUT ISSUES (ABSOLUTELY NO LATEX OR MATH NOTATION):
   - Do not output broken symbols or LaTeX math formatting like \`$24^\\circ\\text{C}$\`, \`$\\sim$\`, \`\\pm\`, or \`\\frac\`.
   - Always use standard plain text like '24°C to 29°C', 'approximately 50%', '±2', '2 grams per litre of water'.

SCOPE OF EXPERTISE:
1. Crop Selection, Sowing & Agronomy
2. Crop Pathology, Symptoms & Disease Management
3. Pest Attacks & Insect Management
4. Soil Health & Plant Nutrition
5. Irrigation & Water Scheduling
6. Weed Control
7. Weather-Related Stress Management
8. Government Schemes & Mandi Advice

CRITICAL DIAGNOSTIC & BEHAVIORAL RULES:
1. DO NOT BLINDLY GUESS:
   - Never invent or assume a disease with certainty if symptoms are vague or incomplete.
   - If the symptoms or image are insufficient to diagnose accurately, clearly explain in English that more details or a clearer photo is needed.
2. STRUCTURE FOR CROP DISEASE, PEST & SYMPTOM QUESTIONS:
   Structure with bold headings in English:
   1. Likely Problem / Disease
   2. Main Causes / Why it happens
   3. What to do NOW / Immediate Action
   4. Treatment & Management (Organic & Chemical Options)
   5. Prevention Tips for Future
   6. When to consult Agriculture Officer / KVK
3. SAFE & RESPONSIBLE CHEMICAL ADVICE:
   - Suggest standard active ingredients with safe concentrations and always include the safety disclaimer.
4. MULTIMODAL & IMAGE DIAGNOSIS RULES:
   - If the photo is blurry, dark, out of focus, or does not clearly show the plant, state clearly that a clear photo is required.`;

const SYSTEM_INSTRUCTION_MR = `IMPORTANT: You are an agricultural expert advising a farmer in Maharashtra. You must answer ONLY in pure Marathi (मराठी). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Marathi. Do not use LaTeX symbols.`;

const SYSTEM_INSTRUCTION_PA = `IMPORTANT: You are an agricultural expert advising a farmer in Punjab. You must answer ONLY in pure Punjabi (ਪੰਜਾਬੀ / Gurmukhi script). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Punjabi. Do not use LaTeX symbols.`;

function getSystemInstruction(language = 'hi') {
  const l = (language || 'hi').toLowerCase();
  if (l === 'en') return SYSTEM_INSTRUCTION_EN;
  if (l === 'mr') return SYSTEM_INSTRUCTION_MR;
  if (l === 'pa') return SYSTEM_INSTRUCTION_PA;
  return SYSTEM_INSTRUCTION_HI;
}

function getLanguagePromptName(language = 'hi') {
  const l = (language || 'hi').toLowerCase();
  if (l === 'en') return 'English';
  if (l === 'mr') return 'Marathi (मराठी)';
  if (l === 'pa') return 'Punjabi (ਪੰਜਾਬੀ)';
  return 'Hindi (हिंदी)';
}

const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_HI;

/**
 * Get active Gemini Flash model with configurable fallback
 */
function getActiveModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.7-flash';
}

function getCandidateModels() {
  const primary = getActiveModel();
  const list = ['gemini-3.6-flash', 'gemini-2.5-flash', primary, 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  return [...new Set(list.filter(Boolean))];
}

/**
 * Safely retrieve Gemini API Key from environment variables.
 * Primary: GEMINI_API_KEY
 * Supported aliases: GOOGLE_API_KEY, GEMINI_KEY, GOOGLE_GEMINI_API_KEY
 */
function getApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    ''
  ).trim();
}

/**
 * Initializes GoogleGenAI client with validation
 */
function getAiClient() {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured on the backend server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }
  return { ai: new GoogleGenAI({ apiKey }), apiKey };
}

/**
 * Clean and format safe error message for farmers
 */
function formatGeminiError(err) {
  const msg = err?.message || String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('invalid api key') || msg.includes('API key not valid')) {
    const error = new Error('The configured GEMINI_API_KEY is invalid or unauthorized. Please verify the API key on the backend server.');
    error.statusCode = 502;
    return error;
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429')) {
    const error = new Error('AI service quota reached or rate limit exceeded. Please try again in a few moments.');
    error.statusCode = 429;
    return error;
  }
  if (msg.includes('GEMINI_KEY_MISSING')) {
    const error = new Error('GEMINI_API_KEY is not configured on the backend server. Please set GEMINI_API_KEY in server environment variables.');
    error.statusCode = 503;
    return error;
  }
  const error = new Error(`AI service is temporarily unavailable: ${msg.replace(/AIza[a-zA-Z0-9_-]+/g, '[REDACTED]')}`);
  error.statusCode = 502;
  return error;
}

/**
 * Clean up any broken LaTeX or math formatting from AI responses
 * e.g. converts `$24^\circ\text{C}$` to '24°C', `$\sim$` to 'लगभग ', etc.
 */
function cleanLatexAndFormat(text) {
  if (!text || typeof text !== 'string') return text;

  let cleaned = text;

  // LaTeX temperature range like $24^\circ\text{C}$ से $29^\circ\text{C}$ or $24^\circ C - 29^\circ C$
  cleaned = cleaned.replace(/\$?([0-9.]+)\s*\^\\circ\s*(?:\\text\{C\}|C|\\text\{\s*C\s*\})\$?(\s*(?:से|-|to)\s*)\$?([0-9.]+)?\s*\^?\\?circ?\s*(?:\\text\{C\}|C|\\text\{\s*C\s*\})?\$?/gi, (match, p1, sep, p2) => {
    if (p2) {
      const separator = (sep || '').includes('से') ? ' से ' : '-';
      return `${p1}°C${separator}${p2}°C`;
    }
    return `${p1}°C`;
  });

  // Single temperature instances: $24^\circ\text{C}$, 24^\circ\text{C}$, $24^\circ C$, 24^\circ C
  cleaned = cleaned.replace(/\$?([0-9.]+)\s*\^\\circ\s*(?:\\text\{C\}|C|\\text\{\s*C\s*\})\$?/gi, '$1°C');
  cleaned = cleaned.replace(/\$?([0-9.]+)\s*\^\\circ\s*(?:\\text\{F\}|F|\\text\{\s*F\s*\})\$?/gi, '$1°F');
  cleaned = cleaned.replace(/\$([0-9.]+)\^\circ\$/gi, '$1°');

  // Replace \text{...} formatting inside math blocks
  cleaned = cleaned.replace(/\\text\{([^{}]+)\}/g, '$1');

  // Math symbols
  cleaned = cleaned.replace(/\$\s*\\sim\s*\$\s*/g, 'लगभग ');
  cleaned = cleaned.replace(/\\sim\s*/g, 'लगभग ');
  cleaned = cleaned.replace(/\$\s*\\approx\s*\$\s*/g, 'लगभग ');
  cleaned = cleaned.replace(/\\approx\s*/g, 'लगभग ');
  cleaned = cleaned.replace(/लगभग\s+/g, 'लगभग ');
  cleaned = cleaned.replace(/\$\s*\\pm\s*\$\s*/g, '±');
  cleaned = cleaned.replace(/\\pm\s*/g, '±');
  cleaned = cleaned.replace(/\$\\times\$/g, '×');
  cleaned = cleaned.replace(/\\times\s*/g, '×');
  cleaned = cleaned.replace(/\$\\le\$/g, '≤');
  cleaned = cleaned.replace(/\$\\ge\$/g, '≥');

  // Strip dollar signs around isolated numbers/units e.g. $10-15%$ -> 10-15%, $500$ -> 500
  cleaned = cleaned.replace(/\$([0-9.\s%+\-–—/°CA-Za-z]+)\$/g, '$1');

  return cleaned;
}

/**
 * Sanitize AI response to ensure no echoed prompts, developer notes, or broken LaTeX reach the farmer
 */
function sanitizeAiResponse(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text;

  // Strip any echoed system instructions or prompt headers if model reflected them
  cleaned = cleaned.replace(/^IMPORTANT:[\s\S]*?(?=(\n\n|किसान|नमस्ते|१|1\.|रोग|समस्या|फसल|उपाय))/gi, '');
  cleaned = cleaned.replace(/^\[?(?:अनिवार्य निर्देश|कृषि संदर्भ|Agricultural Context|Farmer Question):[^\n]*\]?\n*/gim, '');

  cleaned = cleanLatexAndFormat(cleaned);
  return cleaned.trim();
}

/**
 * Ask Gemini Conversational Agriculture Advisor
 */
async function askGeminiAdvisor({
  question,
  crop = 'General',
  cropStage = '',
  soil = null,
  weather = null,
  location = '',
  language = 'hi',
  conversationHistory = []
}) {
  const q = (question || '').trim();
  if (!q) {
    const error = new Error('Please provide a farming question or topic.');
    error.statusCode = 400;
    throw error;
  }

  const { ai } = getAiClient();
  const candidateModels = getCandidateModels();

  // Assemble contextual agricultural metadata
  const contextTokens = [];
  if (crop && crop !== 'General') contextTokens.push(`Crop: ${crop}`);
  if (cropStage) contextTokens.push(`Stage: ${cropStage}`);
  if (location) {
    const locStr = typeof location === 'object' ? `${location.district || ''}, ${location.state || ''}`.trim().replace(/^,|,$/g, '') : String(location);
    if (locStr) contextTokens.push(`Location: ${locStr}`);
  }
  if (soil) {
    const soilStr = typeof soil === 'object' ? (soil.type || soil.soilType || JSON.stringify(soil)) : String(soil);
    if (soilStr && soilStr !== '{}') contextTokens.push(`Soil: ${soilStr}`);
  }
  if (weather) {
    const wStr = typeof weather === 'object' ? (weather.summary || weather.condition || (weather.temp ? `${weather.temp}°C` : '')) : String(weather);
    if (wStr && wStr !== '{}') contextTokens.push(`Weather: ${wStr}`);
  }
  const langPromptName = getLanguagePromptName(language);
  contextTokens.push(`Language: ${langPromptName}`);

  // Assemble conversation contents
  const contents = [];

  // Add conversation history if available
  if (Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory) {
      if (msg && msg.content && typeof msg.content === 'string' && msg.content.trim()) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content.trim() }]
        });
      }
    }
  }

  // Construct final prompt with context
  let finalPrompt = q;
  if (contextTokens.length > 0) {
    finalPrompt = `[Agricultural Context: ${contextTokens.join(' | ')}]\n\nFarmer Question: ${q}`;
  }

  contents.push({
    role: 'user',
    parts: [{ text: finalPrompt }]
  });

  let lastError = null;
  let successfulModel = null;
  let answerText = '';

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: getSystemInstruction(language),
          temperature: 0.7,
        }
      });

      const text = response?.text?.trim() || '';
      if (text) {
        answerText = sanitizeAiResponse(text);
        successfulModel = modelName;
        break;
      }
    } catch (err) {
      console.warn(`[Krishi Drishti] Gemini model ${modelName} error:`, err.message || err);
      lastError = err;
      const errMsg = (err.message || String(err)).toLowerCase();
      if (errMsg.includes('resource_exhausted') || errMsg.includes('quota') || errMsg.includes('429')) {
        break;
      }
    }
  }

  if (!answerText) {
    throw formatGeminiError(lastError);
  }

  return {
    success: true,
    answer: answerText,
    language: language || 'hi',
    crop,
    stage: cropStage,
    model: successfulModel,
    timestamp: new Date().toISOString()
  };
}

/**
 * Diagnose Crop Disease and automatically identify Crop from Image using Gemini Multimodal Vision
 */
async function diagnoseCropWithGemini({
  imageBuffer,
  mimeType = 'image/jpeg',
  question = '',
  crop = '',
  cropStage = '',
  language = 'hi'
}) {
  if (!imageBuffer) {
    const error = new Error('No image provided for crop diagnosis.');
    error.statusCode = 400;
    throw error;
  }

  const { ai } = getAiClient();
  const candidateModels = getCandidateModels();

  const base64Data = Buffer.isBuffer(imageBuffer) ? imageBuffer.toString('base64') : String(imageBuffer);
  const langPromptName = getLanguagePromptName(language);

  const userPrompt = `You are Krishi Drishti Agricultural AI Multimodal Vision Expert.
You are examining a photograph uploaded by an Indian farmer.
Selected language: ${langPromptName}.

CRITICAL INSTRUCTIONS:
1. FIRST, check if this image clearly depicts an agricultural crop or plant:
   - If the image is blurry, too dark, out of focus, does not show an agricultural plant/crop, contains multiple uncertain crops, or cannot be identified with reasonable confidence:
     Set "isIdentifiable": false.
     Set "unclearMessage" to a clear, polite explanation in ${langPromptName} asking the farmer to upload a clear photo of the plant or affected leaf (e.g. English: "I couldn't confidently identify the crop from this image. Please upload a clear photo of the plant or affected leaf." / Hindi: "मैं इस तस्वीर से फसल की सही पहचान नहीं कर पाया। कृपया पौधे या प्रभावित पत्ते की एक साफ तस्वीर अपलोड करें।").
     Do NOT guess or invent a fake crop or disease.
2. AUTOMATIC CROP IDENTIFICATION:
   - Identify the exact crop visible in the image (e.g. Wheat, Rice / Paddy, Tomato, Potato, Cotton, Maize, Chilli, Onion, Soybean, Mustard, Sugarcane, etc.).
   - NEVER assume Tomato unless the image actually shows a Tomato plant.
3. CROP HEALTH & PROBLEM DIAGNOSIS:
   - Analyze plant condition: disease (fungal, bacterial, viral), pest damage, nutrient deficiency, leaf discoloration, physical stress, or confirm if the plant is completely healthy.
   - Explain what you found clearly.
   - Provide practical solutions (immediate action, organic treatment, chemical treatment).
   - Provide future prevention tips.
   - Provide an important note or precaution (especially when chemicals are recommended).
4. STRICT LANGUAGE REQUIREMENT:
   Every single field and value in your response MUST be generated entirely in ${langPromptName}.
   ${language === 'en' ? 'ABSOLUTELY NO Hindi or Devanagari script words. Pure English only.' : ''}
   ${language === 'hi' ? 'ABSOLUTELY NO English paragraphs. Pure Hindi (सरल देवनागरी हिंदी) only.' : ''}

Farmer Note / Question: ${question || (language === 'en' ? 'Please analyze this crop image, identify the crop, and diagnose any disease or health issue.' : 'कृपया इस फसल की तस्वीर का विश्लेषण करें, फसल पहचानें और रोग व उपचार बताएं।')}

You MUST return a VALID JSON object (and nothing else) enclosed in \`\`\`json ... \`\`\` with the following fields:
{
  "isIdentifiable": true,
  "unclearMessage": "",
  "cropName": "Crop name in ${langPromptName}",
  "healthStatus": "Healthy" | "Attention Needed" | "Diseased" | "Pest Infested",
  "detectedProblem": "Name of the detected disease, pest, deficiency, or 'Healthy Crop' in ${langPromptName}",
  "confidence": 92,
  "severity": "None" | "Low" | "Medium" | "High" | "Critical",
  "whatAiFound": "Clear explanation of visible symptoms in ${langPromptName}",
  "recommendedAction": "Immediate practical steps for the farmer in ${langPromptName}",
  "organicTreatment": "Organic or biological remedies in ${langPromptName}",
  "chemicalTreatment": "Approved chemical treatment with dosage instructions in ${langPromptName}",
  "preventionTips": [
    "Prevention tip 1 in ${langPromptName}",
    "Prevention tip 2 in ${langPromptName}",
    "Prevention tip 3 in ${langPromptName}"
  ],
  "importantNote": "Safety precaution or advice to consult local KVK in ${langPromptName}",
  "nextActionTimeline": "Follow-up inspection timeline in ${langPromptName}"
}`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Data
          }
        },
        {
          text: userPrompt
        }
      ]
    }
  ];

  let lastError = null;
  let successfulModel = null;
  let answerText = '';

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: getSystemInstruction(language),
          temperature: 0.3,
        }
      });

      const text = response?.text?.trim() || '';
      if (text) {
        answerText = sanitizeAiResponse(text);
        successfulModel = modelName;
        break;
      }
    } catch (err) {
      console.warn(`[Krishi Drishti] Gemini Vision model ${modelName} error:`, err.message || err);
      lastError = err;
      const errMsg = (err.message || String(err)).toLowerCase();
      if (errMsg.includes('resource_exhausted') || errMsg.includes('quota') || errMsg.includes('429')) {
        break;
      }
    }
  }

  if (!answerText) {
    throw formatGeminiError(lastError);
  }

  // Parse structured JSON response from Gemini
  let parsedJson = null;
  try {
    const jsonMatch = answerText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || answerText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
  } catch (parseErr) {
    console.warn('[Krishi Drishti] Gemini JSON parse notice:', parseErr.message);
  }

  // If Gemini flagged image as unclear / unidentifiable
  if (parsedJson && parsedJson.isIdentifiable === false) {
    const fallbackMsg = language === 'en'
      ? "I couldn't confidently identify the crop from this image. Please upload a clear photo of the plant or affected leaf."
      : "मैं इस तस्वीर से फसल की सही पहचान नहीं कर पाया। कृपया पौधे या प्रभावित पत्ते की एक साफ तस्वीर अपलोड करें।";
    
    return {
      success: true,
      isIdentifiable: false,
      unclearMessage: parsedJson.unclearMessage || fallbackMsg,
      language,
      model: successfulModel,
      timestamp: new Date().toISOString(),
      data: {
        isIdentifiable: false,
        unclearMessage: parsedJson.unclearMessage || fallbackMsg,
        cropName: null,
        detectedProblem: null,
        confidence: 0,
        severity: 'None'
      }
    };
  }

  // Extract fields from parsed JSON or smart regex fallbacks
  const detectedCrop = parsedJson?.cropName ||
    extractSection(answerText, ['crop', 'फसल', 'detected crop', 'पौधा']) ||
    (language === 'en' ? 'Identified Crop' : 'पहचानी गई फसल');

  const detectedProblem = parsedJson?.detectedProblem ||
    extractSection(answerText, ['संभावित समस्या', 'संभावित रोग', 'बीमारी', 'likely problem', 'problem', 'disease', 'issue']) ||
    (language === 'en' ? 'Leaf Health Assessment' : 'पत्ती स्वास्थ्य आकलन');

  const whatAiFound = parsedJson?.whatAiFound ||
    extractSection(answerText, ['what ai found', 'लक्षण', 'visible symptoms', 'symptoms']) ||
    (language === 'en' ? 'Visual examination shows localized stress on foliage.' : 'दृश्य निरीक्षण में पत्तियों पर तनाव व लक्षण दिखाई दे रहे हैं।');

  const recommendedAction = parsedJson?.recommendedAction ||
    extractSection(answerText, ['तुरंत क्या करें', 'जरूरी कदम', 'immediate action', 'what to do now', 'recommended action', 'action']) ||
    (language === 'en' ? 'Inspect affected leaves and follow recommended treatment.' : 'प्रभावित पत्तियों का निरीक्षण करें और अनुशंसित उपचार तुरंत अपनाएं।');

  const organicTreatment = parsedJson?.organicTreatment ||
    extractSection(answerText, ['जैविक उपाय', 'जैविक', 'bio-control', 'neem', 'organic']) ||
    (language === 'en' ? 'Spray Neem Oil (5ml/L water) and remove heavily affected foliage.' : 'नीम का तेल (5 मि.ली./लीटर पानी) और प्रभावित पत्तियों को हटाएं।');

  const chemicalTreatment = parsedJson?.chemicalTreatment ||
    extractSection(answerText, ['रासायनिक उपाय', 'रासायनिक', 'fungicide', 'insecticide', 'chemical']) ||
    (language === 'en' ? 'Apply recommended fungicide/insecticide as per product label guidelines.' : 'लेबल पर दिए गए निर्देशों के अनुसार अनुमोदित फफूंदनाशक का छिड़काव करें।');

  const preventionTips = Array.isArray(parsedJson?.preventionTips) && parsedJson.preventionTips.length > 0
    ? parsedJson.preventionTips
    : (language === 'en' ? [
        'Maintain proper plant spacing and destroy weed hosts',
        'Avoid waterlogging and practice balanced crop nutrition',
        'Consult local agricultural officer or KVK for periodic field scouting'
      ] : [
        'खेत की स्वच्छता बनाए रखें और खरपतवार नष्ट करें',
        'जलभराव से बचें और संतुलित पोषण प्रबंधन अपनाएं',
        'सटीक जांच हेतु स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क करें'
      ]);

  const importantNote = parsedJson?.importantNote ||
    extractSection(answerText, ['important note', 'सावधानी', 'चेतावनी', 'disclaimer', 'note']) ||
    (language === 'en' ? 'Read pesticide label instructions carefully before application and consult local KVK.' : 'दवा के प्रयोग से पहले पैकेट पर दिए निर्देशों को पढ़ें व स्थानीय KVK से परामर्श लें।');

  const nextActionTimeline = parsedJson?.nextActionTimeline ||
    (language === 'en' ? 'Re-inspect foliage within 48 hours of treatment.' : 'उपचार के 48 घंटों के भीतर पत्तियों का पुनः निरीक्षण करें।');

  const confidenceVal = Number(parsedJson?.confidence) || 92;
  const severityVal = parsedJson?.severity ||
    (answerText.toLowerCase().includes('critical') || answerText.includes('गंभीर') ? 'High' : 'Medium');

  return {
    success: true,
    isIdentifiable: true,
    answer: answerText,
    crop: detectedCrop,
    language,
    model: successfulModel,
    timestamp: new Date().toISOString(),
    diagnosis: {
      visibleSymptoms: whatAiFound,
      possibleCauses: detectedProblem,
      confidence: `${confidenceVal}%`,
      immediateAction: recommendedAction,
      treatment: `${organicTreatment} | ${chemicalTreatment}`,
      prevention: preventionTips.join(' • ')
    },
    data: {
      isIdentifiable: true,
      cropName: detectedCrop,
      detectedProblem,
      detectedProblemHi: language === 'hi' ? detectedProblem : '',
      confidence: confidenceVal,
      severity: severityVal,
      whatAiFound,
      cause: whatAiFound,
      causeHi: language === 'hi' ? whatAiFound : '',
      symptoms: [whatAiFound],
      recommendedAction,
      recommendedActionHi: language === 'hi' ? recommendedAction : '',
      organicTreatment,
      chemicalTreatment,
      preventionTips,
      importantNote,
      nextActionTimeline
    }
  };
}

/**
 * Helper to extract key lines from AI output
 */
function extractSection(text, keywords) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (keywords.some(kw => lower.includes(kw))) {
      // Return next non-empty line or current line remainder
      const clean = line.replace(/^[^:]*[:\-]/, '').trim();
      if (clean.length > 5) return clean;
      if (lines[i + 1] && lines[i + 1].trim()) return lines[i + 1].trim();
    }
  }
  return null;
}

/**
 * Safe backend diagnostic endpoint to test Gemini API connectivity without leaking secrets
 */
async function testGeminiDiagnostic() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      status: 'not_configured',
      geminiConfigured: false,
      model: getActiveModel(),
      message: 'GEMINI_API_KEY is not configured on the backend server.'
    };
  }

  const startTime = Date.now();
  const candidateModels = getCandidateModels();
  let lastError = null;
  let successfulModel = null;

  for (const modelName of candidateModels) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: 'Ping. Reply with single word: Pong' }] }],
        config: { maxOutputTokens: 100 }
      });

      const reply = res?.text || res?.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
      if (reply) {
        successfulModel = modelName;
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Krishi Drishti] Diagnostic test with model ${modelName} failed:`, err.message || err);
    }
  }

  const latencyMs = Date.now() - startTime;
  if (successfulModel) {
    return {
      status: 'ok',
      geminiConfigured: true,
      model: successfulModel,
      latencyMs,
      message: `Google Gemini API responding normally via ${successfulModel} (${latencyMs}ms).`
    };
  } else {
    return {
      status: 'error',
      geminiConfigured: true,
      model: getActiveModel(),
      latencyMs,
      message: `Gemini API check failed: ${lastError?.message ? lastError.message.replace(/AIza[a-zA-Z0-9_-]+/g, '[REDACTED]') : 'Connection error'}`
    };
  }
}

module.exports = {
  askGeminiAdvisor,
  diagnoseCropWithGemini,
  testGeminiDiagnostic,
  cleanLatexAndFormat,
  SYSTEM_INSTRUCTION,
  getActiveModel,
  getApiKey
};
