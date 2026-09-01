const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const CropAnalysis = require('../models/CropAnalysis');
const Recommendation = require('../models/Recommendation');
const ActionPlan = require('../models/ActionPlan');
const Alert = require('../models/Alert');
const Feedback = require('../models/Feedback');

async function seedDatabase() {
  console.log('Seeding Krishi Drishti database with realistic agricultural datasets...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    FarmerProfile.deleteMany({}),
    Farm.deleteMany({}),
    Crop.deleteMany({}),
    CropAnalysis.deleteMany({}),
    Recommendation.deleteMany({}),
    ActionPlan.deleteMany({}),
    Alert.deleteMany({}),
    Feedback.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  // 1. Create Users
  const farmer1 = await User.create({
    name: 'Rameshwar Patil (रामेश्वर पाटिल)',
    phone: '9876543210',
    email: 'rameshwar.patil@krishidrishti.in',
    password: defaultPassword,
    role: 'farmer',
    isOnboarded: true,
    languagePreference: 'en',
  });

  const farmer2 = await User.create({
    name: 'Harpreet Singh (हरप्रीत सिंह)',
    phone: '9876543211',
    email: 'harpreet.singh@krishidrishti.in',
    password: defaultPassword,
    role: 'farmer',
    isOnboarded: true,
    languagePreference: 'hi',
  });

  const farmer3 = await User.create({
    name: 'Santosh Kumar Maurya (संतोष मौर्य)',
    phone: '9876543212',
    email: 'santosh.maurya@krishidrishti.in',
    password: defaultPassword,
    role: 'farmer',
    isOnboarded: true,
    languagePreference: 'hi',
  });

  const expertUser = await User.create({
    name: 'Dr. Ananya Sharma (KVK Scientist)',
    phone: '9876500001',
    email: 'dr.ananya@kvk-agri.gov.in',
    password: defaultPassword,
    role: 'expert',
    isOnboarded: true,
    languagePreference: 'en',
  });

  const adminUser = await User.create({
    name: 'Krishi Drishti Admin Officer',
    phone: '9876599999',
    email: 'admin@krishidrishti.in',
    password: defaultPassword,
    role: 'admin',
    isOnboarded: true,
    languagePreference: 'en',
  });

  // 2. Farmer Profiles
  await FarmerProfile.create([
    {
      userId: farmer1._id,
      state: 'Maharashtra',
      district: 'Nashik',
      village: 'Pimpalgaon Baswant',
      pincode: '422209',
      location: 'Pimpalgaon Baswant, Nashik, Maharashtra',
      experienceYears: 12,
    },
    {
      userId: farmer2._id,
      state: 'Punjab',
      district: 'Ludhiana',
      village: 'Samrala',
      pincode: '141114',
      location: 'Samrala, Ludhiana, Punjab',
      experienceYears: 18,
    },
    {
      userId: farmer3._id,
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      village: 'Rajatalab',
      pincode: '221311',
      location: 'Rajatalab, Varanasi, Uttar Pradesh',
      experienceYears: 8,
    }
  ]);

  // 3. Farms
  const farm1 = await Farm.create({
    farmerId: farmer1._id,
    farmName: 'Shri Ganesha Krishi Farm',
    farmSize: 5.5,
    landUnit: 'Acres',
    soilType: 'Black Soil / Regur',
    irrigationMethod: 'Drip Irrigation',
    soilPh: 6.9,
    organicMatter: 'Medium (0.72%)',
  });

  const farm2 = await Farm.create({
    farmerId: farmer2._id,
    farmName: 'Guru Nanak Agro Field',
    farmSize: 12.0,
    landUnit: 'Acres',
    soilType: 'Alluvial',
    irrigationMethod: 'Tube Well',
    soilPh: 7.2,
    organicMatter: 'High (0.85%)',
  });

  const farm3 = await Farm.create({
    farmerId: farmer3._id,
    farmName: 'Maurya Vegetable Orchard',
    farmSize: 3.5,
    landUnit: 'Acres',
    soilType: 'Sandy Loam',
    irrigationMethod: 'Sprinkler System',
    soilPh: 6.5,
    organicMatter: 'Medium (0.60%)',
  });

  // 4. Crops
  const crop1 = await Crop.create({
    farmId: farm1._id,
    farmerId: farmer1._id,
    cropName: 'Tomato',
    variety: 'Abhinav Hybrid (Syngenta)',
    cropStage: 'Flowering Stage',
    plantingDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
    healthStatus: 'Good',
    healthScore: 88,
    areaAllocated: 3.5,
    isCurrent: true,
  });

  await Crop.create({
    farmId: farm1._id,
    farmerId: farmer1._id,
    cropName: 'Onion',
    variety: 'Fursungi Red',
    cropStage: 'Vegetative Stage',
    plantingDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    healthStatus: 'Excellent',
    healthScore: 94,
    areaAllocated: 2.0,
    isCurrent: false,
  });

  await Crop.create({
    farmId: farm2._id,
    farmerId: farmer2._id,
    cropName: 'Wheat',
    variety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Vegetative Stage',
    plantingDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    healthStatus: 'Good',
    healthScore: 90,
    areaAllocated: 12.0,
    isCurrent: true,
  });

  await Crop.create({
    farmId: farm3._id,
    farmerId: farmer3._id,
    cropName: 'Chilli / Pepper',
    variety: 'Sitara Gold',
    cropStage: 'Fruit / Pod Formation',
    plantingDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    healthStatus: 'Moderate',
    healthScore: 78,
    areaAllocated: 3.5,
    isCurrent: true,
  });

  // 5. Crop Analyses (Disease Scan Records)
  const analysis1 = await CropAnalysis.create({
    farmerId: farmer1._id,
    cropId: crop1._id,
    cropName: 'Tomato',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Brown concentric spots on lower leaves with yellow halo',
    detectedProblem: 'Tomato Early Blight (Alternaria solani)',
    detectedProblemHi: 'टमाटर की अगेती झुलसा (अल्टरनेरिया)',
    confidence: 93.4,
    severity: 'Medium',
    cause: 'Fungal infection favored by warm humidity and soil moisture splashing onto lower leaves.',
    causeHi: 'गर्म आर्द्रता और जमीन से पत्तियों पर पानी की बूंदें पड़ने से फैलने वाला कवक रोग।',
    symptoms: ['Target-like dark brown concentric rings', 'Yellow halo surrounding spots', 'Premature leaf drying'],
    recommendedAction: 'Prune infected lower foliage touching the soil. Apply protective Mancozeb spray.',
    recommendedActionHi: 'निचली संक्रमित पत्तियों को काटें और मैंकोजेब 75% WP का छिड़काव करें।',
    organicTreatment: 'Spray Trichoderma viride @ 5g/L or 1% Bordeaux mixture on affected canopy.',
    chemicalTreatment: 'Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 23% SC @ 1ml/L of water.',
    preventionTips: [
      'Maintain drip irrigation to avoid leaf wetness',
      'Use 25-micron silver-black plastic mulch',
      'Rotate crops with non-solanaceous crops'
    ],
    nextActionTimeline: 'Apply recommended fungicide within 24 hours. Re-inspect foliage on Day 3.',
    expertReviewed: true,
    expertNotes: 'Confirmed Early Blight. Pruning recommendation followed. Add Mancozeb with sticker.',
    reviewedBy: expertUser._id,
  });

  const analysis2 = await CropAnalysis.create({
    farmerId: farmer1._id,
    cropId: crop1._id,
    cropName: 'Tomato',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Leaves curling upwards and slight yellowing on terminal shoots',
    detectedProblem: 'Tomato Leaf Curl Virus (ToLCV)',
    detectedProblemHi: 'टमाटर पर्ण कुंचन विषाणु (लीफ कर्ल)',
    confidence: 91.2,
    severity: 'High',
    cause: 'Transmitted by Silverleaf Whitefly (Bemisia tabaci) during warm, humid conditions.',
    causeHi: 'सफेद मक्खी द्वारा फैलने वाला विषाणु रोग।',
    symptoms: ['Upward curling of leaf margins', 'Leaf chlorosis/yellowing', 'Stunted plant growth'],
    recommendedAction: 'Rogue severely affected plants and install yellow sticky traps with neem spray.',
    recommendedActionHi: 'पीले चिपचिपे कार्ड लगाएं और नीम के तेल का छिड़काव करें।',
    organicTreatment: 'Spray 5ml/L Neem Oil (10,000 PPM) mixed with liquid soap.',
    chemicalTreatment: 'Foliar spray of Imidacloprid 17.8% SL @ 0.5 ml/L during early morning hours.',
    preventionTips: ['Use virus-tolerant hybrid varieties', 'Install insect net in seedling stage'],
    nextActionTimeline: 'Inspect underside of leaves after 48 hours and repeat spray on Day 4.',
    expertReviewed: false,
  });

  // 6. AI Recommendations
  const rec1 = await Recommendation.create({
    farmerId: farmer1._id,
    cropId: crop1._id,
    cropName: 'Tomato',
    queryText: 'My crop leaves are turning yellow, what should I do?',
    category: 'Fertilizer & Nutrition',
    issue: 'Interveinal Chlorosis and Nitrogen/Iron Deficiency',
    issueHi: 'पत्तियों का पीलापन (नाइट्रोजन एवं आयरन की कमी)',
    reason: 'Heavy leaching of nitrate ions during recent irrigation or restricted nutrient uptake due to alkaline soil pH.',
    reasonHi: 'सिंचाई के बाद नाइट्रोजन की कमी अथवा मिट्टी के अधिक क्षारीय होने से पोषक तत्वों का अवशोषण रुकना।',
    whatToDo: 'Apply foliar spray of water-soluble NPK (19:19:19) @ 5g/L mixed with Chelated Iron (Fe-EDTA) @ 1g/L. Add 100g Urea per knapsack sprayer.',
    whatToDoHi: '19:19:19 घुलनशील खाद (5 ग्राम/लीटर) और चिलेटेड आयरन (1 ग्राम/लीटर) का पत्तियों पर छिड़काव करें।',
    whenToDo: 'Apply in the early morning between 7:00 AM - 9:30 AM when leaf stomata are open.',
    whenToDoHi: 'सुबह 7:00 से 9:30 बजे के बीच छिड़काव करें।',
    whatToAvoid: 'Avoid applying heavy raw urea directly on dry soil; avoid spraying under intense afternoon sunlight (>32°C).',
    whatToAvoidHi: 'दोपहर की तेज धूप में छिड़काव न करें।',
    actionPlanCreated: true,
    feedbackStatus: 'helped',
    feedbackComment: 'The 19:19:19 foliar spray showed green recovery within 4 days. Excellent!',
  });

  const rec2 = await Recommendation.create({
    farmerId: farmer1._id,
    cropId: crop1._id,
    cropName: 'Tomato',
    queryText: 'When should I irrigate my field?',
    category: 'Irrigation',
    issue: 'Optimal Irrigation Scheduling based on Soil Moisture and Evapotranspiration',
    issueHi: 'मिट्टी की नमी और मौसम अनुसार सही सिंचाई समय',
    reason: 'Current flowering stage requires adequate root-zone moisture; over-irrigation risks root rot.',
    reasonHi: 'फूलों की अवस्था में संतुलित नमी जरूरी है; अधिक पानी से जड़ सड़न का खतरा होता है।',
    whatToDo: 'Check top 2 inches of topsoil; apply 3 to 4 hours of drip irrigation in late evening or early morning.',
    whatToDoHi: 'शाम या सुबह ड्रिप द्वारा 3-4 घंटे हल्की सिंचाई करें।',
    whenToDo: 'Irrigate late evening (after 5:00 PM) or early morning (before 8:30 AM).',
    whenToDoHi: 'सुबह 8:30 बजे से पहले या शाम को 5:00 बजे के बाद।',
    whatToAvoid: 'Avoid flood irrigation during high noon heat; avoid standing water around plant collar.',
    whatToAvoidHi: 'दोपहर में पानी न लगाएं और तने के पास जलभराव न होने दें।',
    actionPlanCreated: true,
    feedbackStatus: 'helped',
  });

  // 7. Action Plans / Checklist
  await ActionPlan.create([
    {
      farmerId: farmer1._id,
      cropId: crop1._id,
      cropAnalysisId: analysis1._id,
      title: 'Prune infected lower tomato foliage touching soil',
      titleHi: 'जमीन से छूने वाली निचली संक्रमित पत्तियों को काटें',
      description: 'Remove yellowing leaves with black spots and dispose of them outside field borders.',
      dayLabel: 'TODAY',
      isCompleted: true,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      priority: 'High',
      category: 'Pruning & Weeding',
    },
    {
      farmerId: farmer1._id,
      cropId: crop1._id,
      cropAnalysisId: analysis1._id,
      title: 'Apply Mancozeb 75% WP protective fungicide spray',
      titleHi: 'मैंकोजेब 75% फफूंदनाशक का छिड़काव करें (2.5 ग्राम/लीटर)',
      description: 'Spray 2.5g/L with 0.5ml sticker early in the morning.',
      dayLabel: 'DAY 2',
      isCompleted: true,
      completedAt: new Date(),
      priority: 'High',
      category: 'Pest Management',
    },
    {
      farmerId: farmer1._id,
      cropId: crop1._id,
      recommendationId: rec1._id,
      title: 'Apply NPK 19:19:19 + Micronutrient foliar nourishment',
      titleHi: '19:19:19 + सूक्ष्म पोषक तत्वों का पत्तियों पर छिड़काव करें',
      description: 'Boost chlorophyll synthesis and strengthen flowering buds.',
      dayLabel: 'DAY 3',
      isCompleted: false,
      priority: 'Medium',
      category: 'Fertilizer',
    },
    {
      farmerId: farmer1._id,
      cropId: crop1._id,
      title: 'Re-inspect leaf undersides and verify whitefly reduction',
      titleHi: 'पत्तियों के निचले भाग का निरीक्षण करें और सफेद मक्खी की स्थिति जांचें',
      description: 'Check sticky traps and new shoot growth.',
      dayLabel: 'DAY 5',
      isCompleted: false,
      priority: 'Medium',
      category: 'Inspection',
    },
    {
      farmerId: farmer1._id,
      cropId: crop1._id,
      title: 'Run scheduled drip irrigation cycle (3.5 hours)',
      titleHi: 'ड्रिप सिंचाई चक्र चलाएं (3.5 घंटे)',
      description: 'Maintain uniform root-zone moisture for flowering.',
      dayLabel: 'DAY 7',
      isCompleted: false,
      priority: 'Low',
      category: 'Irrigation',
    }
  ]);

  // 8. Alerts & Notifications
  await Alert.create([
    {
      userId: farmer1._id,
      title: 'Rain Expected Tomorrow 🌧️',
      titleHi: 'कल बारिश की संभावना 🌧️',
      message: '75% probability of scattered showers in Nashik. Hold off on field irrigation today to prevent soil waterlogging.',
      messageHi: 'नासिक में कल 75% बारिश की संभावना है। जलभराव से बचने के लिए आज खेत में पानी न लगाएं।',
      priority: 'high',
      category: 'weather',
      isRead: false,
    },
    {
      userId: farmer1._id,
      title: 'Nutrient Spray Due: NPK 19:19:19 🌿',
      titleHi: 'पोषक तत्व छिड़काव का समय: 19:19:19 🌿',
      message: 'Scheduled DAY 3 task: Apply water-soluble NPK foliar spray for enhanced flowering.',
      messageHi: 'दिन 3 का कार्य: फूलों की अच्छी बढ़वार के लिए 19:19:19 का छिड़काव करें।',
      priority: 'medium',
      category: 'fertilizer',
      isRead: false,
    },
    {
      userId: farmer1._id,
      title: 'Expert Dr. Ananya Reviewed Your Crop Case 👨‍🔬',
      titleHi: 'विशेषज्ञ डॉ. अनन्या ने आपकी फसल का निरीक्षण किया 👨‍🔬',
      message: 'Early Blight diagnosis verified. Prescription notes added with organic treatment tips.',
      messageHi: 'अगेती झुलसा रोग की पुष्टि हुई। जैविक एवं रासायनिक उपचार विवरण दर्ज किया गया है।',
      priority: 'low',
      category: 'crop_health',
      isRead: true,
    }
  ]);

  // 9. Feedback Records
  await Feedback.create([
    {
      farmerId: farmer1._id,
      recommendationId: rec1._id,
      rating: 'helped',
      comments: 'Foliar spray cleared leaf yellowing in 4 days. Excellent advice!',
      cropName: 'Tomato',
      yieldImpactReported: '+15% estimated flower setting',
    },
    {
      farmerId: farmer2._id,
      rating: 'helped',
      comments: 'Weather alert saved 2 hours of unnecessary tube well pumping before heavy rain.',
      cropName: 'Wheat',
      yieldImpactReported: 'Saved electricity and fuel costs',
    },
    {
      farmerId: farmer3._id,
      rating: 'partially_helped',
      comments: 'Mite spray reduced curling on new shoots, repeating with neem oil.',
      cropName: 'Chilli / Pepper',
    }
  ]);

  console.log('Database seeded successfully with all roles, farms, analyses, action plans, and alerts!');
}

module.exports = { seedDatabase };
