/**
 * AI Agriculture Advisory Service for Krishi Drishti
 * Context-aware advisory engine delivering 5-part structured agronomy recommendations.
 */

const predefinedAdvisoryPatterns = [
  {
    triggers: ['yellow', 'pale', 'leaves turning yellow', 'chlorosis', 'पीला', 'पीली'],
    category: 'Fertilizer & Nutrition',
    issue: 'Interveinal Chlorosis and Nitrogen/Iron Deficiency',
    issueHi: 'पत्तियों का पीलापन (नाइट्रोजन एवं आयरन की कमी)',
    reason: 'Heavy leaching of nitrate ions during recent irrigation or restricted nutrient uptake due to alkaline soil pH.',
    reasonHi: 'सिंचाई के बाद नाइट्रोजन की कमी अथवा मिट्टी के अधिक क्षारीय होने से पोषक तत्वों का अवशोषण रुकना।',
    whatToDo: 'Apply foliar spray of water-soluble NPK (19:19:19) @ 5g/L mixed with Chelated Iron (Fe-EDTA) @ 1g/L. Add 100g Urea per knapsack sprayer to enhance foliar absorption.',
    whatToDoHi: '19:19:19 घुलनशील खाद (5 ग्राम/लीटर) और चिलेटेड आयरन (1 ग्राम/लीटर) का पत्तियों पर छिड़काव करें।',
    whenToDo: 'Apply in the early morning between 7:00 AM - 9:30 AM when leaf stomata are open and wind speed is low.',
    whenToDoHi: 'सुबह 7:00 से 9:30 बजे के बीच छिड़काव करें जब पत्तियों के रंध्र खुले हों।',
    whatToAvoid: 'Avoid applying heavy raw urea directly on dry soil; avoid spraying under intense afternoon sunlight (>32°C).',
    whatToAvoidHi: 'दोपहर की तेज धूप में छिड़काव न करें और सूखी मिट्टी में सीधे भारी मात्रा में यूरिया न डालें।',
    actionTasks: [
      { title: 'Inspect yellowing pattern on top vs bottom leaves', dayLabel: 'TODAY', category: 'Inspection' },
      { title: 'Spray NPK 19:19:19 + Micronutrient mix', dayLabel: 'DAY 2', category: 'Fertilizer' },
      { title: 'Check new shoot color improvement', dayLabel: 'DAY 5', category: 'Inspection' }
    ]
  },
  {
    triggers: ['irrigate', 'watering', 'water', 'when should i irrigate', 'सिंचाई', 'पानी'],
    category: 'Irrigation',
    issue: 'Optimal Irrigation Scheduling based on Soil Moisture and Evapotranspiration',
    issueHi: 'मिट्टी की नमी और मौसम अनुसार सही सिंचाई समय',
    reason: 'Current growth stage requires adequate root-zone moisture; over-irrigation risks root rot, while under-irrigation induces flower drop.',
    reasonHi: 'फसल की वर्तमान अवस्था में जड़ क्षेत्र में संतुलित नमी जरूरी है; अधिक पानी से जड़ सड़न का खतरा होता है।',
    whatToDo: 'Check top 2 inches of topsoil; if dry and crumbly, apply 3 to 4 hours of drip irrigation (or light furrow irrigation). Ensure good drainage.',
    whatToDoHi: 'खेत की 2 इंच ऊपरी मिट्टी की जांच करें। यदि सूखी हो, तो ड्रिप द्वारा 3-4 घंटे हल्की सिंचाई करें।',
    whenToDo: 'Irrigate late evening (after 5:00 PM) or early morning (before 8:30 AM) to minimize evaporative loss.',
    whenToDoHi: 'सुबह 8:30 बजे से पहले या शाम को 5:00 बजे के बाद सिंचाई करें ताकि पानी का वाष्पीकरण न हो।',
    whatToAvoid: 'Avoid flood irrigation during high noon heat; avoid standing water around the plant collar zone.',
    whatToAvoidHi: 'दोपहर 12 से 3 बजे के बीच कभी भी खेत में पानी न लगाएं और तने के पास जलभराव न होने दें।',
    actionTasks: [
      { title: 'Perform feel-and-appearance soil moisture check', dayLabel: 'TODAY', category: 'Inspection' },
      { title: 'Run scheduled drip irrigation cycle (3 hours)', dayLabel: 'DAY 2', category: 'Irrigation' },
      { title: 'Inspect soil moisture retention around root zone', dayLabel: 'DAY 4', category: 'Inspection' }
    ]
  },
  {
    triggers: ['fertilizer', 'manure', 'npk', 'urea', 'dap', 'खाद', 'उर्वरक'],
    category: 'Fertilizer & Nutrition',
    issue: 'Stage-Specific Balanced Crop Nutrition & Fertilizer Dosing',
    issueHi: 'फसल की अवस्था अनुसार संतुलित खाद और पोषण प्रबंधन',
    reason: 'To support active flowering/fruiting and root architecture without inducing vegetative overgrowth or pest vulnerability.',
    reasonHi: 'फूलों और फलों के समुचित विकास के लिए पोटाश और फॉस्फोरस की संतुलित खुराक आवश्यक है।',
    whatToDo: 'Apply Calcium Nitrate @ 2.5 kg/acre via fertigation or spray 13:00:45 (Potassium Nitrate) @ 5g/L along with Boron 20% @ 1g/L for optimal fruit/flower setting.',
    whatToDoHi: 'फूलों को झड़ने से रोकने के लिए 13:00:45 (5 ग्राम/लीटर) और बोरॉन (1 ग्राम/लीटर) का पत्तियों पर छिड़काव करें।',
    whenToDo: 'Apply today after ensuring soil contains adequate baseline moisture.',
    whenToDoHi: 'आज ही खेत में हल्की नमी होने पर यह खाद दें।',
    whatToAvoid: 'Do not mix Calcium Nitrate with Sulphate or Phosphate fertilizers in the same tank (causes precipitation).',
    whatToAvoidHi: 'कैल्शियम नाइट्रेट को सल्फेट या फॉस्फोरस वाली खादों के साथ एक साथ मिलाकर न घोलें।',
    actionTasks: [
      { title: 'Clean fertigation venturi filter & prepare solution', dayLabel: 'TODAY', category: 'Fertilizer' },
      { title: 'Apply 13:00:45 + Boron foliar spray', dayLabel: 'DAY 2', category: 'Fertilizer' },
      { title: 'Monitor flower retention and shoot vigor', dayLabel: 'DAY 5', category: 'Inspection' }
    ]
  },
  {
    triggers: ['today', 'what should i do', 'daily', 'routine', 'आज क्या करें', 'काम'],
    category: 'Yield Optimization',
    issue: 'Daily Farm Care & Preventive Canopy Management',
    issueHi: 'दैनिक खेत देखभाल और निवारक फसल प्रबंधन',
    reason: 'Continuous field scouting catches pest/disease outbreaks at the economic threshold level before heavy crop damage occurs.',
    reasonHi: 'नियमित निगरानी से कीटों और बीमारियों को शुरुआती अवस्था में ही रोका जा सकता है।',
    whatToDo: 'Walk diagonally across the field to inspect leaf undersides for sucking pests. Remove weeds and dried lower leaves to ensure solar penetration.',
    whatToDoHi: 'खेत का निरीक्षण करें, निचली सूखी पत्तियों को हटाएं और खेत में खरपतवार नियंत्रण करें।',
    whenToDo: 'Perform morning scouting at 7:30 AM before daily farm chores.',
    whenToDoHi: 'सुबह 7:30 बजे खेत का चक्कर लगाकर फसल की स्थिति देखें।',
    whatToAvoid: 'Avoid working in wet foliage if fungal spots are present (spreads fungal spores across healthy plants).',
    whatToAvoidHi: 'गीली पत्तियों के बीच काम न करें जिससे फफूंद के जीवाणु अन्य स्वस्थ पौधों पर न फैलें।',
    actionTasks: [
      { title: 'Perform 15-minute field diagonal scouting walk', dayLabel: 'TODAY', category: 'Inspection' },
      { title: 'Prune dead leaves and clean weed patches', dayLabel: 'DAY 2', category: 'Pruning & Weeding' },
      { title: 'Apply protective organic neem oil spray', dayLabel: 'DAY 3', category: 'Pest Management' }
    ]
  },
  {
    triggers: ['improve', 'yield', 'growth', 'health', 'उपज', 'बढ़वार'],
    category: 'Yield Optimization',
    issue: 'Crop Health Boosting & Biomass Optimization Strategy',
    issueHi: 'फसल की बढ़वार और उपज बढ़ाने की संपूर्ण रणनीति',
    reason: 'Optimal photosynthetic efficiency requires balanced micronutrients, active microbial soil life, and regulated vegetative growth.',
    reasonHi: 'पौधों में प्रकाश संश्लेषण तेज करने और मिट्टी के सूक्ष्मजीवों को सक्रिय करने से पैदावार 25% तक बढ़ती है।',
    whatToDo: 'Apply humic acid (98% potassium humate) @ 1kg/acre via irrigation root drench and spray seaweed extract @ 2.5 ml/L.',
    whatToDoHi: 'ह्यूमिक एसिड (1 किग्रा/एकड़) सिंचाई के साथ दें और समुद्री शैवाल (सीवीड) अर्क का पत्तियों पर छिड़काव करें।',
    whenToDo: 'Apply drench within the next 48 hours and foliar spray at the cool evening hours.',
    whenToDoHi: 'अगले 48 घंटों में ड्रिप से दें और शाम को स्प्रे करें।',
    whatToAvoid: 'Avoid excessive nitrogen dumping which causes leafy growth with poor fruit bearing.',
    whatToAvoidHi: 'जरूरत से ज्यादा यूरिया न डालें जिससे केवल पत्तियां बढ़ती हैं और फल कम लगते हैं।',
    actionTasks: [
      { title: 'Root drenching with Humic Acid & Bio-fertilizer', dayLabel: 'TODAY', category: 'Soil Care' },
      { title: 'Apply Seaweed extract bio-stimulant spray', dayLabel: 'DAY 3', category: 'Fertilizer' },
      { title: 'Record branch count and flower clustering progress', dayLabel: 'DAY 7', category: 'Inspection' }
    ]
  }
];

/**
 * Generates context-aware smart agricultural advice
 */
async function generateSmartAdvice({ queryText, cropName, cropStage, farm, weather, previousAnalyses }) {
  const queryLower = (queryText || '').toLowerCase();
  
  // Find matching pattern
  let matched = predefinedAdvisoryPatterns.find(pat =>
    pat.triggers.some(trigger => queryLower.includes(trigger.toLowerCase()))
  );

  // If no direct pattern matches, craft a personalized agronomy advisory tailored to farm & crop context
  if (!matched) {
    const crop = cropName || 'General Crop';
    const stage = cropStage || 'Vegetative Stage';
    const soil = farm ? farm.soilType : 'Loamy Soil';
    
    matched = {
      category: 'General',
      issue: `Optimizing Care & Protection for ${crop} at ${stage}`,
      issueHi: `${crop} की ${stage} पर संपूर्ण सुरक्षा एवं देखरेख`,
      reason: `During ${stage}, ${crop} growing in ${soil} demands calibrated water management and micro-nutrient balance to maximize flowering and root health.`,
      reasonHi: `${stage} के दौरान ${soil} में फसल को संतुलित नमी और पोषण की सबसे अधिक आवश्यकता होती है।`,
      whatToDo: `Conduct a targeted root aeration check, verify that soil pH is within 6.2-7.2, and apply organic bio-stimulant (Seaweed/Jeevamrutha @ 3ml/L) alongside recommended micronutrient spray.`,
      whatToDoHi: `खेत में नमी की जांच करें और सूक्ष्म पोषक तत्वों के साथ जैविक घोल (जीवामृत या सीवीड अर्क) का छिड़काव करें।`,
      whenToDo: `Execute this management protocol over the next 2-3 sunny days during early morning hours.`,
      whenToDoHi: `अगले 2-3 दिनों में सुबह के समय यह कार्य संपन्न करें।`,
      whatToAvoid: `Avoid over-fertilizing with raw manure; ensure spray water has neutral pH and avoid spraying during high wind speeds.`,
      whatToAvoidHi: `तेज हवा या बारिश के समय छिड़काव न करें और कच्चा गोबर खेत में न डालें।`,
      actionTasks: [
        { title: `Inspect ${crop} leaves and root collar`, dayLabel: 'TODAY', category: 'Inspection' },
        { title: `Apply bio-stimulant & micronutrient foliar spray`, dayLabel: 'DAY 2', category: 'Fertilizer' },
        { title: `Check soil moisture and field aeration`, dayLabel: 'DAY 4', category: 'Soil Care' }
      ]
    };
  }

  return {
    queryText,
    cropName: cropName || 'Tomato',
    category: matched.category,
    issue: matched.issue,
    issueHi: matched.issueHi,
    reason: matched.reason,
    reasonHi: matched.reasonHi,
    whatToDo: matched.whatToDo,
    whatToDoHi: matched.whatToDoHi,
    whenToDo: matched.whenToDo,
    whenToDoHi: matched.whenToDoHi,
    whatToAvoid: matched.whatToAvoid,
    whatToAvoidHi: matched.whatToAvoidHi,
    actionTasks: matched.actionTasks
  };
}

module.exports = {
  generateSmartAdvice,
  predefinedAdvisoryPatterns
};
