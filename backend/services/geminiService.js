const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { generateStandardStructuredAdvice } = require('../utils/universalAgricultureEngine');

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

const SYSTEM_INSTRUCTION_GU = `IMPORTANT: You are an agricultural expert advising a farmer in Gujarat. You must answer ONLY in pure Gujarati (ગુજરાતી). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Gujarati. Do not use LaTeX symbols.`;

const SYSTEM_INSTRUCTION_BN = `IMPORTANT: You are an agricultural expert advising a farmer in West Bengal. You must answer ONLY in pure Bengali (বাংলা). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Bengali. Do not use LaTeX symbols.`;

const SYSTEM_INSTRUCTION_TA = `IMPORTANT: You are an agricultural expert advising a farmer in Tamil Nadu. You must answer ONLY in pure Tamil (தமிழ்). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Tamil. Do not use LaTeX symbols.`;

const SYSTEM_INSTRUCTION_TE = `IMPORTANT: You are an agricultural expert advising a farmer in Andhra Pradesh or Telangana. You must answer ONLY in pure Telugu (తెలుగు). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Telugu. Do not use LaTeX symbols.`;

const SYSTEM_INSTRUCTION_KN = `IMPORTANT: You are an agricultural expert advising a farmer in Karnataka. You must answer ONLY in pure Kannada (ಕನ್ನಡ). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Kannada. Do not use LaTeX symbols.`;

const SYSTEM_INSTRUCTION_ML = `IMPORTANT: You are an agricultural expert advising a farmer in Kerala. You must answer ONLY in pure Malayalam (മലയാളം). Do not output English or Hindi explanations. Every heading, explanation, fertilizer name, and instruction must be written in Malayalam. Do not use LaTeX symbols.`;

function getSystemInstruction(language = 'hi') {
  const l = (language || 'hi').toLowerCase();
  if (l === 'en') return SYSTEM_INSTRUCTION_EN;
  if (l === 'mr') return SYSTEM_INSTRUCTION_MR;
  if (l === 'pa') return SYSTEM_INSTRUCTION_PA;
  if (l === 'gu') return SYSTEM_INSTRUCTION_GU;
  if (l === 'bn') return SYSTEM_INSTRUCTION_BN;
  if (l === 'ta') return SYSTEM_INSTRUCTION_TA;
  if (l === 'te') return SYSTEM_INSTRUCTION_TE;
  if (l === 'kn') return SYSTEM_INSTRUCTION_KN;
  if (l === 'ml') return SYSTEM_INSTRUCTION_ML;
  return SYSTEM_INSTRUCTION_HI;
}

function getLanguagePromptName(language = 'hi') {
  const l = (language || 'hi').toLowerCase();
  if (l === 'en') return 'English';
  if (l === 'mr') return 'Marathi (मराठी)';
  if (l === 'pa') return 'Punjabi (ਪੰਜਾਬੀ)';
  if (l === 'gu') return 'Gujarati (ગુજરાતી)';
  if (l === 'bn') return 'Bengali (বাংলা)';
  if (l === 'ta') return 'Tamil (தமிழ்)';
  if (l === 'te') return 'Telugu (తెలుగు)';
  if (l === 'kn') return 'Kannada (ಕನ್ನಡ)';
  if (l === 'ml') return 'Malayalam (മലയാളം)';
  if (l === 'or') return 'Odia (ଓଡ଼ିଆ)';
  if (l === 'as') return 'Assamese (অসমীয়া)';
  return 'Hindi (हिंदी)';
}

const SYSTEM_INSTRUCTION = SYSTEM_INSTRUCTION_HI;

function normalizeMimeType(mime) {
  if (!mime || typeof mime !== 'string') return 'image/jpeg';
  const clean = mime.toLowerCase().trim();
  if (clean === 'image/jpg') return 'image/jpeg';
  return clean;
}

function getActiveModel() {
  const model = process.env.GEMINI_MODEL;
  if (model && !model.includes('3.8') && !model.includes('3.7') && !model.includes('2.0') && !model.includes('1.5') && !model.includes('2.5')) {
    return model;
  }
  return 'gemini-3.5-flash-lite';
}

function getCandidateModels() {
  const primary = getActiveModel();
  const list = [primary, 'gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-flash-lite-latest', 'gemini-3.5-flash'];
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

const SENIOR_SCIENTIST_SYSTEM_INSTRUCTION = `You are a Senior Agricultural Scientist (Senior Krishi Vigyan Kendra - KVK Expert) and Chief Agronomist at Krishi Drishti & SWAR.
Your mission is to accurately diagnose real farmer problems and provide precise, practical, and dynamic agricultural solutions tailored specifically to the farmer's raw voice/text query and farm context.

CRITICAL EXPERT INSTRUCTIONS:
1. ACCURATE SPECIFIC DIAGNOSIS:
   - Identify the exact crop and exact diagnostic condition from the farmer's question.
   - For example:
     * "tamatar ke leaf pe white spots" -> Crop: "Tomato (टमाटर)", Issue: "Powdery Mildew / छाछिया रोग (सफेद फफूंद धब्बे)"
     * "gehun kala ho gaya" -> Crop: "Wheat (गेहूं)", Issue: "Karnal Bunt / Loose Smut / करनाल बंट व काला धब्बा रोग"
     * "khet me pani lag gaya" or "pani bhar gaya" -> Crop: detected crop or "Field Crop", Issue: "Waterlogging & Root Zone Saturation (खेत में जलभराव व जड़ों का दम घुटना)"
     * "patte brown ho rahe hain" -> Crop: detected crop, Issue: "Foliar Blight / Leaf Necrosis (अगेती/पछेती झुलसा व पत्तियों का भूरापन)"
     * "keede lag gaye" -> Crop: detected crop, Issue: "Pest Infestation (कीट / इल्ली / रस चूसक कीटों का प्रकोप)"
     * "healthy hai" / no problem reported -> Crop: detected crop, Issue: "Healthy Crop - Normal Growth (फसल स्वस्थ है)"

2. REALISTIC DYNAMIC HEALTH SCORE (Between 1 and 100):
   - Critical disease / severe waterlogging / severe pest: 30 to 45 (CRITICAL).
   - High disease / significant pest attack / drought: 46 to 59 (NEEDS ATTENTION).
   - Moderate stress / mild yellowing / poor growth: 60 to 75 (MODERATE).
   - Healthy / normal growth: 85 to 95 (GOOD).
   - NEVER return 87 if there is an active disease, pest, or waterlogging!

3. STRICT DYNAMIC JSON SCHEMA ENFORCEMENT:
   You MUST return ONLY a valid JSON object adhering strictly to this schema:
{
  "crop_name": "string (detected from query or default)",
  "detected_issue": "string (exact diagnostic, e.g., Powdery Mildew, Waterlogging, Karnal Bunt)",
  "severity": "Low | Moderate | High | Critical",
  "health_score": 45,
  "what_needs_attention": {
    "title": "Short Hindi summary of the exact threat",
    "description": "Clear explanation of why this issue happened"
  },
  "what_to_do_now": [
    {
      "action_title": "Primary immediate remedy (e.g., specific fungicide name/dose or water drainage steps)",
      "timing": "Aaj (Immediate) | 24 ghante ke andar",
      "instruction": "Step-by-step actionable advice in farmer-friendly Hindi"
    }
  ],
  "why_is_this_happening": "Underlying root cause (humidity, poor drainage, fungal attack, nutrient deficiency)",
  "action_timeline": {
    "today": "string",
    "in_24_hours": "string",
    "in_2_3_days": "string",
    "next_7_days": "string"
  }
}

Use respectful, clear Hindi (or the user's preferred regional language). Do not wrap in markdown or backticks. Return pure JSON only.`;

function buildReadableAnswerFromStructured(s, lang = 'hi') {
  if (!s) return '';
  const isEn = lang === 'en';
  const lines = [];

  const crop = s.crop_name || (isEn ? 'Your Crop' : 'आपकी फसल');
  const issue = s.detected_issue || (isEn ? 'Crop Consultation' : 'फसल परामर्श');
  const sev = s.severity || 'Normal';
  const score = s.health_score ?? 80;

  lines.push(isEn ? `🌾 Crop: ${crop} | Issue: ${issue}` : `🌾 फसल: ${crop} | समस्या: ${issue}`);
  lines.push(isEn ? `🚨 Priority: ${sev} (Crop Health Score: ${score}%)` : `🚨 प्राथमिकता: ${sev} (फसल स्वास्थ्य स्कोर: ${score}%)`);
  lines.push('');

  if (s.what_needs_attention?.title) {
    lines.push(isEn ? `⚠️ What Needs Attention:` : `⚠️ क्या ध्यान देने की आवश्यकता है:`);
    lines.push(`• ${s.what_needs_attention.title}: ${s.what_needs_attention.description || ''}`);
    lines.push('');
  }

  if (s.why_is_this_happening) {
    lines.push(isEn ? `💡 Why This Is Happening:` : `💡 ऐसा क्यों हो रहा है:`);
    lines.push(s.why_is_this_happening);
    lines.push('');
  }

  if (Array.isArray(s.what_to_do_now) && s.what_to_do_now.length > 0) {
    lines.push(isEn ? `✅ What You Should Do Now:` : `✅ अभी आपको क्या करना चाहिए:`);
    s.what_to_do_now.forEach((item, idx) => {
      lines.push(`${idx + 1}. [${item.timing || 'Immediate'}] ${item.action_title ? item.action_title + ' — ' : ''}${item.instruction}`);
    });
    lines.push('');
  }

  if (s.action_timeline) {
    lines.push(isEn ? `⏰ Action Timeline:` : `⏰ समय-सारणी:`);
    if (s.action_timeline.today) lines.push(isEn ? `• Today: ${s.action_timeline.today}` : `• आज: ${s.action_timeline.today}`);
    if (s.action_timeline.in_24_hours) lines.push(isEn ? `• 24 Hours: ${s.action_timeline.in_24_hours}` : `• 24 घंटे में: ${s.action_timeline.in_24_hours}`);
    if (s.action_timeline.in_2_3_days) lines.push(isEn ? `• In 2–3 Days: ${s.action_timeline.in_2_3_days}` : `• 2–3 दिन में: ${s.action_timeline.in_2_3_days}`);
    if (s.action_timeline.next_7_days) lines.push(isEn ? `• Next 7 Days: ${s.action_timeline.next_7_days}` : `• अगले 7 दिन में: ${s.action_timeline.next_7_days}`);
  }

  return lines.join('\n').trim();
}

/**
 * Ask Gemini Conversational Agriculture Advisor
 * Senior Agricultural Scientist (KVK Expert) with Strict Dynamic JSON Schema Enforcement
 */
async function askGeminiAdvisor({
  question,
  crop = 'General',
  cropStage = '',
  soil = null,
  weather = null,
  location = '',
  language = 'hi',
  conversationHistory = [],
  unifiedPrompt = null,
  farmContext = null
}) {
  const q = (question || '').trim();
  if (!q && !unifiedPrompt) {
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
    const weatherStr = typeof weather === 'object' ? `${weather.temp || weather.temperature || ''}°C, ${weather.condition || ''}` : String(weather);
    if (weatherStr.trim() !== '°C,') contextTokens.push(`Weather: ${weatherStr}`);
  }
  const langPromptName = getLanguagePromptName(language);
  contextTokens.push(`Language: ${langPromptName}`);

  // Construct prompt
  let finalPrompt = `Farmer Raw Query: "${q}"\nCrop Context: ${crop} | Stage: ${cropStage || 'Vegetative'} | Soil: ${soil?.soilType || 'Normal'} | Weather: ${weather?.temp || 27}°C\n\nDiagnose the exact agricultural issue and return JSON matching the required schema:`;
  if (unifiedPrompt && typeof unifiedPrompt === 'string' && unifiedPrompt.trim()) {
    finalPrompt = `${unifiedPrompt.trim()}\n\nCRITICAL: Return your response ONLY as valid JSON according to the Senior Scientist schema.`;
  }

  const contents = [{
    role: 'user',
    parts: [{ text: finalPrompt }]
  }];

  let lastError = null;
  let successfulModel = null;
  let structuredAdvice = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction: SENIOR_SCIENTIST_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      });

      const text = response?.text?.trim() || '';
      if (text) {
        try {
          structuredAdvice = JSON.parse(text);
          successfulModel = modelName;
          break;
        } catch (_) {
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              structuredAdvice = JSON.parse(match[0]);
              successfulModel = modelName;
              break;
            } catch (err) {}
          }
        }
      }
    } catch (err) {
      console.warn(`[Krishi Drishti] Gemini model ${modelName} json advice error:`, err.message || err);
      lastError = err;
    }
  }

  // If Gemini provided valid structured advice, build answer and return
  if (structuredAdvice && structuredAdvice.detected_issue) {
    const answerText = buildReadableAnswerFromStructured(structuredAdvice, language);
    return {
      success: true,
      answer: answerText,
      structuredAdvice,
      language: language || 'hi',
      crop: structuredAdvice.crop_name || crop,
      stage: cropStage,
      model: successfulModel,
      timestamp: new Date().toISOString()
    };
  }

  // Graceful, dynamic expert fallback rule generation (NEVER static dummy data)
  console.log('[Krishi Drishti] Generating dynamic Senior KVK Scientist advice via Agronomy Rule Engine...');
  const fallbackAdvice = generateStandardStructuredAdvice({
    query: q,
    crop,
    farmContext,
    language
  });

  return {
    success: true,
    answer: buildReadableAnswerFromStructured(fallbackAdvice, language),
    structuredAdvice: fallbackAdvice,
    language: language || 'hi',
    crop: fallbackAdvice.crop_name || crop,
    stage: cropStage,
    model: 'kvk_scientific_rules_engine',
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

  let base64Data = '';
  if (Buffer.isBuffer(imageBuffer)) {
    base64Data = imageBuffer.toString('base64');
  } else if (typeof imageBuffer === 'string') {
    base64Data = imageBuffer.replace(/^data:image\/[a-z0-9-+.]+;base64,/i, '').trim();
  }
  const cleanMimeType = normalizeMimeType(mimeType);
  const langPromptName = getLanguagePromptName(language);

  const userPrompt = `You are Krishi Drishti Agricultural AI Multimodal Vision Expert.
You are examining a photograph uploaded by an Indian farmer.
Selected language: ${langPromptName}.

CRITICAL MULTIMODAL VISION INSTRUCTIONS:
1. FIRST, determine whether the uploaded image actually contains an agricultural plant, crop, or leaf:
   - If the image does NOT appear to be a plant/crop/leaf (e.g. random non-plant object, animal, vehicle, human, indoor room, solid color, completely black/white):
     Set "isPlant": false.
     Set "isIdentifiable": false.
     Set "unclearMessage": A clear and polite message in ${langPromptName} stating that the uploaded image does not appear to be a crop/plant/leaf, and asking the farmer to upload a clear photo of the crop or affected leaf.
   - If the image is extremely blurry, too dark, out of focus, or contains multiple uncertain crops without identifiable features:
     Set "isPlant": true.
     Set "isIdentifiable": false.
     Set "unclearMessage": A clear polite explanation in ${langPromptName} asking for a clearer, well-lit photo of the affected plant or leaf.

2. IF IT IS A PLANT / CROP / LEAF:
   - AUTOMATIC CROP IDENTIFICATION: Identify the most likely crop species from visible characteristics (e.g. Wheat, Rice / Paddy, Tomato, Potato, Cotton, Maize, Chilli, Onion, Mustard, Soybean, Sugarcane, etc.).
     Do NOT ask the farmer to specify the crop. Crop identification must come directly from the image.
   - PLANT PART: Identify the specific plant part shown (e.g. Leaf, Stem, Fruit, Flower, Root, Whole Plant) in ${langPromptName}.
   - HEALTH STATUS: Choose from "Healthy", "Diseased", "Stressed", "Pest Infested", "Attention Needed".
   - DETECTED PROBLEM: Name of the visible disease, pest, nutrient deficiency, environmental stress, or 'Healthy Crop / No Obvious Disease' in ${langPromptName}.
     CRITICAL: If the crop is healthy with no obvious issues, report it as Healthy. NEVER fabricate or invent a disease when symptoms are absent.
   - CONFIDENCE: Numerical confidence percentage (e.g. 85, 92) and confidence level ("High", "Medium", "Low").
     If the image has suboptimal lighting or mild blur, lower the confidence accordingly and advise on field inspection.
   - VISIBLE SYMPTOMS: Describe specific visible marks, lesions, powder, spots, curling, discoloration observed directly in the photo in ${langPromptName}.
   - RECOMMENDED ACTIONS: Provide 2 to 4 actionable, practical steps for the farmer in ${langPromptName}.
   - ORGANIC TREATMENT: Safe biological or organic remedy in ${langPromptName}.
   - CHEMICAL TREATMENT: Approved chemical fungicide/pesticide with standard dosage guidelines in ${langPromptName}.
   - PREVENTION: 2 to 3 preventive measures in ${langPromptName}.
   - WHEN TO SEEK EXPERT HELP: Clear advice on when to consult the local Krishi Vigyan Kendra (KVK) or Block Agriculture Officer in ${langPromptName}.
   - CONVERSATIONAL ADVICE: A comprehensive, warm, natural advisory response in ${langPromptName} addressing both the uploaded photo and the farmer's question.

Farmer Note / Question: ${question || (language === 'en' ? 'Identify the crop, inspect plant health, and provide practical care advice.' : 'कृपया इस फसल की तस्वीर का विश्लेषण करें, फसल पहचानें और रोग व उपचार बताएं।')}

STRICT LANGUAGE REQUIREMENT:
Every single field and value in your response MUST be generated entirely in ${langPromptName}.
${language === 'en' ? 'ABSOLUTELY NO Hindi or Devanagari script words. Pure English only.' : ''}
${language === 'hi' ? 'ABSOLUTELY NO English paragraphs. Pure Hindi (सरल देवनागरी हिंदी) only.' : ''}

You MUST return a VALID JSON object (and nothing else) enclosed in \`\`\`json ... \`\`\` with this exact schema:
{
  "isPlant": true,
  "isIdentifiable": true,
  "unclearMessage": "",
  "cropName": "Crop species name in ${langPromptName}",
  "plantPart": "Leaf / Stem / Fruit / Flower / Whole Plant in ${langPromptName}",
  "healthStatus": "Healthy" | "Diseased" | "Stressed" | "Pest Infested" | "Attention Needed",
  "detectedProblem": "Name of the problem or 'Healthy Crop' in ${langPromptName}",
  "confidence": 92,
  "confidenceLevel": "High" | "Medium" | "Low",
  "visibleSymptoms": "Detailed visible symptoms observed directly in the photo in ${langPromptName}",
  "recommendedActions": [
    "Step 1 in ${langPromptName}",
    "Step 2 in ${langPromptName}"
  ],
  "organicTreatment": "Organic remedy in ${langPromptName}",
  "chemicalTreatment": "Approved chemical treatment with dosage in ${langPromptName}",
  "preventionTips": [
    "Prevention tip 1 in ${langPromptName}",
    "Prevention tip 2 in ${langPromptName}"
  ],
  "whenToSeekExpert": "Advice on when to consult local KVK or specialist in ${langPromptName}",
  "conversationalAdvice": "Natural, thorough advice in ${langPromptName} answering the farmer's question and image diagnosis."
}`;

  const contents = [
    {
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: cleanMimeType,
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

  // If Gemini flagged image as not a plant or unclear / unidentifiable
  const isIdentifiable = parsedJson?.isIdentifiable !== false && parsedJson?.isPlant !== false;
  if (!isIdentifiable) {
    const isNonPlant = parsedJson?.isPlant === false;
    const fallbackMsg = isNonPlant
      ? (language === 'en'
          ? "The uploaded image does not appear to contain a crop, plant, or leaf. Please upload a clear photo of your crop or affected plant part."
          : "अपलोड की गई तस्वीर किसी फसल, पौधे या पत्ते की नहीं लगती है। कृपया अपनी फसल अथवा प्रभावित पत्ती की साफ फोटो अपलोड करें।")
      : (language === 'en'
          ? "I couldn't confidently identify the crop from this image. Please upload a clear photo of the plant or affected leaf."
          : "मैं इस तस्वीर से फसल की सही पहचान नहीं कर पाया। कृपया पौधे या प्रभावित पत्ते की एक साफ तस्वीर अपलोड करें।");
    
    const unclearMessage = parsedJson?.unclearMessage || fallbackMsg;

    return {
      success: true,
      isPlant: false,
      isIdentifiable: false,
      unclearMessage,
      answer: unclearMessage,
      language,
      model: successfulModel,
      timestamp: new Date().toISOString(),
      data: {
        isPlant: false,
        isIdentifiable: false,
        unclearMessage,
        cropName: null,
        plantPart: null,
        healthStatus: 'Unknown',
        detectedProblem: null,
        confidence: 0,
        confidenceLevel: 'Low',
        severity: 'None'
      }
    };
  }

  // Extract fields from parsed JSON or smart regex fallbacks
  const detectedCrop = parsedJson?.cropName ||
    extractSection(answerText, ['crop', 'फसल', 'detected crop', 'पौधा']) ||
    (language === 'en' ? 'Identified Crop' : 'पहचानी गई फसल');

  const plantPart = parsedJson?.plantPart ||
    extractSection(answerText, ['plant part', 'पौधे का भाग', 'भाग']) ||
    (language === 'en' ? 'Leaf / Foliage' : 'पत्ती / पौधा');

  const healthStatus = parsedJson?.healthStatus ||
    (answerText.toLowerCase().includes('healthy') || answerText.includes('स्वस्थ') ? 'Healthy' : 'Diseased');

  const detectedProblem = parsedJson?.detectedProblem ||
    extractSection(answerText, ['संभावित समस्या', 'संभावित रोग', 'बीमारी', 'likely problem', 'problem', 'disease', 'issue']) ||
    (healthStatus === 'Healthy' 
      ? (language === 'en' ? 'Healthy Crop (No Obvious Disease)' : 'स्वस्थ फसल (कोई स्पष्ट रोग नहीं)')
      : (language === 'en' ? 'Foliage Stress / Infection' : 'पत्तियों पर रोग लक्षण'));

  const visibleSymptoms = parsedJson?.visibleSymptoms ||
    parsedJson?.whatAiFound ||
    extractSection(answerText, ['what ai found', 'लक्षण', 'visible symptoms', 'symptoms']) ||
    (language === 'en' ? 'Visual examination shows localized stress on foliage.' : 'दृश्य निरीक्षण में पत्तियों पर तनाव व लक्षण दिखाई दे रहे हैं।');

  const recommendedActions = Array.isArray(parsedJson?.recommendedActions) && parsedJson.recommendedActions.length > 0
    ? parsedJson.recommendedActions
    : (parsedJson?.recommendedAction ? [parsedJson.recommendedAction] : [
        language === 'en' ? 'Inspect affected leaves and follow recommended treatment.' : 'प्रभावित पत्तियों का निरीक्षण करें और अनुशंसित उपचार तुरंत अपनाएं।'
      ]);

  const recommendedAction = recommendedActions[0] || (language === 'en' ? 'Inspect foliage.' : 'पत्तियों का निरीक्षण करें।');

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

  const whenToSeekExpert = parsedJson?.whenToSeekExpert ||
    parsedJson?.importantNote ||
    (language === 'en' 
      ? 'If symptoms spread to more than 15-20% of the field within 3 days, immediately consult your local Krishi Vigyan Kendra (KVK).'
      : 'यदि 3 दिनों के भीतर लक्षण 15-20% से अधिक फसल में फैलते हैं, तो तुरंत अपने स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क करें।');

  const nextActionTimeline = parsedJson?.nextActionTimeline ||
    (language === 'en' ? 'Re-inspect foliage within 48 hours of treatment.' : 'उपचार के 48 घंटों के भीतर पत्तियों का पुनः निरीक्षण करें।');

  const confidenceVal = Number(parsedJson?.confidence) || 92;
  const confidenceLevel = parsedJson?.confidenceLevel || (confidenceVal >= 85 ? 'High' : (confidenceVal >= 65 ? 'Medium' : 'Low'));
  const severityVal = parsedJson?.severity ||
    (healthStatus === 'Healthy' ? 'None' : (confidenceVal >= 85 ? 'Medium' : 'Low'));

  const conversationalAdvice = parsedJson?.conversationalAdvice || answerText;

  return {
    success: true,
    isPlant: true,
    isIdentifiable: true,
    answer: conversationalAdvice,
    crop: detectedCrop,
    cropName: detectedCrop,
    plantPart,
    healthStatus,
    detectedProblem,
    confidence: confidenceVal,
    confidenceLevel,
    visibleSymptoms,
    recommendedActions,
    organicTreatment,
    chemicalTreatment,
    preventionTips,
    whenToSeekExpert,
    language,
    model: successfulModel,
    timestamp: new Date().toISOString(),
    diagnosis: {
      cropIdentified: detectedCrop,
      plantPart,
      healthStatus,
      detectedProblem,
      confidence: `${confidenceVal}%`,
      confidenceLevel,
      visibleSymptoms,
      recommendedActions,
      immediateAction: recommendedAction,
      treatment: `${organicTreatment} | ${chemicalTreatment}`,
      prevention: preventionTips.join(' • '),
      whenToSeekExpert
    },
    data: {
      isPlant: true,
      isIdentifiable: true,
      cropName: detectedCrop,
      plantPart,
      healthStatus,
      detectedProblem,
      detectedProblemHi: language === 'hi' ? detectedProblem : '',
      confidence: confidenceVal,
      confidenceLevel,
      severity: severityVal,
      visibleSymptoms,
      whatAiFound: visibleSymptoms,
      cause: visibleSymptoms,
      causeHi: language === 'hi' ? visibleSymptoms : '',
      symptoms: [visibleSymptoms],
      recommendedActions,
      recommendedAction,
      recommendedActionHi: language === 'hi' ? recommendedAction : '',
      organicTreatment,
      chemicalTreatment,
      preventionTips,
      whenToSeekExpert,
      importantNote: whenToSeekExpert,
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
