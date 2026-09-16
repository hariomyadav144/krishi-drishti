const { GoogleGenAI } = require('@google/genai');

/**
 * Krishi Drishti - Crop Scan Comparison Engine
 * Computes comparative health trajectory across 10 distinct agronomic points.
 */

// Health state weights for calculating progression
const SEVERITY_SCORES = {
  'None (Healthy)': 100,
  'Healthy': 100,
  'Good': 85,
  'Low': 75,
  'Moderate': 60,
  'Medium': 50,
  'Needs Attention': 45,
  'High': 30,
  'Critical': 15,
  'Diseased': 15,
};

function getScore(scan) {
  if (typeof scan.healthScore === 'number' && scan.healthScore > 0) {
    return scan.healthScore;
  }
  const sevScore = SEVERITY_SCORES[scan.severity] ?? 50;
  const healthScore = SEVERITY_SCORES[scan.healthStatus] ?? 50;
  return Math.round((sevScore + healthScore) / 2);
}

function determineStatus(oldScore, newScore, oldProblem, newProblem) {
  const diff = newScore - oldScore;
  const isNowHealthy = /healthy|clean|none|no disease/i.test(newProblem);
  const wasDiseased = !/healthy|clean|none|no disease/i.test(oldProblem);

  if (wasDiseased && isNowHealthy) {
    return { status: 'Resolved', statusHi: 'रोग पूरी तरह ठीक हुआ' };
  }
  if (diff >= 12) {
    return { status: 'Improved', statusHi: 'फसल की स्थिति में सुधार' };
  }
  if (diff <= -12) {
    return { status: 'Deteriorated', statusHi: 'स्थिति में गिरावट / रोग बढ़ा' };
  }
  return { status: 'Stable', statusHi: 'स्थिति स्थिर' };
}

async function generateComparativeAnalysis({ oldScan, newScan, language = 'hi' }) {
  const oldDate = new Date(oldScan.scanDate || oldScan.createdAt);
  const newDate = new Date(newScan.scanDate || newScan.createdAt);
  const diffTime = Math.abs(newDate - oldDate);
  const daysBetweenScans = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const oldScore = getScore(oldScan);
  const newScore = getScore(newScan);
  const scoreDiff = newScore - oldScore;
  const { status, statusHi } = determineStatus(oldScore, newScore, oldScan.detectedProblem, newScan.detectedProblem);

  // Format dates for display
  const oldDateStr = oldDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const newDateStr = newDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Extract Treatments
  const oldTreatmentStr = [
    oldScan.recommendedTreatment?.organic,
    oldScan.recommendedTreatment?.chemical,
    oldScan.recommendedTreatment?.general
  ].filter(Boolean).join(' | ') || oldScan.recommendedAction || 'General foliar inspection and isolation';

  const newTreatmentStr = [
    newScan.recommendedTreatment?.organic,
    newScan.recommendedTreatment?.chemical,
    newScan.recommendedTreatment?.general
  ].filter(Boolean).join(' | ') || newScan.recommendedAction || 'Routine maintenance and soil monitoring';

  // Base rule-driven fallback comparison
  let whatChanged = '';
  let whatChangedHi = '';
  let possibleReason = '';
  let possibleReasonHi = '';
  let actionAdvice = '';
  let actionAdviceHi = '';
  let aiSummary = '';
  let aiSummaryHi = '';

  if (status === 'Resolved' || status === 'Improved') {
    whatChanged = `Health score increased by +${Math.abs(scoreDiff)}% over ${daysBetweenScans} days. Symptoms of "${oldScan.detectedProblem}" have receded, showing foliage recovery.`;
    whatChangedHi = `${daysBetweenScans} दिनों में फसल स्वास्थ्य स्कोर +${Math.abs(scoreDiff)}% सुधरा है। "${oldScan.detectedProblemHi || oldScan.detectedProblem}" के लक्षण काफी कम हुए हैं और नई पत्तियां स्वस्थ हैं।`;
    
    possibleReason = `Timely application of recommended treatment (${oldScan.recommendedTreatment?.organic || 'foliar spray'}) along with proper moisture management prevented further lesion expansion.`;
    possibleReasonHi = `अनुशंसित उपचार और उचित सिंचाई प्रबंधन के कारण फफूंद/कीट का प्रसार रुक गया तथा पौधे में रोग प्रतिरोधक क्षमता बढ़ी।`;

    actionAdvice = `Continue balanced nutrition with micronutrients (Zinc + Boron). Avoid water stagnation and inspect weekly to maintain healthy plant vigor.`;
    actionAdviceHi = `संतुलित पोषण (सूक्ष्म पोषक तत्व) का छिड़काव जारी रखें। खेत में जलभराव न होने दें और साप्ताहिक निगरानी रखें ताकि रोग दोबारा न लौटे।`;

    aiSummary = `Significant improvement observed in ${newScan.cropName}. Foliage health has transitioned from ${oldScan.healthStatus} (${oldScore}%) to ${newScan.healthStatus} (${newScore}%).`;
    aiSummaryHi = `${newScan.cropName} की फसल में उल्लेखनीय सुधार दर्ज हुआ है। फसल स्वास्थ्य ${oldScore}% (${oldScan.healthStatus}) से बढ़कर ${newScore}% (${newScan.healthStatus}) तक पहुंच गया है।`;
  } else if (status === 'Deteriorated') {
    whatChanged = `Health score decreased by ${Math.abs(scoreDiff)}% over ${daysBetweenScans} days. Disease severity advanced from ${oldScan.severity} to ${newScan.severity}.`;
    whatChangedHi = `${daysBetweenScans} दिनों में स्वास्थ्य स्कोर में ${Math.abs(scoreDiff)}% की गिरावट आई है। रोग की तीव्रता ${oldScan.severity} से बढ़कर ${newScan.severity} हो गई है।`;

    possibleReason = `Unfavorable microclimate (high humidity or wet foliage) or delayed chemical/organic spray allowed the pathogen to colonize adjacent leaf area.`;
    possibleReasonHi = `अधिक आर्द्रता या छिड़काव में देरी के कारण संक्रमण नई पत्तियों तक फैल गया।`;

    actionAdvice = `Immediately spray the recommended curative treatment (${newScan.recommendedTreatment?.chemical || 'Systemic Fungicide/Insecticide'}). Isolate heavily infected leaves and withhold nitrogen fertilizers temporarily.`;
    actionAdviceHi = `तुरंत अनुशंसित उपचारात्मक दवा का छिड़काव करें। अत्यधिक ग्रसित पत्तियों को नष्ट करें और नाइट्रोजन की अधिक मात्रा देने से बचें।`;

    aiSummary = `Crop health has deteriorated. Urgent intervention is recommended to protect the remaining canopy of ${newScan.cropName}.`;
    aiSummaryHi = `फसल की स्थिति में गिरावट आई है। ${newScan.cropName} को अधिक नुकसान से बचाने हेतु तुरंत उचित उपचार आवश्यक है।`;
  } else {
    whatChanged = `Health condition remained stable (score variance of ${Math.abs(scoreDiff)}% over ${daysBetweenScans} days). No aggressive new lesions observed.`;
    whatChangedHi = `${daysBetweenScans} दिनों के दौरान फसल की स्थिति सामान्य रूप से स्थिर रही (स्कोर में केवल ${Math.abs(scoreDiff)}% का अंतर)।`;

    possibleReason = `Disease progression was arrested, though environmental factors require continued surveillance.`;
    possibleReasonHi = `संक्रमण आगे नहीं बढ़ा है, परंतु अनुकूल मौसम की प्रतीक्षा में रोग सुषुप्त हो सकता है।`;

    actionAdvice = `Maintain preventive spray schedule and ensure drip irrigation lines are flushed cleanly.`;
    actionAdviceHi = `नियमित निवारक छिड़काव जारी रखें और सिंचाई व जल निकास की उचित व्यवस्था रखें।`;

    aiSummary = `Crop health is stable at ${newScore}%. Continue active monitoring.`;
    aiSummaryHi = `फसल की स्थिति ${newScore}% पर स्थिर है। नियमित निगरानी जारी रखें।`;
  }

  // Attempt Gemini AI Enhancement if API key is active
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Chief Agricultural Agronomist for Krishi Drishti (KD).
Compare two historical crop health scans for a farmer and generate a precise, empathetic agronomic comparison.

CROP: ${newScan.cropName} (${newScan.cropVariety || 'Standard Variety'})
TIME GAP: ${daysBetweenScans} days (${oldDateStr} to ${newDateStr})

--- OLD SCAN (${oldDateStr}) ---
- Health Status: ${oldScan.healthStatus} (Score: ${oldScore}%)
- Severity: ${oldScan.severity}
- Detected Problem: ${oldScan.detectedProblem}
- Symptoms: ${(oldScan.symptoms || []).join(', ') || 'N/A'}
- Diagnosis: ${oldScan.diagnosis || oldScan.cause || 'N/A'}
- Treatment Advised: ${oldTreatmentStr}

--- NEW SCAN (${newDateStr}) ---
- Health Status: ${newScan.healthStatus} (Score: ${newScore}%)
- Severity: ${newScan.severity}
- Detected Problem: ${newScan.detectedProblem}
- Symptoms: ${(newScan.symptoms || []).join(', ') || 'N/A'}
- Diagnosis: ${newScan.diagnosis || newScan.cause || 'N/A'}
- Treatment Advised: ${newTreatmentStr}

Return a STRICT JSON object with these EXACT keys (no markdown formatting, no code blocks):
{
  "status": "Improved" | "Deteriorated" | "Stable" | "Resolved",
  "statusHi": "हिंदी में स्थिति",
  "whatChanged": "Detailed English explanation of what specifically changed in the foliage, spots, vigor",
  "whatChangedHi": "हिंदी में विवरण कि फसल में क्या बदलाव हुआ",
  "possibleReason": "Probable agricultural cause (weather, spray adherence, pathogen life cycle)",
  "possibleReasonHi": "हिंदी में कारण",
  "actionAdvice": "Clear next steps the farmer must take today and this week",
  "actionAdviceHi": "किसान के लिए आज और इस सप्ताह के जरूरी कदम",
  "aiSummary": "Summary paragraph in English",
  "aiSummaryHi": "हिंदी में सारांश"
}`;

      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text ? response.text.trim() : '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        if (parsed.whatChanged) whatChanged = parsed.whatChanged;
        if (parsed.whatChangedHi) whatChangedHi = parsed.whatChangedHi;
        if (parsed.possibleReason) possibleReason = parsed.possibleReason;
        if (parsed.possibleReasonHi) possibleReasonHi = parsed.possibleReasonHi;
        if (parsed.actionAdvice) actionAdvice = parsed.actionAdvice;
        if (parsed.actionAdviceHi) actionAdviceHi = parsed.actionAdviceHi;
        if (parsed.aiSummary) aiSummary = parsed.aiSummary;
        if (parsed.aiSummaryHi) aiSummaryHi = parsed.aiSummaryHi;
      }
    } catch (aiErr) {
      console.warn('Gemini comparative analysis fallback to pathology rules:', aiErr.message);
    }
  }

  return {
    status,
    statusHi,
    progressScoreChange: scoreDiff,
    daysBetweenScans,
    healthChange: `${oldScan.healthStatus} (${oldScore}%) → ${newScan.healthStatus} (${newScore}%)`,
    diseaseChange: `${oldScan.detectedProblem} (${oldScan.severity}) → ${newScan.detectedProblem} (${newScan.severity})`,
    symptomsChange: `Past: ${(oldScan.symptoms || []).join(', ') || 'None reported'} → Present: ${(newScan.symptoms || []).join(', ') || 'No active lesions'}`,
    conditionThenVsNow: {
      then: `${oldScan.cropStage || 'Vegetative'} | Severity: ${oldScan.severity} | Score: ${oldScore}%`,
      now: `${newScan.cropStage || 'Vegetative'} | Severity: ${newScan.severity} | Score: ${newScore}%`,
    },
    diseaseThenVsNow: {
      then: oldScan.detectedProblem,
      now: newScan.detectedProblem,
    },
    healthStatusThenVsNow: {
      then: oldScan.healthStatus,
      now: newScan.healthStatus,
    },
    symptomsThenVsNow: {
      then: oldScan.symptoms || [],
      now: newScan.symptoms || [],
    },
    diagnosisThenVsNow: {
      then: oldScan.diagnosis || oldScan.cause || oldScan.detectedProblem,
      now: newScan.diagnosis || newScan.cause || newScan.detectedProblem,
    },
    treatmentThenVsNow: {
      then: oldTreatmentStr,
      now: newTreatmentStr,
    },
    whatChanged,
    whatChangedHi,
    possibleReason,
    possibleReasonHi,
    actionAdvice,
    actionAdviceHi,
    aiSummary,
    aiSummaryHi,
  };
}

module.exports = {
  generateComparativeAnalysis,
  getScore,
};
