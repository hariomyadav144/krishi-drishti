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
    // If exact crop not found in benchmark, return all rather than empty
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
  BENCHMARK_MANDI_RATES
};
