const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

/**
 * Krishi Drishti Agricultural AI System Instruction
 * Expert, practical, and farmer-friendly assistant for Indian agriculture.
 */
const SYSTEM_INSTRUCTION = `IMPORTANT: You are an agricultural expert advising an Indian farmer. You must answer ONLY in pure Hindi (हिंदी / Devanagari script). Do not output English sentences or English explanations. Every heading, explanation, fertilizer name, and instruction must be written in Hindi. Do not use LaTeX symbols like $\\circ$ or \\text{}; write temperatures simply as '24°C से 29°C'.

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
1. Crop Selection, Sowing & Agronomy:
   - Sowing dates, seed rate, seed treatment (fungicide/bio-fertilizer like Rhizobium/Trichoderma), nursery raising, spacing, transplanting, plant population.
   - Crop stages: germination, vegetative, tillering, flowering, fruit set, grain filling, maturity, harvesting.
2. Crop Pathology, Symptoms & Disease Management:
   - Identifying symptoms: yellowing leaves (chlorosis), leaf spots, blights, rusts, wilting, leaf curl, damping off, powdery/downy mildew, mosaic patterns, root rot, fruit borer damage.
   - Diagnosing fungal, bacterial, and viral plant pathogens.
3. Pest Attacks & Insect Management:
   - Sucking pests: whiteflies, aphids, thrips, jassids, mites.
   - Borers & caterpillars: pink bollworm, fall armyworm, fruit borer, stem borer, leaf miners.
   - Integrated Pest Management (IPM): yellow/blue sticky traps, pheromone traps, light traps, neem-based sprays, biocontrol agents (Trichoderma, Pseudomonas, Beauveria).
4. Soil Health & Plant Nutrition:
   - Soil types (Alluvial, Black, Red, Sandy loam, Clayey), pH balance, organic carbon.
   - Primary fertilizers (NPK - Nitrogen, Phosphorus, Potassium), Urea, DAP, MOP, SSP.
   - Secondary & micronutrients: Zinc (ZnSO4), Boron, Iron, Magnesium, Sulphur deficiency symptoms and foliar corrections.
   - Organic manures, FYM, vermicompost, Jeevamrut, green manuring.
5. Irrigation & Water Scheduling:
   - Critical stages of irrigation for wheat (CRI stage, tillering, flowering, milking), rice (standing water vs alternate wetting & drying), tomato, cotton, potato, onion, chilli.
   - Micro-irrigation: drip irrigation, fertigation scheduling, sprinkler systems, water conservation.
6. Weed Control:
   - Pre-emergence and post-emergence weed control, hand weeding, mulching.
7. Weather-Related Stress Management:
   - Heat wave stress, cold waves/frost protection (smudging, light irrigation), unseasonal rain damage, waterlogging mitigation, drought survival.
8. Government Schemes & Mandi Advice:
   - Information on PM-KISAN, PMFBY (Pradhan Mantri Fasal Bima Yojana), Kisan Credit Card (KCC), Soil Health Card scheme.
   - Mandi/market advice when price information is provided.

CRITICAL DIAGNOSTIC & BEHAVIORAL RULES:
1. DO NOT BLINDLY GUESS:
   - Never invent or assume a disease with certainty if symptoms are vague or incomplete.
   - If the symptoms described or seen are insufficient to diagnose accurately, clearly explain in Hindi that more details are needed, and ask 2-3 focused, helpful follow-up questions in Hindi.
2. STRUCTURE FOR CROP DISEASE, PEST & SYMPTOM QUESTIONS:
   Whenever answering a disease, pest, or physiological symptom question, you MUST structure your response cleanly in Hindi with bold headings:
   1. संभावित समस्या या रोग (Likely Problem / Issue)
   2. होने का मुख्य कारण (Main Causes / Why it happens)
   3. तुरंत क्या करें / जरूरी कदम (What to do NOW / Immediate Action)
   4. उपचार एवं प्रबंधन (जैविक व रासायनिक विकल्प) (Treatment & Management)
   5. भविष्य में बचाव के उपाय (Prevention for Future)
   6. कृषि विशेषज्ञ / KVK से सलाह (When to consult Agriculture Officer / KVK)
3. SAFE & RESPONSIBLE CHEMICAL ADVICE:
   - DO NOT invent chemical trade names, unrealistic concentrations, or unapproved dosages.
   - When suggesting standard active ingredients (e.g., Mancozeb, Copper Oxychloride, Imidacloprid, Chlorantraniliprole, Neem Oil), provide general reference concentrations in Hindi (e.g. 2 ग्राम प्रति लीटर पानी) and ALWAYS include the standard disclaimer in Hindi: "दवा के पैकेट पर दिए गए निर्देशों को ध्यानपूर्वक पढ़ें और प्रयोग से पहले स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से परामर्श अवश्य लें।"
4. MULTIMODAL & IMAGE DIAGNOSIS RULES:
   - When analyzing an uploaded image, describe what is visibly evident clearly in Hindi.
   - Give realistic confidence and acknowledge uncertainty. Never claim 100% certainty from a photograph alone.
   - If the photo is blurry, too dark, out of focus, or does not clearly show the affected plant parts, clearly instruct the farmer in Hindi: "फोटो स्पष्ट नहीं है। कृपया प्रभावित पत्ती या पौधे के हिस्से की साफ और अच्छी रोशनी वाली फोटो अपलोड करें।"`;

/**
 * Get active Gemini Flash model with configurable fallback
 */
function getActiveModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.7-flash';
}

function getCandidateModels() {
  const primary = getActiveModel();
  const list = [primary, 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
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
  contextTokens.push('Language: Pure Hindi (सरल देवनागरी हिंदी)');

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
          systemInstruction: SYSTEM_INSTRUCTION,
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
    }
  }

  if (!answerText) {
    throw formatGeminiError(lastError);
  }

  return {
    success: true,
    answer: answerText,
    language: 'hi',
    crop,
    stage: cropStage,
    model: successfulModel,
    timestamp: new Date().toISOString()
  };
}

/**
 * Diagnose Crop Disease from Image using Gemini Multimodal Vision
 */
async function diagnoseCropWithGemini({
  imageBuffer,
  mimeType = 'image/jpeg',
  question = '',
  crop = 'Tomato',
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

  const contextTokens = [];
  if (crop) contextTokens.push(`Crop: ${crop}`);
  if (cropStage) contextTokens.push(`Stage: ${cropStage}`);
  contextTokens.push('Language: Pure Hindi (सरल देवनागरी हिंदी)');

  const userPrompt = `IMPORTANT: You are an agricultural expert advising an Indian farmer. You must answer ONLY in pure Hindi (हिंदी / Devanagari script). Do not output English sentences or English explanations. Every heading, explanation, fertilizer name, and instruction must be written in Hindi. Do not use LaTeX symbols like $\\circ$ or \\text{}; write temperatures simply as '24°C से 29°C'.

You are examining a photograph uploaded by an Indian farmer.
[Context: ${contextTokens.join(' | ')}]
Farmer's Note/Question: ${question || 'कृपया इस फसल की तस्वीर का विश्लेषण करें और बीमारी, कीट व उपचार बताएं।'}

Please perform an in-depth agricultural inspection of this image with clear sections in Hindi:
1. दिखने वाले लक्षण (Visible Symptoms)
2. संभावित समस्या या रोग (Likely Problem / Disease)
3. विश्वसनीयता व सावधानी (Confidence & Field Verification)
4. तुरंत क्या करें (Immediate Action for Today)
5. उपचार एवं प्रबंधन: जैविक उपाय (Organic Options) व रासायनिक उपाय (Chemical Options)
6. भविष्य में बचाव के उपाय (Prevention Tips)
7. कृषि विशेषज्ञ / KVK से सलाह (When to consult KVK or Agriculture Officer)

MANDATORY INSTRUCTIONS:
- Respond completely in simple, easy-to-understand Hindi (Devanagari script) suitable for an Indian farmer.
- Do not generate English explanations or mixed English paragraphs. Keep headings, bullet points, remedies, and dosages strictly in clear Hindi.
- Ensure scientific names can be in brackets, but the main explanation, steps, and advice must be purely Hindi.
- Fix LaTeX output issues: Do not output broken symbols like '$24^\\circ\\text{C}$'; use standard text like '24°C से 29°C'.`;

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
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.5,
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

  // Extract structured highlights from answer for UI display
  const detectedProblem = extractSection(answerText, ['संभावित समस्या', 'संभावित रोग', 'बीमारी', 'likely problem', 'problem', 'issue']) || `${crop} समस्या`;
  const recommendedAction = extractSection(answerText, ['तुरंत क्या करें', 'जरूरी कदम', 'immediate action', 'what to do now', 'action']) || 'प्रभावित पत्तियों का निरीक्षण करें और अनुशंसित उपचार तुरंत अपनाएं।';
  const organicTreatment = extractSection(answerText, ['जैविक उपाय', 'जैविक', 'bio-control', 'neem', 'organic']) || 'नीम का तेल (5 मि.ली./लीटर पानी) और प्रभावित पत्तियों को हटाएं।';
  const chemicalTreatment = extractSection(answerText, ['रासायनिक उपाय', 'रासायनिक', 'fungicide', 'insecticide', 'chemical']) || 'लेबल पर दिए गए निर्देशों के अनुसार अनुमोदित फफूंदनाशक का छिड़काव करें।';

  return {
    success: true,
    answer: answerText,
    crop,
    stage: cropStage,
    language: 'hi',
    model: successfulModel,
    timestamp: new Date().toISOString(),
    diagnosis: {
      visibleSymptoms: answerText.slice(0, 300) + '...',
      possibleCauses: detectedProblem,
      confidence: 'मध्यम से उच्च (फोटो आधारित आकलन)',
      immediateAction: recommendedAction,
      treatment: `${organicTreatment} | ${chemicalTreatment}`,
      prevention: 'उचित दूरी, संतुलित खाद प्रबंधन और समय पर खेत का निरीक्षण करें।'
    },
    data: {
      cropName: crop,
      detectedProblem,
      detectedProblemHi: detectedProblem,
      confidence: 90,
      severity: answerText.toLowerCase().includes('critical') || answerText.toLowerCase().includes('severe') || answerText.includes('गंभीर') ? 'High' : 'Medium',
      cause: detectedProblem,
      causeHi: detectedProblem,
      symptoms: [detectedProblem],
      recommendedAction,
      recommendedActionHi: recommendedAction,
      organicTreatment,
      chemicalTreatment,
      preventionTips: [
        'खेत की स्वच्छता बनाए रखें और खरपतवार नष्ट करें',
        'जलभराव से बचें और फसल चक्र अपनाएं',
        'सटीक जांच हेतु स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क करें'
      ],
      nextActionTimeline: 'उपचार के 48 घंटों के भीतर पत्तियों का पुनः निरीक्षण करें।'
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
