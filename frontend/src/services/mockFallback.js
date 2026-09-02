/**
 * Krishi Drishti - Resilient Agricultural Client-Side Fallback Service
 * Ensures 100% uninterrupted farmer demonstrations on mobile devices
 * even when the cloud backend is cold-starting or offline.
 */

// Default Demo Farmer
export const MOCK_FARMER_USER = {
  id: 'usr_farmer_demo_01',
  name: 'Rameshwar Patil (रामेश्वर पाटिल)',
  phone: '9876543210',
  email: 'rameshwar.patil@krishidrishti.in',
  role: 'farmer',
  isOnboarded: true,
  languagePreference: 'en',
};

export const MOCK_EXPERT_USER = {
  id: 'usr_expert_demo_01',
  name: 'Dr. Ananya Sharma (KVK Senior Agronomist)',
  phone: '9876500001',
  email: 'dr.ananya@kvk-agri.gov.in',
  role: 'expert',
  isOnboarded: true,
  languagePreference: 'en',
};

export const MOCK_ADMIN_USER = {
  id: 'usr_admin_demo_01',
  name: 'Krishi Drishti Admin Officer',
  phone: '9876599999',
  email: 'admin@krishidrishti.in',
  role: 'admin',
  isOnboarded: true,
  languagePreference: 'en',
};

export const MOCK_PROFILE = {
  state: 'Maharashtra',
  district: 'Nashik',
  village: 'Pimpalgaon Baswant',
  location: 'Pimpalgaon Baswant, Nashik, Maharashtra',
  pincode: '422209',
  experienceYears: 12,
};

export const MOCK_FARM = {
  farmName: 'Shri Ganesha Krishi Farm',
  farmSize: 5.0,
  landUnit: 'Acres',
  soilType: 'Black Soil / Regur',
  irrigationMethod: 'Drip Irrigation',
};

export const MOCK_CURRENT_CROP = {
  _id: 'crop_tomato_01',
  cropName: 'Tomato',
  variety: 'Abhinav Hybrid (Syngenta)',
  cropStage: 'Flowering & Early Fruiting',
  healthStatus: 'Good',
  healthScore: 91,
  areaAllocated: 5.0,
  plantingDate: '2026-06-15',
  sowingDate: '2026-06-15',
  expectedHarvest: '2026-09-28',
  isCurrent: true,
};

export const MOCK_CROPS = [
  MOCK_CURRENT_CROP,
  {
    _id: 'crop_onion_02',
    cropName: 'Onion',
    variety: 'Bhima Super',
    cropStage: 'Bulb Development',
    healthStatus: 'Excellent',
    healthScore: 94,
    areaAllocated: 2.0,
    plantingDate: '2026-07-01',
    sowingDate: '2026-07-01',
    isCurrent: false,
  },
];

export const MOCK_WEATHER = {
  location: 'Nashik, Maharashtra',
  current: {
    temp: 28,
    feelsLike: 29,
    humidity: 68,
    condition: 'Partly Cloudy',
    windSpeed: 12,
    rainProbability: 20,
    rainfall: '0 mm',
    uvIndex: 7,
  },
  forecast: [
    { day: 'Today', maxTemp: 29, minTemp: 21, condition: 'Partly Cloudy', rainChance: 20, humidity: 68, windSpeed: 12 },
    { day: 'Tomorrow', maxTemp: 30, minTemp: 22, condition: 'Scattered Showers', rainChance: 65, humidity: 76, windSpeed: 15 },
    { day: 'Wednesday', maxTemp: 28, minTemp: 21, condition: 'Cloudy', rainChance: 40, humidity: 72, windSpeed: 11 },
    { day: 'Thursday', maxTemp: 31, minTemp: 20, condition: 'Clear Sky', rainChance: 10, humidity: 60, windSpeed: 9 },
    { day: 'Friday', maxTemp: 32, minTemp: 22, condition: 'Sunny', rainChance: 5, humidity: 58, windSpeed: 10 },
  ],
  smartAlerts: [
    {
      title: 'Favorable Spraying Window',
      titleHi: 'छिड़काव के लिए अनुकूल मौसम',
      message: 'Wind speed is calm (12 km/h) and humidity is optimal (68%). Ideal conditions for bio-fertilizer and nutrient spraying.',
      messageHi: 'हवा की गति शांत (12 किमी/घंटा) और नमी अनुकूल है। पोषक तत्वों के छिड़काव के लिए उत्तम समय।',
      priority: 'low',
      category: 'weather',
    },
  ],
  advisory: {
    en: 'Suitable conditions for foliar spray today before 11 AM. Scattered rain expected tomorrow afternoon.',
    hi: 'आज सुबह 11 बजे से पहले छिड़काव के लिए मौसम अनुकूल है। कल दोपहर बाद हल्की बारिश की संभावना है।',
    irrigation: 'Normal schedule recommended. Hold back tomorrow if rain occurs.',
    spray: 'Favorable spray window today (wind < 14 km/h). Avoid spraying tomorrow.',
  },
};

export const MOCK_MANDI_PRICES = [
  {
    id: 'mandi-1',
    commodity: 'Tomato',
    commodityHi: 'टमाटर',
    market: 'Pimpalgaon APMC, Nashik',
    variety: 'Hybrid Red',
    minPrice: 1800,
    maxPrice: 2400,
    modalPrice: 2150,
    unit: '₹ / Quintal',
    change: 120,
    changePercent: '+8.5%',
    trend: 'up',
    arrivalQuantity: '450 Tonnes',
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें (3 दिन बाद बेचें)',
      rationale: 'Festive demand surge expected over the next 4 days in Mumbai/Surat terminal markets. Prices projected to climb to ₹2,300/Qtl.',
      rationaleHi: 'मुंबई और सूरत बाजारों में आगामी 4 दिनों में मांग बढ़ने की संभावना। भाव ₹2,300 तक पहुंचने का अनुमान।',
      confidence: 88,
    },
    arrivalDate: '2026-09-02',
    historicalTrend: [
      { day: 'Mon', price: 1950 },
      { day: 'Tue', price: 2000 },
      { day: 'Wed', price: 2050 },
      { day: 'Thu', price: 2100 },
      { day: 'Fri', price: 2150 },
    ],
  },
  {
    id: 'mandi-2',
    commodity: 'Onion',
    commodityHi: 'प्याज़',
    market: 'Lasalgaon APMC, Nashik',
    variety: 'Red Garva',
    minPrice: 2200,
    maxPrice: 2850,
    modalPrice: 2600,
    unit: '₹ / Quintal',
    change: 80,
    changePercent: '+4.2%',
    trend: 'up',
    arrivalQuantity: '1,200 Tonnes',
    aiForecast: {
      action: 'SELL',
      actionHi: 'बेचें (उच्चतम स्तर)',
      rationale: 'Prices currently at 2-week peak. Good liquidity for wholesale lots.',
      rationaleHi: 'भाव 2 सप्ताह के उच्चतम स्तर पर हैं। बिक्री के लिए उपयुक्त समय।',
      confidence: 91,
    },
    arrivalDate: '2026-09-02',
    historicalTrend: [
      { day: 'Mon', price: 2450 },
      { day: 'Tue', price: 2500 },
      { day: 'Wed', price: 2550 },
      { day: 'Thu', price: 2580 },
      { day: 'Fri', price: 2600 },
    ],
  },
  {
    id: 'mandi-3',
    commodity: 'Soybean',
    commodityHi: 'सोयाबीन',
    market: 'Nagpur Mandi',
    variety: 'Yellow JS-335',
    minPrice: 4400,
    maxPrice: 4750,
    modalPrice: 4620,
    unit: '₹ / Quintal',
    change: 0,
    changePercent: '0.0%',
    trend: 'stable',
    arrivalQuantity: '650 Tonnes',
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें',
      rationale: 'Global edible oil firmness expected to support domestic bean arrivals.',
      rationaleHi: 'वैश्विक खाद्य तेलों में मजबूती से घरेलू कीमतों को सहारा मिलने की उम्मीद।',
      confidence: 84,
    },
    arrivalDate: '2026-09-02',
    historicalTrend: [
      { day: 'Mon', price: 4600 },
      { day: 'Tue', price: 4610 },
      { day: 'Wed', price: 4620 },
      { day: 'Thu', price: 4620 },
      { day: 'Fri', price: 4620 },
    ],
  },
  {
    id: 'mandi-4',
    commodity: 'Cotton',
    commodityHi: 'कपास',
    market: 'Rajkot Market Yard',
    variety: 'Shankar-6',
    minPrice: 7100,
    maxPrice: 7650,
    modalPrice: 7420,
    unit: '₹ / Quintal',
    change: 150,
    changePercent: '+2.1%',
    trend: 'up',
    arrivalQuantity: '320 Tonnes',
    aiForecast: {
      action: 'SELL',
      actionHi: 'बेचें',
      rationale: 'Strong export spinning mill demand.',
      rationaleHi: 'कताई मिलों से निर्यात मांग मजबूत बनी हुई है।',
      confidence: 86,
    },
    arrivalDate: '2026-09-02',
    historicalTrend: [
      { day: 'Mon', price: 7200 },
      { day: 'Tue', price: 7280 },
      { day: 'Wed', price: 7350 },
      { day: 'Thu', price: 7380 },
      { day: 'Fri', price: 7420 },
    ],
  },
  {
    id: 'mandi-5',
    commodity: 'Wheat',
    commodityHi: 'गेहूं',
    market: 'Khanna Mandi, Punjab',
    variety: 'Sharbati PBW-725',
    minPrice: 2350,
    maxPrice: 2580,
    modalPrice: 2490,
    unit: '₹ / Quintal',
    change: 10,
    changePercent: '+0.5%',
    trend: 'stable',
    arrivalQuantity: '800 Tonnes',
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें',
      rationale: 'Flour mill buying steady near MSP support.',
      rationaleHi: 'एमएसपी के पास आटा मिलों की स्थिर खरीद।',
      confidence: 82,
    },
    arrivalDate: '2026-09-02',
    historicalTrend: [
      { day: 'Mon', price: 2470 },
      { day: 'Tue', price: 2475 },
      { day: 'Wed', price: 2480 },
      { day: 'Thu', price: 2485 },
      { day: 'Fri', price: 2490 },
    ],
  },
];

export const MOCK_OUTBREAKS = {
  success: true,
  count: 2,
  activeAlertsCount: 2,
  alerts: [
    {
      id: 'outbreak_01',
      threat: 'Whitefly & Leaf Curl Virus',
      threatHi: 'सफेद मक्खी एवं पर्ण कुंचन विषाणु',
      crop: 'Tomato & Chilli',
      severity: 'Moderate',
      distance: '18 km away',
      recommendedAction: 'Install yellow sticky traps (15 traps/acre) and spray Neem oil 1500 ppm @ 3ml/L water.',
      recommendedActionHi: 'प्रति एकड़ 15 पीले चिपचिपे ट्रैप लगाएं और नीम का तेल 1500 ppm @ 3 मिली/लीटर पानी में छिड़कें।',
    },
    {
      id: 'outbreak_02',
      threat: 'Fall Armyworm (FAW)',
      threatHi: 'फॉल आर्मीवर्म कीट चेतावनी',
      crop: 'Maize & Sweet Corn',
      severity: 'Watch',
      distance: '35 km away',
      recommendedAction: 'Inspect crop whorls early morning. Pheromone traps recommended.',
      recommendedActionHi: 'सुबह के समय पौधों के ऊपरी हिस्सों की जांच करें। फेरोमोन ट्रैप लगाएं।',
    },
  ],
};

export const MOCK_SATELLITE_NDVI = {
  success: true,
  data: {
    fieldArea: '5.0 Acres',
    currentNdvi: 0.78,
    ndviStatus: 'Healthy Dense Canopy',
    ndviStatusHi: 'स्वस्थ हरी सघन फसल',
    soilMoistureIndex: 68,
    moistureStatus: 'Adequate Moisture',
    canopyCover: '86%',
    lastSatellitePass: 'Sentinel-2 (Yesterday 10:45 AM)',
    zones: [
      { name: 'North Zone (2.0 Ac)', ndvi: 0.82, status: 'Vigorous Growth' },
      { name: 'Central Zone (1.8 Ac)', ndvi: 0.78, status: 'Optimal Vigor' },
      { name: 'South Slope (1.2 Ac)', ndvi: 0.71, status: 'Slight Nitrogen Need' },
    ],
  },
};

export const MOCK_SCHEMES = {
  success: true,
  schemes: [
    {
      id: 'scheme_pm_kisan',
      title: 'PM-KISAN Samman Nidhi Yojana',
      titleHi: 'प्रधानमंत्री किसान सम्मान निधि योजना',
      benefits: '₹6,000 / year in 3 direct bank transfers',
      eligibility: 'All small & marginal landholder farmer families',
      link: 'https://pmkisan.gov.in',
      status: 'Active / Open',
    },
    {
      id: 'scheme_pmfby',
      title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      titleHi: 'प्रधानमंत्री फसल बीमा योजना',
      benefits: 'Comprehensive crop insurance coverage against natural calamities & pests',
      eligibility: 'All farmers growing notified crops in notified areas',
      link: 'https://pmfby.gov.in',
      status: 'Enrolling for Kharif/Rabi',
    },
    {
      id: 'scheme_shc',
      title: 'Soil Health Card Scheme',
      titleHi: 'मृदा स्वास्थ्य कार्ड योजना',
      benefits: 'Free testing of 12 soil parameters every 2 years with tailored nutrient advice',
      eligibility: 'All agricultural landowners',
      link: 'https://soilhealth.dac.gov.in',
      status: 'Available at local KVK',
    },
    {
      id: 'scheme_drip',
      title: 'Per Drop More Crop (Micro-Irrigation Subsidy)',
      titleHi: 'प्रति बूंद अधिक फसल (ड्रिप/स्प्रिंकलर सब्सिडी)',
      benefits: '45% to 55% subsidy on Drip & Sprinkler irrigation installations',
      eligibility: 'Individual farmers with verified land records',
      link: 'https://pmksy.gov.in',
      status: 'State Agriculture Dept Portal',
    },
  ],
};

export const MOCK_ACTION_PLANS = [
  {
    _id: 'task_01',
    title: 'Morning Foliar Nutrition Spray (19:19:19 NPK + Micronutrients)',
    titleHi: 'सुबह का पर्ण पोषण छिड़काव (19:19:19 NPK + सूक्ष्म पोषक तत्व)',
    description: 'Dissolve 5g/L water and spray before peak sunlight hours.',
    dayLabel: 'TODAY',
    isCompleted: false,
    priority: 'High',
    category: 'Nutrition',
  },
  {
    _id: 'task_02',
    title: 'Inspect Drip Emitters & Clean Secondary Disc Filter',
    titleHi: 'ड्रिप उत्सर्जकों की जांच करें और डिस्क फ़िल्टर साफ़ करें',
    description: 'Ensure uniform water discharge rate of 2.4 LPH across Block B.',
    dayLabel: 'TOMORROW',
    isCompleted: true,
    priority: 'Medium',
    category: 'Irrigation',
  },
  {
    _id: 'task_03',
    title: 'Apply Trichoderma Viride Organic Root Drenching',
    titleHi: 'ट्राइकोडर्मा विरिडी का जैविक रूट ड्रेन्चिंग करें',
    description: 'Biological control against root-knot nematode and soil pathogens.',
    dayLabel: 'FRIDAY',
    isCompleted: false,
    priority: 'Normal',
    category: 'Bio-Protection',
  },
];

export const MOCK_ALERTS = [
  {
    _id: 'alert_01',
    title: 'High Humidity Weather Advisory',
    titleHi: 'उच्च आर्द्रता मौसम सलाह 🌧️',
    message: 'Humidity > 75% for 48 hrs may trigger Early Blight in Tomato. Spray Mancozeb 75 WP @ 2.5g/L as preventive measure.',
    messageHi: '48 घंटे तक 75% से अधिक आर्द्रता टमाटर में अगेती झुलसा का कारण बन सकती है। रोकथाम के लिए मेंकोजेब 75 WP @ 2.5 ग्राम/लीटर छिड़कें।',
    priority: 'high',
    category: 'weather',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'alert_02',
    title: 'Pimpalgaon Mandi Tomato Rate Surge',
    titleHi: 'पिंपलगांव मंडी टमाटर भाव में उछाल 📈',
    message: 'Tomato prices climbed 8.5% today to ₹2,150/quintal due to strong southern state demand.',
    messageHi: 'मजबूत मांग के कारण आज टमाटर के भाव 8.5% बढ़कर ₹2,150/क्विंटल हो गए हैं।',
    priority: 'medium',
    category: 'mandi',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const MOCK_EXPERT_CASES = [
  {
    _id: 'case_01',
    farmerName: 'Rameshwar Patil',
    cropName: 'Tomato',
    problem: 'Yellow curling on upper apical leaves with stunted shoot growth',
    village: 'Pimpalgaon, Nashik',
    date: '2026-09-02',
    status: 'Pending',
    priority: 'High',
  },
  {
    _id: 'case_02',
    farmerName: 'Balwant Singh',
    cropName: 'Paddy / Basmati',
    problem: 'Bacterial leaf blight streaks on flag leaves',
    village: 'Karnal, Haryana',
    date: '2026-09-01',
    status: 'Prescribed',
    priority: 'Medium',
  },
];

export const MOCK_ADMIN_STATS = {
  totalFarmers: 14820,
  activeScansToday: 642,
  kvkScientistsConnected: 48,
  aiDiagnosisAccuracy: '94.8%',
  totalStatesCovered: 14,
  mandisIntegrated: 280,
};

export const MOCK_PREDEFINED_QUERIES = [
  { q: 'How to control Tomato leaf curl virus?', qHi: 'टमाटर में पत्ती मुड़न (लीफ कर्ल) रोग कैसे रोकें?' },
  { q: 'What is the best fertilizer dose for flowering stage?', qHi: 'फूल आने की अवस्था में सबसे अच्छा खाद क्या है?' },
  { q: 'When should I irrigate my crop this week?', qHi: 'इस हफ्ते मुझे अपनी फसल की सिंचाई कब करनी चाहिए?' },
  { q: 'How to apply for PM-KISAN subsidy for drip irrigation?', qHi: 'ड्रिप सिंचाई सब्सिडी के लिए आवेदन कैसे करें?' },
];

/**
 * Generates simulated AI scan result when farmer scans or uploads a crop photo
 */
export function generateMockScanResult(cropName = 'Tomato') {
  return {
    success: true,
    data: {
      _id: 'scan_mock_tomato_01',
      crop: cropName,
      cropName: cropName,
      disease: 'Early Blight (Alternaria solani)',
      diseaseHi: 'अगेती झुलसा (अल्टरनेरिया सोलेनाई)',
      detectedProblem: 'Early Blight (Alternaria solani)',
      detectedProblemHi: 'अगेती झुलसा (अल्टरनेरिया सोलेनाई)',
      confidence: '94.6%',
      severity: 'Moderate',
      healthStatus: 'Attention Needed',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=300&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      symptoms: [
        'Concentric target-like rings with yellow chlorotic halos on lower leaves',
        'Early leaf senescence and spotted foliage',
        'Stems show dark brown elongated lesions',
      ],
      symptomsHi: [
        'निचली पत्तियों पर पीले घेरे के साथ गोल छल्लेदार धब्बे',
        'पत्तियों का समय से पहले पीला पड़ना',
        'तनों पर गहरे भूरे रंग के धब्बे',
      ],
      organicTreatment: [
        'Spray Neem Oil (Azadirachtin 10,000 ppm) @ 3 ml per litre of water.',
        'Drench root zone with Trichoderma harzianum @ 5g/litre to enhance biological resistance.',
        'Prune and safely burn infected lower canopy leaves.',
      ],
      organicTreatmentHi: [
        'नीम का तेल (10,000 ppm) @ 3 मिली प्रति लीटर पानी में छिड़कें।',
        'ट्राइकोडर्मा हरज़ियानम @ 5 ग्राम/लीटर से जड़ क्षेत्र में ड्रेन्चिंग करें।',
        'संक्रमित निचली पत्तियों को काटकर खेत से दूर नष्ट कर दें।',
      ],
      chemicalTreatment: [
        'Spray Mancozeb 75% WP @ 2.5 g/L water or Chlorothalonil 75% WP @ 2 g/L.',
        'In severe spread: Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L water.',
      ],
      chemicalTreatmentHi: [
        'मेंकोजेब 75% WP @ 2.5 ग्राम/लीटर या क्लोरोथालोनिल 75% WP @ 2 ग्राम/लीटर छिड़कें।',
        'गंभीर संक्रमण में: एज़ोक्सीस्ट्रोबिन + डाइफेनोकोनाज़ोल @ 1 मिली/लीटर पानी में छिड़कें।',
      ],
      preventiveAdvice: 'Ensure proper plant spacing for air circulation and avoid overhead sprinkler watering on leaf canopy.',
      preventiveAdviceHi: 'हवा के आवागमन के लिए पौधों के बीच उचित दूरी रखें और पत्तियों पर फव्वारे से पानी देने से बचें।',
      speechText: 'Crop scan completed. Early blight detected with 94.6 percent confidence. Spray Mancozeb or organic Neem oil in cool morning hours.',
      speechTextHi: 'फसल की जांच पूरी हुई। 94.6 प्रतिशत सटीकता के साथ अगेती झुलसा की पहचान हुई है। सुबह के समय मेंकोजेब या नीम के तेल का छिड़काव करें।',
    },
  };
}

/**
 * Handles mock AI agronomic consultation
 */
export function generateMockAiAnswer(query) {
  const qLower = (query || '').toLowerCase();
  
  if (qLower.includes('fertilizer') || qLower.includes('खाद') || qLower.includes('npk')) {
    return {
      success: true,
      answer: 'For flowering & fruit formation stage: Apply water-soluble NPK 00:52:34 (Mono Potassium Phosphate) @ 5g/L water via fertigation, along with Boron 20% @ 1g/L to prevent flower drop and promote uniform fruit setting.',
      answerHi: 'फूल और फल बनने की अवस्था के लिए: ड्रिप से 00:52:34 खाद @ 5 ग्राम/लीटर दें, और फूल झड़ने से रोकने के लिए बोरॉन 20% @ 1 ग्राम/लीटर का छिड़काव करें।',
      recommendations: [
        'Avoid excessive Nitrogen at flowering to prevent unwanted vegetative foliage growth.',
        'Ensure steady soil moisture: irregular watering causes fruit cracking and blossom end rot.',
      ],
    };
  }

  if (qLower.includes('water') || qLower.includes('irrigation') || qLower.includes('पानी') || qLower.includes('सिंचाई')) {
    return {
      success: true,
      answer: 'Based on current soil moisture (68%) and weather forecast, light drip irrigation for 45 minutes in early morning is optimal. Hold back irrigation tomorrow if rainfall occurs as forecasted.',
      answerHi: 'वर्तमान नमी (68%) और मौसम के अनुसार, कल सुबह 45 मिनट के लिए ड्रिप सिंचाई पर्याप्त है। बारिश होने पर सिंचाई रोक दें।',
      recommendations: [
        'Irrigate between 6:00 AM and 8:30 AM to minimize evaporation loss.',
        'Check emitter discharge along drip lateral ends.',
      ],
    };
  }

  return {
    success: true,
    answer: `Krishi Drishti AI Agronomist analysis for "${query}": Maintain optimal field hygiene, inspect the underside of leaves for early pest vectors, and follow balanced nutrient fertigation. Local weather in Nashik is favorable for normal crop operations today.`,
    answerHi: `"${query}" के लिए कृषि दृष्टि AI सलाह: खेत की स्वच्छता बनाए रखें, पत्तियों के नीचे कीटों की जांच करें और संतुलित पोषण दें। आज मौसम खेती के कार्यों के लिए अनुकूल है।`,
    recommendations: [
      'Take photos using the Crop Scan tool for instant disease and pest diagnosis.',
      'Consult nearby KVK scientist Dr. Ananya Sharma via Expert Advisory if symptoms persist.',
    ],
  };
}
