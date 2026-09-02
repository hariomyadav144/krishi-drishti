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
  count: 3,
  activeAlertsCount: 3,
  district: 'Nashik District (25km Geo-Fence)',
  data: [
    {
      id: 'outbreak-1',
      pestName: 'Fall Armyworm (FAW)',
      pestNameHi: 'फॉल आर्मीवर्म सुंडी चेतावनी',
      affectedCrops: ['Maize / Corn', 'Sugarcane', 'Sorghum'],
      distanceKm: '14 km away',
      location: 'Dindori Block, Nashik',
      riskLevel: 'HIGH ALERT',
      riskColor: 'red',
      reportedCases: 23,
      firstDetected: '3 days ago',
      preventiveGuideline: 'Install 5 FAW pheromone traps per acre immediately. If whorl damage >5%, spray Emamectin Benzoate 5% SG @ 0.5g/L.',
      preventiveGuidelineHi: 'प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं। 5% से अधिक नुकसान पर इमामेक्टिन बेंजोएट (0.5 ग्राम/लीटर) का छिड़काव करें।'
    },
    {
      id: 'outbreak-2',
      pestName: 'Downy Mildew Spore Warning',
      pestNameHi: 'डाउनी मिल्ड्यू (तुलसिता) कवक चेतावनी',
      affectedCrops: ['Grapes', 'Cucumber', 'Melons', 'Tomato'],
      distanceKm: '8 km away',
      location: 'Niphad Taluka, Nashik',
      riskLevel: 'MEDIUM RISK',
      riskColor: 'amber',
      reportedCases: 14,
      firstDetected: 'Yesterday',
      preventiveGuideline: 'High morning humidity (>85%) favoring fungal sporulation. Apply preventive spray of Mancozeb 75% WP @ 2.5g/L.',
      preventiveGuidelineHi: 'सुबह की उच्च आर्द्रता से फफूंद पनप रही है। मेंकोजेब (2.5 ग्राम/लीटर) का सुरक्षात्मक छिड़काव करें।'
    },
    {
      id: 'outbreak-3',
      pestName: 'Whitefly Surge & Leaf Curl Risk',
      pestNameHi: 'सफेद मक्खी व लीफ कर्ल संक्रमण',
      affectedCrops: ['Chilli', 'Cotton', 'Tomato'],
      distanceKm: '19 km away',
      location: 'Sinnar Block',
      riskLevel: 'MODERATE',
      riskColor: 'blue',
      reportedCases: 31,
      firstDetected: '5 days ago',
      preventiveGuideline: 'Erect 20 yellow sticky traps per acre at canopy level. Spray Neem Oil 10,000 ppm @ 4ml/L.',
      preventiveGuidelineHi: 'प्रति एकड़ 20 पीले स्टिकी ट्रैप लगाएं। 10,000 PPM नीम तेल का 4 मिली/लीटर की दर से छिड़काव करें।'
    }
  ]
};

export const MOCK_SATELLITE_NDVI = {
  success: true,
  data: {
    satellite: 'Sentinel-2B Multispectral MSI (ESA Copernicus)',
    lastPassDate: 'Yesterday, 10:42 AM IST',
    nextPassDate: 'Tomorrow, 10:38 AM IST',
    resolution: '10m Ground Resolution',
    overallNDVIScore: 0.78,
    healthStatus: 'High Vegetative Vigour',
    healthStatusHi: 'उत्कृष्ट वानस्पतिक स्वास्थ्य (स्वस्थ फसल)',
    cloudCover: '4.2%',
    fieldSectors: [
      {
        sectorId: 'Plot-North (2.0 Ac)',
        name: 'Plot-North (2.0 Ac)',
        crop: 'Tomato (Abhinav Hybrid)',
        ndvi: 0.82,
        status: 'Optimal Health',
        statusHi: 'उत्कृष्ट स्वास्थ्य',
        statusColor: '#10B981',
        moistureIndex: '88% Adequate',
        stressWarning: 'None',
        recommendedAction: 'Maintain current fertigation schedule.'
      },
      {
        sectorId: 'Plot-Central (1.8 Ac)',
        name: 'Plot-Central (1.8 Ac)',
        crop: 'Tomato (Abhinav Hybrid)',
        ndvi: 0.77,
        status: 'Good Canopy',
        statusHi: 'अच्छा सघन आवरण',
        statusColor: '#10B981',
        moistureIndex: '82% Adequate',
        stressWarning: 'None',
        recommendedAction: 'Normal drip irrigation cycle.'
      },
      {
        sectorId: 'Plot-South Slope (1.2 Ac)',
        name: 'Plot-South Slope (1.2 Ac)',
        crop: 'Onion (Bhima Super)',
        ndvi: 0.68,
        status: 'Slight Moisture Stress',
        statusHi: 'हल्की नमी की कमी',
        statusColor: '#F59E0B',
        moistureIndex: '62% Low',
        stressWarning: 'Moisture Deficit',
        recommendedAction: 'Schedule 40 min supplementary drip irrigation.'
      }
    ],
    historicalNDVI: [
      { date: '10 Aug', score: 0.58 },
      { date: '15 Aug', score: 0.65 },
      { date: '20 Aug', score: 0.71 },
      { date: '25 Aug', score: 0.75 },
      { date: '30 Aug', score: 0.78 }
    ]
  }
};

export const MOCK_SCHEMES = {
  success: true,
  count: 5,
  data: [
    {
      id: 'scheme-1',
      title: 'PM-Kisan Samman Nidhi Yojana',
      titleHi: 'प्रधानमंत्री किसान सम्मान निधि योजना',
      category: 'Direct Income Support',
      categoryHi: 'प्रत्यक्ष आय सहायता',
      benefit: '₹6,000 / Year (₹2,000 per 4 months directly to Bank A/c)',
      benefitHi: '₹6,000 प्रति वर्ष (₹2,000 की 3 किस्तों में सीधे बैंक खाते में)',
      eligibility: 'All small & marginal landholding farmer families with cultivable landholding in their name.',
      eligibilityHi: 'सभी छोटे और सीमांत किसान परिवार जिनके नाम पर कृषि भूमि दर्ज है।',
      requiredDocs: ['Aadhaar Card', 'Land Ownership Record (7/12 or Khatauni)', 'Active Bank Passbook with NPCI Aadhaar Seeding'],
      portalUrl: 'https://pmkisan.gov.in',
      status: 'Active / 17th Installment Disbursed'
    },
    {
      id: 'scheme-2',
      title: 'PM Fasal Bima Yojana (PMFBY)',
      titleHi: 'प्रधानमंत्री फसल बीमा योजना',
      category: 'Crop Insurance & Risk Shield',
      categoryHi: 'फसल बीमा व सुरक्षा कवच',
      benefit: 'Comprehensive coverage against drought, flood, pests, unseasonal hail (Farmer premium: only 1.5% - 2%)',
      benefitHi: 'सूखा, बाढ़, कीट व बेमौसम ओलावृष्टि से व्यापक सुरक्षा (किसान प्रीमियम: केवल 1.5% से 2%)',
      eligibility: 'All farmers growing notified crops in notified areas (both loanee and non-loanee).',
      eligibilityHi: 'अधिसूचित क्षेत्रों में अधिसूचित फसल उगाने वाले सभी किसान।',
      requiredDocs: ['Land Record', 'Sowing Certificate / Sowing Declaration', 'Bank Account Details', 'Aadhaar Card'],
      portalUrl: 'https://pmfby.gov.in',
      status: 'Open for Kharif / Rabi Enrollment'
    },
    {
      id: 'scheme-3',
      title: 'PM Krishi Sinchayee Yojana (Micro-Irrigation Subsidy)',
      titleHi: 'प्रधानमंत्री कृषि सिंचाई योजना (ड्रिप/स्प्रिंकलर सब्सिडी)',
      category: 'Irrigation & Water Tech',
      categoryHi: 'सूक्ष्म सिंचाई तकनीक',
      benefit: '55% to 80% direct subsidy on Drip and Sprinkler Irrigation systems.',
      benefitHi: 'ड्रिप और स्प्रिंकलर सिस्टम लगाने पर 55% से 80% तक सरकारी सब्सिडी।',
      eligibility: 'Farmers having assured water source (well, borewell, farm pond) and agricultural land.',
      eligibilityHi: 'जिन किसानों के पास सुनिश्चित जल स्रोत (कुआं, बोरवेल, तालाब) और कृषि भूमि है।',
      requiredDocs: ['7/12 Land Extract & 8A', 'Electricity Bill / Water Source Proof', 'Quotation from authorized Micro-irrigation vendor'],
      portalUrl: 'https://pmksy.gov.in',
      status: 'Accepting Online Applications'
    },
    {
      id: 'scheme-4',
      title: 'PM-KUSUM Solar Agriculture Pump Scheme',
      titleHi: 'पीएम-कुसुम सौर ऊर्जा पंप योजना',
      category: 'Renewable Power',
      categoryHi: 'सौर ऊर्जा कृषि पंप',
      benefit: '60% subsidy (30% Central + 30% State) for 3HP, 5HP & 7.5HP Solar Water Pumps.',
      benefitHi: '3HP, 5HP और 7.5HP सोलर पंप पर 60% तक सब्सिडी (किसान अंशदान केवल 10%)।',
      eligibility: 'Farmers without grid electricity or farmers wishing to replace existing diesel pumps.',
      eligibilityHi: 'ग्रिड बिजली से वंचित किसान अथवा डीजल पंप को सोलर पंप में बदलने के इच्छुक किसान।',
      requiredDocs: ['Land Ownership papers', 'Identity Proof', 'Bank statement', 'Water source certificate'],
      portalUrl: 'https://pmkusum.mnre.gov.in',
      status: 'Phase II Active'
    },
    {
      id: 'scheme-5',
      title: 'Soil Health Card Scheme (मृदा स्वास्थ्य कार्ड)',
      titleHi: 'राष्ट्रीय मृदा स्वास्थ्य कार्ड योजना',
      category: 'Soil & Fertility',
      categoryHi: 'मिट्टी परीक्षण',
      benefit: '100% Free laboratory chemical testing of 12 soil parameters with customized crop fertilizer chart.',
      benefitHi: '12 मिट्टी मापदंडों की 100% निशुल्क सरकारी लैब जांच व फसल अनुसार खाद सिफारिश कार्ड।',
      eligibility: 'Every farmer in India once every 2 years.',
      eligibilityHi: 'भारत का प्रत्येक किसान (हर 2 वर्ष में एक बार)।',
      requiredDocs: ['GPS location of soil sample', 'Farmer contact & land plot identification'],
      portalUrl: 'https://soilhealth.dac.gov.in',
      status: 'Free Soil Testing Available at Local KVK'
    }
  ]
};

export const MOCK_ACTION_PLANS = {
  tasks: [
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
  ],
  stats: {
    total: 3,
    completed: 1,
    pending: 2,
    completionRate: 33,
  }
};

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

export const MOCK_FARMER_INSIGHTS = {
  totalAnalyses: 14,
  criticalIssues: 1,
  totalTasks: 8,
  completedTasks: 6,
  taskCompletionRate: 75,
  farmHealthScore: 91,
  ndviAverage: 0.78,
  soilMoistureAvg: 68,
  estimatedYieldTons: '24.5 MT / Acre',
  soilHealth: {
    nitrogen: 'Medium (280 kg/ha)',
    phosphorus: 'Optimal (22 kg/ha)',
    potassium: 'High (310 kg/ha)',
    ph: '7.2 (Ideal)',
    organicCarbon: '0.62%',
  },
  healthTrends: [
    { date: 'W1', score: 72 },
    { date: 'W2', score: 78 },
    { date: 'W3', score: 85 },
    { date: 'W4', score: 89 },
    { date: 'Current', score: 91 },
  ],
  severityDistribution: [
    { name: 'Healthy / Minor', value: 9 },
    { name: 'Moderate (Blight)', value: 4 },
    { name: 'Critical', value: 1 },
  ],
};

export const MOCK_PREDEFINED_QUERIES = [
  { query: 'How to control Tomato leaf curl virus?', queryHi: 'टमाटर में पत्ती मुड़न (लीफ कर्ल) रोग कैसे रोकें?', category: 'Disease Control', crop: 'Tomato' },
  { query: 'What is the best fertilizer dose for flowering stage?', queryHi: 'फूल आने की अवस्था में सबसे अच्छा खाद क्या है?', category: 'Nutrition', crop: 'General' },
  { query: 'When should I irrigate my crop this week?', queryHi: 'इस हफ्ते मुझे अपनी फसल की सिंचाई कब करनी चाहिए?', category: 'Irrigation', crop: 'General' },
  { query: 'How to apply for PM-KISAN subsidy for drip irrigation?', queryHi: 'ड्रिप सिंचाई सब्सिडी के लिए आवेदन कैसे करें?', category: 'Government Scheme', crop: 'General' },
];

/**
 * Calculates complete agricultural fertilizer requirements
 */
export function calculateMockFertilizer({ cropName = 'Tomato', landArea = 2.5, landUnit = 'Acres', soilType = 'Black Soil' }) {
  const area = parseFloat(landArea) || 1.0;
  let acreFactor = 1.0;
  const unit = (landUnit || 'Acres').toLowerCase();
  if (unit === 'hectares' || unit === 'hectare') acreFactor = 2.471;
  else if (unit === 'bigha') acreFactor = 0.4;
  else if (unit === 'guntha') acreFactor = 0.025;
  const acres = area * acreFactor;

  const totalUreaKg = Math.round(60 * 2.17 * acres);
  const totalDapKg = Math.round(40 * 2.17 * acres);
  const totalMopKg = Math.round(40 * 1.67 * acres);

  const ureaBags = Number((totalUreaKg / 45).toFixed(1));
  const dapBags = Number((totalDapKg / 50).toFixed(1));
  const mopBags = Number((totalMopKg / 50).toFixed(1));
  const estimatedCostINR = Math.round(ureaBags * 267 + dapBags * 1350 + mopBags * 1700);

  return {
    success: true,
    data: {
      cropName,
      enteredArea: area,
      enteredUnit: landUnit || 'Acres',
      normalizedAcres: Number(acres.toFixed(2)),
      soilAdjustment: soilType.includes('Sandy') ? 'Add +15% Potash due to high leaching' : 'Balanced optimal dosage for ' + soilType,
      recommendation: {
        totalUreaKg,
        ureaBags,
        totalDapKg,
        dapBags,
        totalMopKg,
        mopBags,
        estimatedCostINR,
        stageBreakup: [
          {
            stage: 'Basal Dose (Land Prep / Transplanting)',
            notes: 'Incorporate well into soil before creating beds or laying mulch.',
            scaledDoses: {
              ureaKg: Math.round(25 * acres),
              dapKg: Math.round(85 * acres),
              mopKg: Math.round(35 * acres),
            }
          },
          {
            stage: 'Vegetative Growth (15-30 Days)',
            notes: 'Foliar spray + root fertigation via drip.',
            scaledDoses: {
              ureaKg: Math.round(30 * acres),
              dapKg: 0,
              mopKg: 0,
            }
          },
          {
            stage: 'Flowering & Fruiting (30-60 Days)',
            notes: 'Boosts flower retention and fruit size.',
            scaledDoses: {
              ureaKg: 0,
              dapKg: 0,
              mopKg: Math.round(25 * acres),
            }
          }
        ],
        organicAlternatives: [
          { name: 'Well-rotted FYM / Cow Dung Compost', dosePerAcre: '4-5 Tonnes at basal preparation' },
          { name: 'Vermicompost', dosePerAcre: '1,000 kg at transplanting' },
          { name: 'Neem Cake (De-oiled)', dosePerAcre: '150 kg for root nematode and pest protection' }
        ]
      }
    }
  };
}

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
export function generateMockAiAnswer(query = '', cropName = 'Tomato') {
  const qLower = (query || '').toLowerCase();
  
  let issue = 'Nutrition & Vegetative Management Guidance';
  let issueHi = 'फसल पोषण एवं वानस्पतिक प्रबंधन मार्गदर्शन';
  let reason = 'Seasonal environmental transition and crop nutrient demand at current phenological stage.';
  let reasonHi = 'मौसमी बदलाव और वर्तमान वानस्पतिक अवस्था में पोषक तत्वों की विशेष आवश्यकता।';
  let whatToDo = 'Apply water-soluble NPK 19:19:19 @ 5g/L or 00:52:34 via drip fertigation. Spray Neem oil (1500 ppm) @ 3ml/L as preventive bio-shield.';
  let whatToDoHi = 'ड्रिप से 19:19:19 या 00:52:34 खाद @ 5 ग्राम/लीटर दें। सुरक्षा के लिए नीम तेल (1500 ppm) 3 मिली/लीटर का छिड़काव करें।';
  let whenToDo = 'Early morning between 6:30 AM to 9:30 AM when crop stomata are open and wind speed is calm.';
  let whenToDoHi = 'सुबह 6:30 से 9:30 के बीच जब पौधों के रंध्र खुले हों और हवा शांत हो।';
  let whatToAvoid = 'Do not apply heavy irrigation under midday sun or mix copper fungicides with microbial bio-fertilizers.';
  let whatToAvoidHi = 'दोपहर की तेज धूप में सिंचाई न करें और कॉपर फफूंदनाशक को जैविक जीवाणुओं के साथ न मिलाएं।';

  if (qLower.includes('curl') || qLower.includes('virus') || qLower.includes('मुड़न') || qLower.includes('सफेद मक्खी')) {
    issue = 'Leaf Curl Viral Vector & Sucking Pest Alert';
    issueHi = 'पत्ती मुड़न (लीफ कर्ल) विषाणु एवं रसचूषक कीट चेतावनी';
    reason = 'Spread by Whitefly (Bemisia tabaci) nymph feeding on tender apical shoots.';
    reasonHi = 'सफेद मक्खी के कोमल पत्तियों से रस चूसने के कारण यह वायरस फैलता है।';
    whatToDo = 'Erect 20 yellow sticky traps per acre. Spray Diafenthiuron 50% WP @ 1.2g/L or Neem Oil 10,000 ppm @ 3ml/L.';
    whatToDoHi = 'प्रति एकड़ 20 पीले स्टिकी ट्रैप लगाएं। डायफेंथियूरॉन 50% WP @ 1.2 ग्राम/लीटर या नीम तेल 3 मिली/लीटर का छिड़काव करें।';
    whenToDo = 'Apply first spray today before 10 AM, repeat after 7 days if vectors persist.';
    whenToDoHi = 'आज सुबह 10 बजे से पहले पहला छिड़काव करें, 7 दिन बाद आवश्यकता पड़ने पर दोहराएं।';
    whatToAvoid = 'Do not overdose synthetic pyrethroids which induce resurgence of whiteflies.';
    whatToAvoidHi = 'सिंथेटिक कीटनाशकों का अत्यधिक उपयोग न करें जिससे कीटों की प्रतिरोधक क्षमता बढ़ती है।';
  } else if (qLower.includes('water') || qLower.includes('irrigation') || qLower.includes('पानी') || qLower.includes('सिंचाई')) {
    issue = 'Soil Moisture & Evapotranspiration Optimization';
    issueHi = 'मृदा नमी एवं वाष्पोत्सर्जन प्रबंधन';
    reason = 'High daytime temperatures accelerate soil surface evaporation in root zone.';
    reasonHi = 'दिन के उच्च तापमान से जड़ क्षेत्र में नमी तेजी से कम होती है।';
    whatToDo = 'Run drip irrigation for 45 minutes every alternate day. Check tensiometer/soil moisture ball before watering.';
    whatToDoHi = 'हर एक दिन छोड़कर 45 मिनट के लिए ड्रिप चलाएं। पानी देने से पहले मिट्टी की नमी अवश्य जांचें।';
    whenToDo = 'Early morning between 6:00 AM and 8:30 AM.';
    whenToDoHi = 'सुबह 6:00 से 8:30 बजे के बीच जब वाष्पीकरण न्यूनतम हो।';
    whatToAvoid = 'Avoid flood irrigation or watering during peak heat hours (12 PM - 3 PM).';
    whatToAvoidHi = 'दोपहर 12 से 3 बजे के बीच तेज धूप में पानी न दें और खेत में पानी भरने से बचें।';
  }

  const cardData = {
    cropName: cropName || 'Tomato',
    queryText: query || 'Crop Health Advisory',
    category: 'AI Agronomist Expert Advice',
    issue,
    issueHi,
    reason,
    reasonHi,
    whatToDo,
    whatToDoHi,
    whenToDo,
    whenToDoHi,
    whatToAvoid,
    whatToAvoidHi,
  };

  return {
    success: true,
    data: cardData,
    answer: whatToDo,
    answerHi: whatToDoHi,
    recommendations: [whatToDo, whenToDo]
  };
}
