const mongoose = require('mongoose');

// In-memory persistent state for cloud stateless operation when MongoDB is not connected
const USERS = [
  {
    _id: 'usr_farmer_demo_01',
    id: 'usr_farmer_demo_01',
    name: 'Rameshwar Patil (रामेश्वर पाटिल)',
    phone: '9876543210',
    email: 'rameshwar.patil@krishidrishti.in',
    role: 'farmer',
    isOnboarded: true,
    languagePreference: 'en',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'usr_expert_demo_01',
    id: 'usr_expert_demo_01',
    name: 'Dr. Ananya Sharma (KVK Scientist)',
    phone: '9876500001',
    email: 'dr.ananya@kvk-agri.gov.in',
    role: 'expert',
    isOnboarded: true,
    languagePreference: 'en',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'usr_admin_demo_01',
    id: 'usr_admin_demo_01',
    name: 'Krishi Drishti Admin Officer',
    phone: '9876599999',
    email: 'admin@krishidrishti.in',
    role: 'admin',
    isOnboarded: true,
    languagePreference: 'en',
    createdAt: new Date().toISOString()
  }
];

const PROFILE = {
  userId: 'usr_farmer_demo_01',
  state: 'Maharashtra',
  district: 'Nashik',
  village: 'Pimpalgaon Baswant',
  pincode: '422209',
  location: 'Pimpalgaon Baswant, Nashik, Maharashtra',
  experienceYears: 14
};

const FARM = {
  _id: 'farm_demo_01',
  farmerId: 'usr_farmer_demo_01',
  farmName: 'Shri Ganesha Krishi Farm',
  farmSize: 5.5,
  landUnit: 'Acres',
  soilType: 'Black Soil / Regur',
  irrigationMethod: 'Drip Irrigation',
  soilPh: 6.9,
  organicMatter: 'Medium (0.75%)'
};

const CROPS = [
  {
    _id: 'crop_demo_01',
    farmId: 'farm_demo_01',
    farmerId: 'usr_farmer_demo_01',
    cropName: 'Tomato',
    variety: 'Abhinav Hybrid (Syngenta)',
    cropStage: 'Flowering Stage',
    plantingDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    healthStatus: 'Good',
    healthScore: 91,
    areaAllocated: 3.5,
    isCurrent: true
  },
  {
    _id: 'crop_demo_02',
    farmId: 'farm_demo_01',
    farmerId: 'usr_farmer_demo_01',
    cropName: 'Onion',
    variety: 'Fursungi Red',
    cropStage: 'Vegetative Stage',
    plantingDate: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    healthStatus: 'Excellent',
    healthScore: 95,
    areaAllocated: 2.0,
    isCurrent: false
  },
  {
    _id: 'crop_demo_03',
    farmId: 'farm_demo_01',
    farmerId: 'usr_farmer_demo_01',
    cropName: 'Wheat',
    variety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Sowing Planned',
    plantingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    healthStatus: 'Healthy',
    healthScore: 90,
    areaAllocated: 1.5,
    isCurrent: false
  }
];

let ACTION_PLANS = [
  {
    _id: 'task_01',
    farmerId: 'usr_farmer_demo_01',
    title: 'Monitor Tomato Foliage for Early Blight Spots',
    titleHi: 'टमाटर की पत्तियों पर अगेती झुलसा के धब्बों की जांच करें',
    description: 'High morning humidity detected (68%). Check lower leaves for concentric rings.',
    descriptionHi: 'सुबह अधिक आर्द्रता (68%) दर्ज की गई है। निचली पत्तियों पर भूरे छल्लेदार धब्बे देखें।',
    dayLabel: 'TODAY',
    priority: 'High',
    category: 'Pest & Disease Control',
    isCompleted: false,
    dueDate: new Date().toISOString()
  },
  {
    _id: 'task_02',
    farmerId: 'usr_farmer_demo_01',
    title: 'Drip Fertigation: Micronutrient Foliar Spray',
    titleHi: 'ड्रिप सिंचाई के साथ सूक्ष्म पोषक तत्व (Micronutrients) का छिड़काव',
    description: 'Apply water soluble Boron (1g/L) + Zinc Sulphate to promote flower retention.',
    descriptionHi: 'फूल झड़ने से रोकने हेतु घुलनशील बोरॉन (1 ग्राम/ली.) + जिंक सल्फेट का प्रयोग करें।',
    dayLabel: 'TOMORROW',
    priority: 'Medium',
    category: 'Fertilizer & Nutrition',
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000).toISOString()
  },
  {
    _id: 'task_03',
    farmerId: 'usr_farmer_demo_01',
    title: 'Soil Moisture Check Before Rain Forecast',
    titleHi: 'बारिश के पूर्वानुमान से पूर्व मिट्टी में नमी का स्तर मापें',
    description: 'Rain showers predicted in 48 hours. Hold heavy irrigation to prevent root rot.',
    descriptionHi: 'अगले 48 घंटों में बारिश की संभावना है। जड़ गलन से बचाव के लिए भारी सिंचाई टालें।',
    dayLabel: 'IN 2 DAYS',
    priority: 'Low',
    category: 'Irrigation',
    isCompleted: true,
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString()
  }
];

const ALERTS = [
  {
    _id: 'alert_01',
    userId: 'usr_farmer_demo_01',
    title: 'Weather Advisory: Rain Expected Tomorrow',
    titleHi: 'मौसम सलाह: कल वर्षा का अनुमान',
    message: 'Rain probability is 75%. Postpone chemical sprays to avoid wash-off.',
    messageHi: 'कल 75% बारिश की संभावना है। कीटनाशक छिड़काव टालें ताकि दवा न धुले।',
    priority: 'high',
    category: 'weather',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'alert_02',
    userId: 'usr_farmer_demo_01',
    title: 'Mandi Bullish Alert: Tomato Prices Rising',
    titleHi: 'मंडी भाव सूचना: टमाटर के भाव में तेजी',
    message: 'Pimpalgaon APMC reports Tomato model price up by ₹150/qtl to ₹2,150.',
    messageHi: 'पिंपलगांव मंडी में टमाटर के मॉडल भाव ₹150 बढ़कर ₹2,150 प्रति क्विंटल पहुंचे।',
    priority: 'medium',
    category: 'mandi',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const EXPERT_CASES = [
  {
    _id: 'case_01',
    farmerId: {
      _id: 'usr_farmer_demo_01',
      name: 'Rameshwar Patil (रामेश्वर पाटिल)',
      phone: '9876543210',
      email: 'rameshwar.patil@krishidrishti.in'
    },
    cropId: {
      cropName: 'Tomato',
      variety: 'Abhinav Hybrid',
      cropStage: 'Flowering Stage',
      healthStatus: 'Needs Attention'
    },
    detectedProblem: 'Early Blight (Alternaria solani)',
    confidenceScore: 92,
    severity: 'Medium',
    symptomsObserved: ['Concentric dark spots on lower foliage', 'Slight yellow halo around lesions'],
    organicRemedy: 'Spray 5% Neem seed kernel extract (NSKE) or Trichoderma harzianum @ 5g/L.',
    chemicalTreatment: 'Foliar spray with Mancozeb 75 WP @ 2.5g/L or Azoxystrobin @ 1ml/L.',
    expertReviewed: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    _id: 'case_02',
    farmerId: {
      _id: 'usr_farmer_demo_02',
      name: 'Harpreet Singh (हरप्रीत सिंह)',
      phone: '9876543211',
      email: 'harpreet.singh@krishidrishti.in'
    },
    cropId: {
      cropName: 'Wheat',
      variety: 'DBW 187',
      cropStage: 'Vegetative Stage',
      healthStatus: 'Good'
    },
    detectedProblem: 'Yellow Rust Early Warning',
    confidenceScore: 88,
    severity: 'High',
    symptomsObserved: ['Linear yellow pustules on upper leaves'],
    organicRemedy: 'Neem-based formulation and remove infected weed hosts.',
    chemicalTreatment: 'Spray Propiconazole 25% EC (Tilt) @ 1ml per litre water.',
    expertReviewed: true,
    expertNotes: 'Confirmed by KVK agronomy team. Urgent spray recommended for north-facing plot.',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Seed benchmark AGMARKNET APMC rates for major crops
const BENCHMARK_MANDI_RATES = [
  {
    id: 'mandi_ref_01',
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Pimpalgaon APMC',
    marketRaw: 'Pimpalgaon',
    commodity: 'Tomato',
    commodityHi: 'टमाटर',
    variety: 'Hybrid / Abhinav',
    grade: 'FAQ',
    arrival_date: new Date().toLocaleDateString('en-GB'),
    sourceDate: new Date().toLocaleDateString('en-GB'),
    minPrice: 1650,
    modalPrice: 2150,
    maxPrice: 2450,
    priceUnit: 'Quintal',
    arrival: 185,
    arrivalUnit: 'Tonnes',
    change: 150,
    changePercent: '+7.5%',
    trend: 'up',
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    isValid: true,
    isCached: true,
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें / निगरानी रखें (भाव बढ़ रहे हैं)',
      rationale: 'Festive demand in metro terminal markets driving higher daily arrivals and healthy price appreciation.',
      rationaleHi: 'त्योहारी मांग के कारण मंडी में अच्छी मांग और भाव में ₹150/क्विंटल की वृद्धि देखी गई है।',
      confidence: 89
    }
  },
  {
    id: 'mandi_ref_02',
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Lasalgaon APMC',
    marketRaw: 'Lasalgaon',
    commodity: 'Onion',
    commodityHi: 'प्याज़',
    variety: 'Red Garva',
    grade: 'FAQ',
    arrival_date: new Date().toLocaleDateString('en-GB'),
    sourceDate: new Date().toLocaleDateString('en-GB'),
    minPrice: 2200,
    modalPrice: 2650,
    maxPrice: 2900,
    priceUnit: 'Quintal',
    arrival: 420,
    arrivalUnit: 'Tonnes',
    change: 80,
    changePercent: '+3.1%',
    trend: 'up',
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    isValid: true,
    isCached: true,
    aiForecast: {
      action: 'SELL',
      actionHi: 'बेचें (उच्चतम स्तर)',
      rationale: 'Prices currently at 2-week peak. Good liquidity for sorted wholesale lots.',
      rationaleHi: 'भाव 2 सप्ताह के उच्चतम स्तर पर हैं। छंटी हुई फसल की बिक्री के लिए अनुकूल समय।',
      confidence: 91
    }
  },
  {
    id: 'mandi_ref_03',
    state: 'Uttar Pradesh',
    district: 'Gorakhpur',
    market: 'Gorakhpur APMC',
    marketRaw: 'Gorakhpur',
    commodity: 'Wheat',
    commodityHi: 'गेहूं',
    variety: 'Dara / Sharbati',
    grade: 'FAQ',
    arrival_date: new Date().toLocaleDateString('en-GB'),
    sourceDate: new Date().toLocaleDateString('en-GB'),
    minPrice: 2350,
    modalPrice: 2475,
    maxPrice: 2550,
    priceUnit: 'Quintal',
    arrival: 140,
    arrivalUnit: 'Tonnes',
    change: 25,
    changePercent: '+1.0%',
    trend: 'stable',
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    isValid: true,
    isCached: true,
    aiForecast: {
      action: 'HOLD',
      actionHi: 'मंडी भाव स्थिर - निगरानी रखें',
      rationale: 'Government procurement MSP support provides stable price floor at ₹2,425/Qtl.',
      rationaleHi: 'सरकारी समर्थन मूल्य (MSP) के कारण गेहूं के भाव मजबूत और स्थिर बने हुए हैं।',
      confidence: 94
    }
  },
  {
    id: 'mandi_ref_04',
    state: 'Madhya Pradesh',
    district: 'Indore',
    market: 'Indore (F&V)',
    marketRaw: 'Indore',
    commodity: 'Soyabean',
    commodityHi: 'सोयाबीन',
    variety: 'Yellow Standard',
    grade: 'FAQ',
    arrival_date: new Date().toLocaleDateString('en-GB'),
    sourceDate: new Date().toLocaleDateString('en-GB'),
    minPrice: 4400,
    modalPrice: 4720,
    maxPrice: 4950,
    priceUnit: 'Quintal',
    arrival: 280,
    arrivalUnit: 'Tonnes',
    change: 60,
    changePercent: '+1.3%',
    trend: 'up',
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    isValid: true,
    isCached: true,
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें - आगामी दिनों में तेजी की संभावना',
      rationale: 'Crushing demand active with positive international oilseed cues.',
      rationaleHi: 'सोया तेल मिलों की मजबूत मांग से भाव में स्थिरता एवं सुधार देखा जा रहा है।',
      confidence: 86
    }
  },
  {
    id: 'mandi_ref_05',
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Rajkot APMC',
    marketRaw: 'Rajkot',
    commodity: 'Cotton',
    commodityHi: 'कपास',
    variety: 'Shankar-6',
    grade: 'Medium Staple',
    arrival_date: new Date().toLocaleDateString('en-GB'),
    sourceDate: new Date().toLocaleDateString('en-GB'),
    minPrice: 6800,
    modalPrice: 7250,
    maxPrice: 7600,
    priceUnit: 'Quintal',
    arrival: 310,
    arrivalUnit: 'Tonnes',
    change: 120,
    changePercent: '+1.7%',
    trend: 'up',
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    isValid: true,
    isCached: true,
    aiForecast: {
      action: 'SELL',
      actionHi: 'बेचें / अच्छी दर उपलब्ध',
      rationale: 'Export demand steady with strong ginning mill inquiries.',
      rationaleHi: 'सूत मिलों की सक्रिय मांग से कपास के भाव लाभदायक स्तर पर हैं।',
      confidence: 90
    }
  },
  {
    id: 'mandi_ref_06',
    state: 'Uttar Pradesh',
    district: 'Agra',
    market: 'Agra APMC',
    marketRaw: 'Agra',
    commodity: 'Potato',
    commodityHi: 'आलू',
    variety: 'Kufri Bahar',
    grade: 'FAQ',
    arrival_date: new Date().toLocaleDateString('en-GB'),
    sourceDate: new Date().toLocaleDateString('en-GB'),
    minPrice: 1100,
    modalPrice: 1320,
    maxPrice: 1450,
    priceUnit: 'Quintal',
    arrival: 520,
    arrivalUnit: 'Tonnes',
    change: -30,
    changePercent: '-2.2%',
    trend: 'down',
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    isValid: true,
    isCached: true,
    aiForecast: {
      action: 'HOLD',
      actionHi: 'कोल्ड स्टोरेज में रखें / प्रतीक्षा करें',
      rationale: 'Cold storage dispatch supplies active; wait for festive restocking.',
      rationaleHi: 'आवक अधिक होने से भाव में हल्का दबाव; आगामी सप्ताह सुधार संभव।',
      confidence: 85
    }
  },
  {
    id: 'mandi_ref_07',
    state: 'Rajasthan',
    district: 'Sri Ganganagar',
    market: 'Sri Ganganagar Mandi',
    marketRaw: 'Sri Ganganagar',
    commodity: 'Mustard',
    commodityHi: 'सरसों',
    variety: 'Black Bold',
    grade: 'FAQ',
    arrival_date: new Date().toLocaleDateString('en-GB'),
    sourceDate: new Date().toLocaleDateString('en-GB'),
    minPrice: 5350,
    modalPrice: 5680,
    maxPrice: 5850,
    priceUnit: 'Quintal',
    arrival: 195,
    arrivalUnit: 'Tonnes',
    change: 90,
    changePercent: '+1.6%',
    trend: 'up',
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    isValid: true,
    isCached: true,
    aiForecast: {
      action: 'SELL',
      actionHi: 'बेचें / उत्तम भाव',
      rationale: 'High oil percentage bonus given for dry bold lots.',
      rationaleHi: 'तेल मिलों द्वारा अच्छी खरीद; 42% तेल मात्रा वाली सरसों पर प्रीमियम उपलब्ध।',
      confidence: 92
    }
  }
];

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function getStatelessUserByRole(role = 'farmer') {
  const normalized = (role || 'farmer').toLowerCase();
  const user = USERS.find(u => u.role === normalized) || USERS[0];
  return { ...user };
}

function getStatelessUserByPhone(phone) {
  const user = USERS.find(u => u.phone === phone);
  return user ? { ...user } : null;
}

function getStatelessUserById(id) {
  const user = USERS.find(u => u._id === id || u.id === id);
  if (user) return { ...user };
  if (typeof id === 'string' && id.includes('expert')) return { ...USERS[1] };
  if (typeof id === 'string' && id.includes('admin')) return { ...USERS[2] };
  return { ...USERS[0] };
}

function getStatelessDashboard() {
  return {
    farmer: { ...USERS[0] },
    profile: { ...PROFILE },
    farm: { ...FARM },
    currentCrop: { ...CROPS[0] },
    crops: [...CROPS],
    healthScore: 91,
    pendingTasks: ACTION_PLANS.filter(p => !p.isCompleted),
    recentAnalyses: [
      {
        _id: 'scan_rec_01',
        cropName: 'Tomato',
        detectedProblem: 'Early Blight (Alternaria solani)',
        confidenceScore: 92,
        severity: 'Medium',
        createdAt: new Date().toISOString()
      }
    ],
    recentRecommendations: [
      {
        _id: 'rec_01',
        query: 'Early blight control',
        aiResponse: 'Spray Mancozeb 75 WP or Neem Oil',
        createdAt: new Date().toISOString()
      }
    ],
    unreadAlerts: [...ALERTS]
  };
}

function getStatelessCrops() {
  return [...CROPS];
}

function getStatelessActionPlans() {
  const completed = ACTION_PLANS.filter(t => t.isCompleted).length;
  const total = ACTION_PLANS.length;
  return {
    tasks: [...ACTION_PLANS],
    stats: {
      total,
      completed,
      pending: total - completed,
      completionRate: Math.round((completed / total) * 100)
    }
  };
}

function toggleStatelessActionPlan(taskId) {
  const task = ACTION_PLANS.find(t => t._id === taskId);
  if (task) {
    task.isCompleted = !task.isCompleted;
    return { ...task };
  }
  return null;
}

function getStatelessAlerts() {
  return [...ALERTS];
}

function getStatelessExpertCases(status = 'all') {
  let filtered = [...EXPERT_CASES];
  if (status === 'pending') {
    filtered = filtered.filter(c => !c.expertReviewed);
  } else if (status === 'reviewed') {
    filtered = filtered.filter(c => c.expertReviewed);
  }

  return {
    stats: {
      totalCases: EXPERT_CASES.length,
      pendingReview: EXPERT_CASES.filter(c => !c.expertReviewed).length,
      criticalCases: EXPERT_CASES.filter(c => c.severity === 'Critical' || c.severity === 'High').length,
      resolvedCases: EXPERT_CASES.filter(c => c.expertReviewed).length
    },
    data: filtered
  };
}

function getStatelessAdminStats() {
  return {
    counts: {
      totalUsers: 1420,
      totalFarmers: 1340,
      totalExperts: 32,
      totalFarms: 1390,
      totalCrops: 2840,
      totalAnalyses: 5210,
      totalRecommendations: 8430,
      activeAlerts: 14,
      totalFeedbacks: 182
    },
    recentUsers: USERS,
    recentAnalyses: EXPERT_CASES
  };
}

function getStatelessMandiRates({ commodity, state, district }) {
  let filtered = [...BENCHMARK_MANDI_RATES];
  if (commodity && commodity !== 'All') {
    filtered = filtered.filter(r => 
      r.commodity.toLowerCase().includes(commodity.toLowerCase()) || 
      (r.commodityHi && r.commodityHi.includes(commodity))
    );
    if (filtered.length === 0) {
      filtered = [...BENCHMARK_MANDI_RATES];
    }
  }
  if (state && state !== 'All') {
    const stateFiltered = filtered.filter(r => r.state.toLowerCase() === state.toLowerCase());
    if (stateFiltered.length > 0) {
      filtered = stateFiltered;
    }
  }
  return filtered;
}

// -------------------------------------------------------------
// STATELESS FIELDS STORE
// -------------------------------------------------------------
let STATELESS_FIELDS = [
  {
    _id: 'field_demo_01',
    id: 'field_demo_01',
    farmerId: 'usr_farmer_demo_01',
    fieldName: 'North Plot - Wheat & Maize Block',
    crop: 'Wheat',
    cropVariety: 'DBW 187 (Karan Vandana)',
    season: 'Rabi',
    cropStage: 'Flowering Stage',
    farmerName: 'Rameshwar Patil',
    soilType: 'Black Soil / Regur',
    irrigationMethod: 'Drip Irrigation',
    notes: 'Drip irrigation installed with fertigation unit. DBW-187 certified block.',
    points: [
      { lat: 20.17482, lng: 73.98421 },
      { lat: 20.17565, lng: 73.98583 },
      { lat: 20.17512, lng: 73.98745 },
      { lat: 20.17395, lng: 73.98782 },
      { lat: 20.17281, lng: 73.98695 },
      { lat: 20.17254, lng: 73.98512 },
      { lat: 20.17342, lng: 73.98402 },
    ],
    center: { lat: 20.17404, lng: 73.98591 },
    areaAcres: 8.95,
    areaHectares: 3.62,
    areaSqMeters: 36220,
    formattedAcres: '8.95 acres',
    formattedHectares: '3.62 hectares',
    cornersCount: 7,
    gpsStatus: 'GPS Connected (±12m)',
    gpsAccuracy: 12,
    soilTestReports: [],
    lastMonitoringTimestamp: new Date().toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'field_demo_02',
    id: 'field_demo_02',
    farmerId: 'usr_farmer_demo_01',
    fieldName: 'South Plot - Tomato Patch',
    crop: 'Tomato',
    cropVariety: 'Abhinav Hybrid (Syngenta)',
    season: 'Kharif',
    cropStage: 'Flowering & Fruiting Stage',
    farmerName: 'Rameshwar Patil',
    soilType: 'Black Soil / Regur',
    irrigationMethod: 'Drip Irrigation',
    notes: 'Raised beds with silver-black mulch.',
    points: [
      { lat: 20.17150, lng: 73.98210 },
      { lat: 20.17280, lng: 73.98390 },
      { lat: 20.17190, lng: 73.98510 },
      { lat: 20.17060, lng: 73.98320 },
    ],
    center: { lat: 20.17170, lng: 73.98357 },
    areaAcres: 4.20,
    areaHectares: 1.70,
    areaSqMeters: 17000,
    formattedAcres: '4.20 acres',
    formattedHectares: '1.70 hectares',
    cornersCount: 4,
    gpsStatus: 'GPS Connected (±15m)',
    gpsAccuracy: 15,
    soilTestReports: [],
    lastMonitoringTimestamp: new Date().toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function getStatelessFields(farmerId) {
  return [...STATELESS_FIELDS];
}

function saveStatelessField(fieldData, farmerId) {
  const id = fieldData._id || fieldData.id || `field_${Date.now()}`;
  const saved = {
    ...fieldData,
    _id: id,
    id,
    farmerId: farmerId || 'usr_farmer_demo_01',
    updatedAt: new Date().toISOString()
  };
  const idx = STATELESS_FIELDS.findIndex(f => f._id === id || f.id === id);
  if (idx >= 0) {
    STATELESS_FIELDS[idx] = saved;
  } else {
    STATELESS_FIELDS.unshift(saved);
  }
  return saved;
}

function deleteStatelessField(id, farmerId) {
  STATELESS_FIELDS = STATELESS_FIELDS.filter(f => f._id !== id && f.id !== id);
  return [...STATELESS_FIELDS];
}

// -------------------------------------------------------------
// STATELESS CROP SCANS & COMPARISONS STORE
// -------------------------------------------------------------
let STATELESS_CROP_SCANS = [
  {
    _id: 'scan_wheat_01',
    farmerId: 'usr_farmer_demo_01',
    fieldId: 'field_demo_01',
    fieldName: 'North Plot - Wheat & Maize Block',
    cropName: 'Wheat',
    cropVariety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Vegetative Stage',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Yellow powdery spots spreading on lower wheat blades',
    detectedProblem: 'Yellow Rust / Stripe Rust (Puccinia striiformis)',
    detectedProblemHi: 'गेहूं का पीला रतुआ / स्ट्राइप रस्ट',
    confidence: 94.5,
    severity: 'High',
    healthStatus: 'Needs Attention',
    healthScore: 42,
    symptoms: ['Linear yellow powdery pustules', 'Chlorosis', 'Premature leaf drying'],
    cause: 'Fungal infection promoted by high morning humidity and cloudy weather.',
    causeHi: 'अधिक नमी और बादलों के मौसम के कारण फैलने वाला फफूंद रोग।',
    diagnosis: 'Active Stripe Rust sporulation along vascular leaf lines. Urgent fungicide treatment needed.',
    diagnosisHi: 'पत्तियों की शिराओं पर पीले रतुए के सक्रिय लक्षण। तत्काल छिड़काव आवश्यक।',
    recommendedTreatment: {
      organic: 'Spray fermented neem leaf extract @ 50ml/L water.',
      chemical: 'Spray Propiconazole 25% EC (Tilt) @ 1ml per litre water.',
      general: 'Inspect border rows and refrain from high nitrogen application.',
      timeline: 'Spray within 24-48 hours.'
    },
    fertilizerRecommendation: 'Hold urea; apply Potash and Micronutrients to strengthen cell walls.',
    irrigationRecommendation: 'Withhold heavy watering to lower microclimate humidity.',
    scanDate: new Date('2025-09-15T10:30:00Z').toISOString(),
    createdAt: new Date('2025-09-15T10:30:00Z').toISOString()
  },
  {
    _id: 'scan_wheat_02',
    farmerId: 'usr_farmer_demo_01',
    fieldId: 'field_demo_01',
    fieldName: 'North Plot - Wheat & Maize Block',
    cropName: 'Wheat',
    cropVariety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Vegetative to Tillering Stage',
    imageUrl: 'https://images.unsplash.com/photo-1535242208474-9a2793260ca8?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1535242208474-9a2793260ca8?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Chlorotic striping with fading yellow spores',
    detectedProblem: 'Early Foliar Blight / Rust Aftermath',
    detectedProblemHi: 'पत्तियों का झुलसा / रतुआ प्रभाव कम हो रहा है',
    confidence: 91.2,
    severity: 'Medium',
    healthStatus: 'Moderate',
    healthScore: 68,
    symptoms: ['Mild foliar chlorosis', 'Necrotic tips on older leaves'],
    cause: 'Residual fungal stress resolving after fungicide spray.',
    causeHi: 'प्रोपिकोनाजोल के छिड़काव के बाद फफूंद का प्रभाव घट रहा है।',
    diagnosis: 'Significant decline in active pustules. Recovery underway.',
    diagnosisHi: 'सक्रिय रतुआ काफी घट गया है। फसल में नई पत्तियां आ रही हैं।',
    recommendedTreatment: {
      organic: 'Apply bio-fungicide Trichoderma harzianum @ 5g/L.',
      chemical: 'Spot-spray Mancozeb 75% WP @ 2g/L if humid.',
      general: 'Ensure uniform light drip cycle.',
      timeline: 'Scout within 5 days.'
    },
    fertilizerRecommendation: 'Foliar spray of 19:19:19 NPK @ 5g/L.',
    irrigationRecommendation: 'Standard irrigation 40mm per cycle.',
    scanDate: new Date('2025-10-20T11:15:00Z').toISOString(),
    createdAt: new Date('2025-10-20T11:15:00Z').toISOString()
  },
  {
    _id: 'scan_wheat_03',
    farmerId: 'usr_farmer_demo_01',
    fieldId: 'field_demo_01',
    fieldName: 'North Plot - Wheat & Maize Block',
    cropName: 'Wheat',
    cropVariety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Heading & Booting Stage',
    imageUrl: 'https://images.unsplash.com/photo-1437252611977-07f74518abb7?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1437252611977-07f74518abb7?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Lush green upper canopy, clean earheads',
    detectedProblem: 'Healthy Vegetative Canopy',
    detectedProblemHi: 'स्वस्थ वानस्पतिक फसल (रोगमुक्त)',
    confidence: 95.2,
    severity: 'Low',
    healthStatus: 'Good',
    healthScore: 86,
    symptoms: ['Clean flag leaves', 'Vigorous tillering'],
    cause: 'Adequate nutrition and pest-free microclimate.',
    causeHi: 'संतुलित पोषण व अनुकूल मौसम।',
    diagnosis: 'Disease clear. Crop ready for flowering stage.',
    diagnosisHi: 'फसल पूर्णतः स्वस्थ है। बालियां निकलने के लिए तैयार।',
    recommendedTreatment: {
      organic: 'Regular scouting.',
      chemical: 'No chemical treatment needed.',
      general: 'Maintain soil moisture.',
      timeline: 'Re-inspect in 7 days.'
    },
    scanDate: new Date('2025-11-18T09:40:00Z').toISOString(),
    createdAt: new Date('2025-11-18T09:40:00Z').toISOString()
  },
  {
    _id: 'scan_wheat_04',
    farmerId: 'usr_farmer_demo_01',
    fieldId: 'field_demo_01',
    fieldName: 'North Plot - Wheat & Maize Block',
    cropName: 'Wheat',
    cropVariety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Earhead / Flowering Stage',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Vigorous crop canopy, strong earheads forming',
    detectedProblem: 'Healthy Canopy (No Pathological Disease Detected)',
    detectedProblemHi: 'पूर्णतः स्वस्थ फसल (कोई सक्रिय रोग नहीं)',
    confidence: 96.8,
    severity: 'None (Healthy)',
    healthStatus: 'Healthy',
    healthScore: 96,
    symptoms: ['Clean flag leaves', 'Uniform green coloration', 'Robust tillers and spikes'],
    cause: 'Optimal agronomic management and recovery from early-season rust stress.',
    causeHi: 'उचित प्रबंधन और समय पर उपचार से रोगमुक्त सशक्त फसल।',
    diagnosis: 'Fully recovered and disease-free. Flag leaf area index is optimal for grain filling.',
    diagnosisHi: 'फसल पूरी तरह रोगमुक्त है। बालियों में दाना भराव के लिए पत्तियां पूर्ण स्वस्थ हैं।',
    recommendedTreatment: {
      organic: 'Continue regular field scouting.',
      chemical: 'No chemical pesticide application required.',
      general: 'Maintain moist soil condition during grain filling stage.',
      timeline: 'Re-inspect after 10-14 days.'
    },
    fertilizerRecommendation: 'Apply 0:0:50 (Potassium Sulphate) foliar spray for grain weight improvement.',
    irrigationRecommendation: 'Irrigate at grain milk stage; avoid water stress.',
    previousScanId: 'scan_wheat_03',
    scanDate: new Date('2025-12-15T14:20:00Z').toISOString(),
    createdAt: new Date('2025-12-15T14:20:00Z').toISOString()
  },
  {
    _id: 'scan_tomato_01',
    farmerId: 'usr_farmer_demo_01',
    fieldId: 'field_demo_02',
    fieldName: 'South Plot - Tomato Patch',
    cropName: 'Tomato',
    cropVariety: 'Abhinav Hybrid',
    cropStage: 'Flowering & Fruiting Stage',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Concentric brown rings on lower leaves with yellow halo',
    detectedProblem: 'Tomato Early Blight (Alternaria solani)',
    detectedProblemHi: 'टमाटर की अगेती झुलसा (अल्टरनेरिया)',
    confidence: 93.4,
    severity: 'Medium',
    healthStatus: 'Moderate',
    healthScore: 65,
    symptoms: ['Concentric dark spots on lower foliage', 'Yellow halo surrounding lesions'],
    cause: 'Fungal pathogen favored by warm humid days and rain splash.',
    causeHi: 'गर्म आर्द्रता और मिट्टी से पत्तियों पर पानी की बूंदें पड़ने से फैलने वाला कवक रोग।',
    diagnosis: 'Early stage Alternaria solani blight identified. Confined to lower 20% canopy.',
    diagnosisHi: 'निचली पत्तियों पर अगेती झुलसा के लक्षण। समय पर रोकथाम आवश्यक।',
    recommendedTreatment: {
      organic: 'Spray Trichoderma viride @ 5g/L or 1% Bordeaux mixture on affected canopy.',
      chemical: 'Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 23% SC @ 1ml/L of water.',
      general: 'Prune leaves touching soil surface.',
      timeline: 'Spray within 24 hours.'
    },
    scanDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function getStatelessCropScans(farmerId, query = {}) {
  let list = [...STATELESS_CROP_SCANS];
  if (query.crop && query.crop !== 'All') {
    list = list.filter(s => s.cropName.toLowerCase() === query.crop.toLowerCase());
  }
  if (query.fieldId && query.fieldId !== 'All') {
    list = list.filter(s => s.fieldId === query.fieldId);
  }
  if (query.healthStatus && query.healthStatus !== 'All') {
    list = list.filter(s => s.healthStatus === query.healthStatus);
  }
  if (query.search) {
    const q = query.search.toLowerCase();
    list = list.filter(s =>
      s.cropName.toLowerCase().includes(q) ||
      s.detectedProblem.toLowerCase().includes(q) ||
      (s.detectedProblemHi && s.detectedProblemHi.includes(q))
    );
  }
  return list.sort((a, b) => new Date(b.scanDate) - new Date(a.scanDate));
}

function getStatelessCropScanById(id) {
  return STATELESS_CROP_SCANS.find(s => s._id === id || s.id === id) || null;
}

function createStatelessCropScan(data) {
  const newScan = {
    ...data,
    _id: data._id || `scan_${Date.now()}`,
    createdAt: new Date().toISOString(),
    scanDate: data.scanDate || new Date().toISOString()
  };
  STATELESS_CROP_SCANS.unshift(newScan);
  return newScan;
}

function deleteStatelessCropScan(id) {
  STATELESS_CROP_SCANS = STATELESS_CROP_SCANS.filter(s => s._id !== id && s.id !== id);
  return true;
}

function getStatelessPreviousScan(farmerId, cropName) {
  const filtered = STATELESS_CROP_SCANS.filter(s =>
    s.cropName.toLowerCase() === (cropName || '').toLowerCase()
  );
  return filtered.length > 0 ? filtered[0] : null;
}

function getStatelessCropHistoryStats(farmerId) {
  const scans = STATELESS_CROP_SCANS;
  const totalScans = scans.length;
  const healthyCount = scans.filter(s => ['Healthy', 'Good'].includes(s.healthStatus)).length;
  const attentionCount = scans.filter(s => ['Moderate', 'Needs Attention', 'Critical', 'Diseased'].includes(s.healthStatus)).length;
  const uniqueCrops = Array.from(new Set(scans.map(s => s.cropName).filter(Boolean)));
  const recentScans = scans.slice(0, 4);

  return {
    totalScans,
    healthyCount,
    attentionCount,
    activeCropsCount: uniqueCrops.length,
    uniqueCrops,
    recentScans,
    lastScanDate: recentScans[0]?.scanDate || null
  };
}

function getStatelessCropTimeline(cropName = 'Wheat') {
  const scans = STATELESS_CROP_SCANS.filter(s =>
    s.cropName.toLowerCase() === cropName.toLowerCase()
  ).sort((a, b) => new Date(a.scanDate) - new Date(b.scanDate));

  return scans.map((scan, idx) => ({
    step: idx + 1,
    scanId: scan._id,
    date: scan.scanDate,
    cropStage: scan.cropStage,
    healthStatus: scan.healthStatus,
    severity: scan.severity,
    healthScore: scan.healthScore || 75,
    detectedProblem: scan.detectedProblem,
    detectedProblemHi: scan.detectedProblemHi,
    imageUrl: scan.imageUrl,
    treatmentTimeline: scan.recommendedTreatment?.timeline || ''
  }));
}

function getStatelessCropComparison(oldScanId, newScanId, language = 'hi') {
  const scanA = STATELESS_CROP_SCANS.find(s => s._id === oldScanId) || STATELESS_CROP_SCANS[0];
  const scanB = STATELESS_CROP_SCANS.find(s => s._id === newScanId) || STATELESS_CROP_SCANS[STATELESS_CROP_SCANS.length - 1];

  const dateA = new Date(scanA.scanDate);
  const dateB = new Date(scanB.scanDate);
  const [oldScan, newScan] = dateA <= dateB ? [scanA, scanB] : [scanB, scanA];

  const daysBetweenScans = Math.max(1, Math.round(Math.abs(dateB - dateA) / (1000 * 60 * 60 * 24)));
  const scoreDiff = (newScan.healthScore || 75) - (oldScan.healthScore || 75);

  const comparison = {
    status: scoreDiff > 10 ? 'Improved' : (scoreDiff < -10 ? 'Deteriorated' : 'Stable'),
    statusHi: scoreDiff > 10 ? 'फसल की स्थिति में सुधार' : (scoreDiff < -10 ? 'स्थिति में गिरावट' : 'स्थिति स्थिर'),
    progressScoreChange: scoreDiff,
    daysBetweenScans,
    healthChange: `${oldScan.healthStatus} (${oldScan.healthScore}%) → ${newScan.healthStatus} (${newScan.healthScore}%)`,
    diseaseChange: `${oldScan.detectedProblem} → ${newScan.detectedProblem}`,
    symptomsChange: `${oldScan.symptoms?.[0] || 'Symptoms'} → ${newScan.symptoms?.[0] || 'Clean foliage'}`,
    conditionThenVsNow: {
      then: `${oldScan.cropStage} | Severity: ${oldScan.severity} | Score: ${oldScan.healthScore}%`,
      now: `${newScan.cropStage} | Severity: ${newScan.severity} | Score: ${newScan.healthScore}%`
    },
    diseaseThenVsNow: {
      then: oldScan.detectedProblem,
      now: newScan.detectedProblem
    },
    healthStatusThenVsNow: {
      then: oldScan.healthStatus,
      now: newScan.healthStatus
    },
    symptomsThenVsNow: {
      then: oldScan.symptoms || [],
      now: newScan.symptoms || []
    },
    diagnosisThenVsNow: {
      then: oldScan.diagnosis || oldScan.cause || '',
      now: newScan.diagnosis || newScan.cause || ''
    },
    treatmentThenVsNow: {
      then: oldScan.recommendedTreatment?.chemical || oldScan.recommendedTreatment?.organic || 'Standard foliar spray',
      now: newScan.recommendedTreatment?.chemical || newScan.recommendedTreatment?.organic || 'Routine maintenance'
    },
    whatChanged: `Crop health score shifted by ${scoreDiff >= 0 ? '+' : ''}${scoreDiff}% over ${daysBetweenScans} days. Foliage condition shows noticeable improvement.`,
    whatChangedHi: `पिछले ${daysBetweenScans} दिनों में फसल स्वास्थ्य में ${scoreDiff >= 0 ? '+' : ''}${scoreDiff}% का परिवर्तन हुआ है। पत्तियों की स्थिति में सुधार हुआ है।`,
    possibleReason: 'Timely recommended treatments and optimal irrigation contributed to recovery.',
    possibleReasonHi: 'समय पर किए गए उपचार और संतुलित सिंचाई से फसल स्वस्थ बनी हुई है।',
    actionAdvice: 'Maintain light soil moisture and monitor for any sudden pest signs.',
    actionAdviceHi: 'खेत में पर्याप्त नमी बनाए रखें और कीट-रोग के लक्षणों पर नज़र रखें।',
    aiSummary: `Progress analysis: Health score from ${oldScan.healthScore}% to ${newScan.healthScore}% (${scoreDiff >= 0 ? '+' : ''}${scoreDiff}%).`,
    aiSummaryHi: `प्रगति विश्लेषण: स्वास्थ्य स्कोर ${oldScan.healthScore}% से ${newScan.healthScore}% (${scoreDiff >= 0 ? '+' : ''}${scoreDiff}%) पहुंचा।`
  };

  return {
    comparisonId: `comp_${Date.now()}`,
    cropName: newScan.cropName,
    fieldName: newScan.fieldName,
    oldScan: {
      _id: oldScan._id,
      date: oldScan.scanDate,
      imageUrl: oldScan.imageUrl,
      cropName: oldScan.cropName,
      cropVariety: oldScan.cropVariety,
      cropStage: oldScan.cropStage,
      healthStatus: oldScan.healthStatus,
      severity: oldScan.severity,
      healthScore: oldScan.healthScore,
      detectedProblem: oldScan.detectedProblem,
      detectedProblemHi: oldScan.detectedProblemHi,
      symptoms: oldScan.symptoms,
      diagnosis: oldScan.diagnosis,
      treatment: oldScan.recommendedTreatment
    },
    newScan: {
      _id: newScan._id,
      date: newScan.scanDate,
      imageUrl: newScan.imageUrl,
      cropName: newScan.cropName,
      cropVariety: newScan.cropVariety,
      cropStage: newScan.cropStage,
      healthStatus: newScan.healthStatus,
      severity: newScan.severity,
      healthScore: newScan.healthScore,
      detectedProblem: newScan.detectedProblem,
      detectedProblemHi: newScan.detectedProblemHi,
      symptoms: newScan.symptoms,
      diagnosis: newScan.diagnosis,
      treatment: newScan.recommendedTreatment
    },
    comparison
  };
}

// -------------------------------------------------------------
// STATELESS FIELD MONITORING OBSERVATIONS
// -------------------------------------------------------------
function getStatelessLatestObservation(fieldId) {
  const field = STATELESS_FIELDS.find(f => f._id === fieldId || f.id === fieldId) || STATELESS_FIELDS[0];
  const isWheat = field.crop === 'Wheat';

  return {
    success: true,
    field,
    data: {
      _id: `obs_${field._id}_latest`,
      fieldId: field._id,
      cropName: field.crop,
      cropStage: field.cropStage || 'Vegetative Stage',
      observationDate: new Date().toISOString(),
      satelliteData: {
        available: true,
        source: 'Sentinel-2B (ESA Copernicus MSI)',
        resolution: '10m Multispectral Ground Resolution',
        cloudCoverage: 4.2,
        lastObservationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        ndviMean: isWheat ? 0.78 : 0.72,
        healthCategory: 'Healthy & Vigorous',
        healthScore: isWheat ? 92 : 85,
        status: 'Latest Available',
        spatialZones: [
          { zoneId: 'z1', name: 'North Sector', areaAcres: 2.2, ndvi: 0.81, status: 'Vigorous', color: '#10B981' },
          { zoneId: 'z2', name: 'Central Sector', areaAcres: 3.5, ndvi: 0.77, status: 'Healthy', color: '#34D399' },
          { zoneId: 'z3', name: 'South Drainage Sector', areaAcres: 3.25, ndvi: 0.74, status: 'Adequate', color: '#6EE7B7' }
        ]
      },
      weatherData: {
        temperatureC: 27,
        humidityPercent: 62,
        precipitationMm: 0,
        precipitationForecast24h: 0,
        precipitationForecast48h: 1.5,
        precipitationProbability: 15,
        et0Fao: 4.1,
        condition: 'Partly Cloudy'
      },
      moistureStatus: {
        status: 'Adequate Moisture',
        statusHi: 'पर्याप्त नमी',
        moistureScore: 68,
        deficitMm: 5.2,
        recommendation: 'Soil moisture is optimal. Drip irrigation can proceed on regular scheduled intervals.'
      },
      irrigationAdvisory: {
        actionRequired: false,
        priority: 'Normal',
        messageEn: 'Adequate soil water reserve present. Hold heavy watering.',
        messageHi: 'खेत में पर्याप्त नमी उपलब्ध है। भारी सिंचाई की आवश्यकता नहीं है।'
      },
      nutrientAdvisory: {
        status: 'Balanced Nutrition',
        recommendationEn: 'Apply foliar potassium sulphate (0:0:50) at earhead emergence stage.',
        recommendationHi: 'बालियां निकलते समय 0:0:50 पोटैशियम सल्फेट का छिड़काव करें।'
      },
      diseaseRisk: {
        riskLevel: 'Low',
        messageEn: 'Dry foliage conditions prevent fungal sporulation.',
        messageHi: 'पत्तियां सूखी होने से फफूंद का खतरा कम है।'
      },
      whatShouldIDoToday: [
        { id: '1', textEn: 'Maintain light regular drip irrigation in early morning hours.', textHi: 'सुबह के समय हल्की ड्रिप सिंचाई जारी रखें।', category: 'Irrigation' },
        { id: '2', textEn: 'Inspect border rows for early signs of leaf spot or rust.', textHi: 'खेत की मेड़ों पर पत्तियों पर किसी धब्बे की जांच करें।', category: 'Scouting' },
        { id: '3', textEn: 'Ensure irrigation filters are clean for optimal fertigation.', textHi: 'ड्रिप फिल्टर साफ रखें ताकि खाद सही से पहुंचे।', category: 'Maintenance' },
        { id: '4', textEn: 'Prepare micronutrient spray for upcoming grain filling phase.', textHi: 'दाना भराव के लिए सूक्ष्म पोषक तत्वों का छिड़काव तैयार रखें।', category: 'Nutrition' },
        { id: '5', textEn: 'Check local APMC price trends before planning harvest schedule.', textHi: 'कटाई से पहले नजदीकी मंडी के भाव पर नजर रखें।', category: 'Market' }
      ],
      aiSummary: 'Field vegetation vigor is strong (NDVI 0.78). Soil moisture is well balanced, and disease risk is minimal.',
      aiSummaryHi: 'खेत में फसल की हरियाली मजबूत है (NDVI 0.78)। मिट्टी में नमी अनुकूल है और रोग का जोखिम बहुत कम है।'
    },
    alerts: []
  };
}

function getStatelessFieldMonitoringSummary(farmerId) {
  return STATELESS_FIELDS.map(field => {
    const isWheat = field.crop === 'Wheat';
    return {
      fieldId: field._id,
      fieldName: field.fieldName,
      area: field.areaAcres,
      areaUnit: 'Acres',
      crop: field.crop,
      cropVariety: field.cropVariety || 'Standard',
      cropStage: field.cropStage || 'Vegetative Stage',
      soilType: field.soilType || 'Black Soil / Regur',
      irrigationMethod: field.irrigationMethod || 'Drip Irrigation',
      location: field.center,
      lastMonitoringTimestamp: field.lastMonitoringTimestamp,
      cropHealth: 'Healthy & Vigorous',
      healthScore: isWheat ? 92 : 85,
      moistureStatus: 'Adequate Moisture',
      moistureStatusHi: 'पर्याप्त नमी',
      moistureScore: 68,
      rainForecast: 0,
      rainProbability: 15,
      irrigationRecommendation: 'Not Required Today',
      irrigationMessageEn: 'Adequate soil water reserve present.',
      irrigationMessageHi: 'खेत में पर्याप्त नमी उपलब्ध है।',
      nutrientStatus: 'Balanced Nutrition',
      nutrientStatusHi: 'संतुलित पोषण',
      diseaseRisk: 'Low',
      lastSatelliteObservation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      satelliteStatus: 'Latest Available',
      ndviMean: isWheat ? 0.78 : 0.72,
      whatShouldIDoToday: [
        { textEn: 'Maintain light regular drip irrigation.', textHi: 'हल्की नियमित ड्रिप सिंचाई जारी रखें।' }
      ],
      aiSummary: 'Optimal vegetative vigor with balanced moisture.',
      aiSummaryHi: 'पर्याप्त नमी और सशक्त फसल हरियाली।'
    };
  });
}

function getStatelessFieldHistory(fieldId) {
  const days = [14, 12, 10, 8, 6, 4, 2, 0];
  const chartData = days.map((d, i) => ({
    date: new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString(),
    ndvi: +(0.70 + (i * 0.012)).toFixed(3),
    cloudCoverage: 3 + (i % 3),
    satelliteStatus: 'Latest Available',
    moistureScore: 65 + (i % 5),
    moistureStatus: 'Adequate',
    rainfallMm: d === 6 ? 4.2 : 0,
    temperatureC: 26 + (i % 3),
    et0: 4.1,
    irrigationNeeded: false,
    diseaseRiskLevel: 'Low',
    healthScore: 84 + i
  }));

  const field = STATELESS_FIELDS.find(f => f._id === fieldId || f.id === fieldId) || STATELESS_FIELDS[0];
  return {
    success: true,
    field,
    count: chartData.length,
    history: chartData,
    chartData
  };
}

function getStatelessCompareObservations(fieldId, period = '7d') {
  const field = STATELESS_FIELDS.find(f => f._id === fieldId || f.id === fieldId) || STATELESS_FIELDS[0];
  const days = period === '30d' ? 30 : (period === '15d' ? 15 : 7);

  const current = getStatelessLatestObservation(fieldId).data;
  const previous = {
    ...current,
    observationDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    satelliteData: {
      ...current.satelliteData,
      ndviMean: +(current.satelliteData.ndviMean - 0.04).toFixed(3),
      healthScore: current.satelliteData.healthScore - 6
    },
    moistureStatus: {
      ...current.moistureStatus,
      moistureScore: 62
    }
  };

  return {
    success: true,
    canCompare: true,
    field,
    period,
    daysApart: days,
    current,
    previous,
    deltas: {
      ndviDelta: 0.04,
      ndviDeltaPercent: 5.4,
      moistureDelta: 6,
      healthDelta: 6,
      comparisonNarrativeEn: `Vegetation vigor has improved by 5.4% over ${days} days with balanced moisture.`,
      comparisonNarrativeHi: `पिछले ${days} दिनों में फसल हरियाली में 5.4% का सुधार हुआ है और नमी अनुकूल बनी हुई है।`
    }
  };
}

function addStatelessSoilTest(fieldId, soilData) {
  const field = STATELESS_FIELDS.find(f => f._id === fieldId || f.id === fieldId);
  if (field) {
    if (!field.soilTestReports) field.soilTestReports = [];
    field.soilTestReports.unshift({
      ...soilData,
      testDate: new Date().toISOString()
    });
  }
  return { success: true, message: 'Soil test report saved (stateless mode).' };
}

// -------------------------------------------------------------
// Real-Time Crop Health Snapshots Store (Permanent Records)
// -------------------------------------------------------------
const STATELESS_HEALTH_RECORDS = [
  {
    _id: 'rec_hlth_wheat_01',
    farmerId: 'usr_farmer_demo_01',
    fieldId: 'field_demo_01',
    fieldName: 'Plot A - Main Wheat Field',
    crop: 'Wheat',
    cropStage: 'Vegetative Stage',
    healthScore: 78,
    status: 'Attention Needed',
    statusHi: 'ध्यान योग्य',
    confidence: 'High',
    confidenceScore: 90,
    factors: {
      cropCondition: { score: 72, available: true, weight: 0.30, details: 'Minor yellowing observed', detailsHi: 'हल्का पीलापन देखा गया' },
      soilMoisture: { score: 70, available: true, weight: 0.20, details: 'Soil moisture decreasing', detailsHi: 'मिट्टी में नमी कम हो रही है' },
      weather: { score: 85, available: true, weight: 0.15, details: '27°C, 62% humidity', detailsHi: '27°C, 62% आर्द्रता' },
      irrigation: { score: 80, available: true, weight: 0.10, details: 'Irrigation scheduled within 48h', detailsHi: '48 घंटों में सिंचाई की सिफारिश' },
      cropStage: { score: 88, available: true, weight: 0.10, details: 'Vegetative stage progress normal', detailsHi: 'वानस्पतिक विकास सामान्य' },
      nutrients: { score: 84, available: true, weight: 0.10, details: 'Basal fertilizer active', detailsHi: 'बुवाई के समय दी गई खाद सक्रिय' },
      farmMonitoring: { score: 80, available: true, weight: 0.05, details: 'Sentinel-2 NDVI 0.72', detailsHi: 'उपग्रह NDVI 0.72' }
    },
    reasons: ['✓ Favorable weather & temperature', '⚠ Soil moisture is decreasing below recommended level'],
    reasonsHi: ['✓ मौसम एवं तापमान फसल के अनुकूल है', '⚠ मिट्टी में नमी की कमी देखी जा रही है'],
    explanation: 'Wheat health is at 78% because soil moisture was decreasing. Timely irrigation will restore peak health.',
    explanationHi: 'गेहूं का स्वास्थ्य 78% है क्योंकि खेत में नमी कम हो रही थी। सिंचाई के बाद स्वास्थ्य में सुधार होगा।',
    recommendations: [
      { id: 'rec_01', title: 'Schedule Field Irrigation', titleHi: 'खेत में सिंचाई करें', description: 'Apply irrigation within 24-48 hours', descriptionHi: '24-48 घंटों के भीतर सिंचाई करें', urgency: 'High', category: 'Irrigation' }
    ],
    dataSources: [
      { name: 'Latest Crop Image Scan', available: true, lastRecorded: new Date(Date.now() - 15 * 86400000).toISOString() },
      { name: 'Soil Moisture Telemetry', available: true, lastRecorded: new Date(Date.now() - 15 * 86400000).toISOString() },
      { name: 'Weather & Microclimate Data', available: true, lastRecorded: new Date(Date.now() - 15 * 86400000).toISOString() }
    ],
    calculatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    _id: 'rec_hlth_wheat_02',
    farmerId: 'usr_farmer_demo_01',
    fieldId: 'field_demo_01',
    fieldName: 'Plot A - Main Wheat Field',
    crop: 'Wheat',
    cropStage: 'Vegetative Stage',
    healthScore: 84,
    status: 'Healthy',
    statusHi: 'स्वस्थ',
    confidence: 'High',
    confidenceScore: 90,
    factors: {
      cropCondition: { score: 86, available: true, weight: 0.30, details: 'Foliage recovered after irrigation', detailsHi: 'सिंचाई के बाद पत्तियां हरी-भरी' },
      soilMoisture: { score: 82, available: true, weight: 0.20, details: 'Moisture restored to optimal', detailsHi: 'नमी का स्तर पुनः उत्तम' },
      weather: { score: 88, available: true, weight: 0.15, details: '26°C, 65% humidity', detailsHi: '26°C, 65% आर्द्रता' },
      irrigation: { score: 92, available: true, weight: 0.10, details: 'No irrigation needed', detailsHi: 'आज सिंचाई की आवश्यकता नहीं' },
      cropStage: { score: 88, available: true, weight: 0.10, details: 'Vigour strong', detailsHi: 'मजबूत विकास' },
      nutrients: { score: 85, available: true, weight: 0.10, details: 'Nutrients balanced', detailsHi: 'पोषक तत्व संतुलित' },
      farmMonitoring: { score: 84, available: true, weight: 0.05, details: 'Sentinel-2 NDVI 0.75', detailsHi: 'उपग्रह NDVI 0.75' }
    },
    reasons: ['✓ No significant disease detected in latest scan', '✓ Soil moisture within recommended range', '✓ Favorable weather & temperature conditions'],
    reasonsHi: ['✓ नवीनतम जांच में कोई गंभीर रोग नहीं पाया गया', '✓ मिट्टी में नमी उचित स्तर पर है', '✓ मौसम एवं तापमान फसल के अनुकूल है'],
    explanation: 'Wheat is healthy at 84%. Root zone moisture is balanced and foliage is vigorous.',
    explanationHi: 'गेहूं 84% के साथ स्वस्थ है। जड़ों में पर्याप्त नमी है और वानस्पतिक विकास तेजी से हो रहा है।',
    recommendations: [
      { id: 'rec_02', title: 'Maintain Regular Crop Inspection', titleHi: 'नियमित फसल निरीक्षण जारी रखें', description: 'Continue weekly scouting', descriptionHi: 'साप्ताहिक जांच जारी रखें', urgency: 'Low', category: 'General' }
    ],
    dataSources: [
      { name: 'Latest Crop Image Scan', available: true, lastRecorded: new Date(Date.now() - 7 * 86400000).toISOString() },
      { name: 'Soil Moisture Telemetry', available: true, lastRecorded: new Date(Date.now() - 7 * 86400000).toISOString() },
      { name: 'Weather & Microclimate Data', available: true, lastRecorded: new Date(Date.now() - 7 * 86400000).toISOString() }
    ],
    calculatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  }
];

function saveStatelessHealthRecord(record) {
  const newRec = {
    _id: `rec_hlth_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...record
  };
  STATELESS_HEALTH_RECORDS.unshift(newRec);
  return newRec;
}

function getStatelessLatestHealthRecord(fieldId, farmerId) {
  const matching = STATELESS_HEALTH_RECORDS.filter(r => {
    if (fieldId && r.fieldId !== fieldId) return false;
    if (farmerId && r.farmerId !== farmerId) return false;
    return true;
  });
  return matching[0] || STATELESS_HEALTH_RECORDS[0] || null;
}

function getStatelessHealthHistory(fieldId, period = '30d') {
  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d' || period === '3m') days = 90;
  else if (period === 'all') days = 365;

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return STATELESS_HEALTH_RECORDS.filter(r => {
    if (fieldId && r.fieldId !== fieldId) return false;
    const t = new Date(r.calculatedAt || r.createdAt).getTime();
    return t >= cutoff;
  }).sort((a, b) => new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime());
}

module.exports = {
  isDbConnected,
  getStatelessUserByRole,
  getStatelessUserByPhone,
  getStatelessUserById,
  getStatelessDashboard,
  getStatelessCrops,
  getStatelessActionPlans,
  toggleStatelessActionPlan,
  getStatelessAlerts,
  getStatelessExpertCases,
  getStatelessAdminStats,
  getStatelessMandiRates,
  BENCHMARK_MANDI_RATES,
  // Field helpers
  getStatelessFields,
  saveStatelessField,
  deleteStatelessField,
  // Crop Scan & Comparison helpers
  getStatelessCropScans,
  getStatelessCropScanById,
  createStatelessCropScan,
  deleteStatelessCropScan,
  getStatelessCropHistoryStats,
  getStatelessCropTimeline,
  getStatelessCropComparison,
  getStatelessPreviousScan,
  // Field Monitoring helpers
  getStatelessLatestObservation,
  getStatelessFieldMonitoringSummary,
  getStatelessFieldHistory,
  getStatelessCompareObservations,
  addStatelessSoilTest,
  // Crop Health helpers
  saveStatelessHealthRecord,
  getStatelessLatestHealthRecord,
  getStatelessHealthHistory
};


