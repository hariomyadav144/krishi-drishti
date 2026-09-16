const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const Field = require('../models/Field');
const CropScan = require('../models/CropScan');
const CropComparison = require('../models/CropComparison');
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
    Field.deleteMany({}),
    Crop.deleteMany({}),
    CropScan.deleteMany({}),
    CropComparison.deleteMany({}),
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

  // 4.1. Fields (Field Mapping permanent polygon records)
  const field1 = await Field.create({
    farmerId: farmer1._id,
    fieldName: 'North Plot - Wheat & Maize Block',
    crop: 'Wheat',
    season: 'Rabi',
    farmerName: farmer1.name,
    soilType: 'Black Soil / Regur',
    notes: 'Drip irrigation installed with fertigation unit. DBW-187 certified seed block.',
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
  });

  const field2 = await Field.create({
    farmerId: farmer1._id,
    fieldName: 'South Plot - Tomato & Vegetable Patch',
    crop: 'Tomato',
    season: 'Kharif',
    farmerName: farmer1.name,
    soilType: 'Black Soil / Regur',
    notes: 'Raised beds with silver-black mulch. Hybrid tomato Abhinav.',
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
  });

  // 4.2. Permanent Multi-Month Crop Scan History (Farmer 1)
  // Scan 1: September (Wheat, Poor / Leaf disease)
  const wheatScanSep = await CropScan.create({
    farmerId: farmer1._id,
    fieldId: field1._id,
    fieldName: field1.fieldName,
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
    scanDate: new Date('2025-09-15T10:30:00Z'),
    createdAt: new Date('2025-09-15T10:30:00Z'),
  });

  // Scan 2: October (Wheat, Mild fungal infection)
  const wheatScanOct = await CropScan.create({
    farmerId: farmer1._id,
    fieldId: field1._id,
    fieldName: field1.fieldName,
    cropName: 'Wheat',
    cropVariety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Tillering Stage',
    imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Spots slowing down, old lesions turning necrotic grey',
    detectedProblem: 'Arresting Stripe Rust / Mild Fungal Residuals',
    detectedProblemHi: 'नियंत्रित होता पीला रतुआ / हल्के धब्बे',
    confidence: 89.2,
    severity: 'Medium',
    healthStatus: 'Moderate',
    healthScore: 68,
    symptoms: ['Brownish desiccated stripes', 'Significantly reduced fresh yellow spores'],
    cause: 'Fungal growth arrested following curative systemic spray.',
    causeHi: 'उपचारात्मक छिड़काव के बाद फफूंद का प्रसार रुका।',
    diagnosis: 'Disease arrest verified. New tillers developing healthy foliage.',
    diagnosisHi: 'रोग नियंत्रण में। नए कल्ले स्वस्थ निकल रहे हैं।',
    recommendedTreatment: {
      organic: 'Foliar spray with Trichoderma harzianum @ 5g/L.',
      chemical: 'Repeat localized spot spray if active pustules noticed.',
      general: 'Clean weeds around field edges.',
      timeline: 'Re-inspect in 7 days.'
    },
    previousScanId: wheatScanSep._id,
    scanDate: new Date('2025-10-20T11:15:00Z'),
    createdAt: new Date('2025-10-20T11:15:00Z'),
  });

  // Scan 3: November (Wheat, Good / Significant Recovery)
  const wheatScanNov = await CropScan.create({
    farmerId: farmer1._id,
    fieldId: field1._id,
    fieldName: field1.fieldName,
    cropName: 'Wheat',
    cropVariety: 'DBW 187 (Karan Vandana)',
    cropStage: 'Jointing / Booting Stage',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
    symptomDescription: 'Good canopy vigor, minor lower leaf tip drying',
    detectedProblem: 'Minor Nutrient Chlorosis / Healthy Canopy',
    detectedProblemHi: 'हल्की पोषक तत्व कमी / स्वस्थ फसल',
    confidence: 92.0,
    severity: 'Low',
    healthStatus: 'Good',
    healthScore: 84,
    symptoms: ['Healthy dark green upper canopy', 'Slight pale tips on older leaves'],
    cause: 'Vigorous vegetative uptake requiring supplementary Zinc and Sulphur.',
    causeHi: 'तीव्र वानस्पतिक वृद्धि के कारण सूक्ष्म पोषक तत्वों की मांग।',
    diagnosis: 'Stripe rust completely suppressed. Plant canopy shows healthy photosynthetic vigor.',
    diagnosisHi: 'पीला रतुआ पूरी तरह नियंत्रित। फसल अच्छी वानस्पतिक स्थिति में।',
    recommendedTreatment: {
      organic: 'Apply bio-fertilizer and seaweed extract foliar spray.',
      chemical: 'Spray Zinc Sulphate (0.5%) + Urea (1%) solution.',
      general: 'Ensure timely irrigation during booting stage.',
      timeline: 'Apply foliar nutrients within 3 days.'
    },
    previousScanId: wheatScanOct._id,
    scanDate: new Date('2025-11-25T09:40:00Z'),
    createdAt: new Date('2025-11-25T09:40:00Z'),
  });

  // Scan 4: December (Wheat, Excellent / Completely Healthy)
  const wheatScanDec = await CropScan.create({
    farmerId: farmer1._id,
    fieldId: field1._id,
    fieldName: field1.fieldName,
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
      organic: 'Continue regular field scouting and beneficial insect monitoring.',
      chemical: 'No chemical pesticide application required.',
      general: 'Maintain moist soil condition during grain filling stage.',
      timeline: 'Re-inspect after 10-14 days.'
    },
    fertilizerRecommendation: 'Apply 0:0:50 (Potassium Sulphate) foliar spray for grain weight improvement.',
    irrigationRecommendation: 'Irrigate at grain milk stage; avoid water stress.',
    previousScanId: wheatScanNov._id,
    scanDate: new Date('2025-12-15T14:20:00Z'),
    createdAt: new Date('2025-12-15T14:20:00Z'),
  });

  // Tomato Scan: Field 2
  await CropScan.create({
    farmerId: farmer1._id,
    fieldId: field2._id,
    fieldName: field2.fieldName,
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
    scanDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  });

  // Seeded Long-Term Comparison (September vs December for Wheat)
  await CropComparison.create({
    farmerId: farmer1._id,
    cropName: 'Wheat',
    fieldId: field1._id,
    fieldName: field1.fieldName,
    oldScanId: wheatScanSep._id,
    newScanId: wheatScanDec._id,
    comparisonResult: {
      status: 'Resolved',
      statusHi: 'रोग पूरी तरह ठीक हुआ',
      progressScoreChange: 54,
      daysBetweenScans: 91,
      healthChange: 'Needs Attention (42%) → Healthy (96%)',
      diseaseChange: 'Yellow Rust / Stripe Rust (High) → Healthy Canopy (None)',
      symptomsChange: 'Yellow powdery pustules on lower leaves → Clean vigorous flag leaves and spikes',
      conditionThenVsNow: {
        then: 'Vegetative Stage | High Severity | Health Score: 42%',
        now: 'Flowering Stage | Clean Canopy | Health Score: 96%'
      },
      diseaseThenVsNow: {
        then: 'Yellow Rust / Stripe Rust (Puccinia striiformis)',
        now: 'Healthy Canopy (No Pathological Disease Detected)'
      },
      healthStatusThenVsNow: {
        then: 'Needs Attention',
        now: 'Healthy'
      },
      symptomsThenVsNow: {
        then: ['Linear yellow powdery pustules', 'Chlorosis', 'Premature leaf drying'],
        now: ['Clean flag leaves', 'Uniform green coloration', 'Robust tillers and spikes']
      },
      diagnosisThenVsNow: {
        then: 'Active Stripe Rust sporulation along vascular leaf lines. Urgent fungicide treatment needed.',
        now: 'Fully recovered and disease-free. Flag leaf area index is optimal for grain filling.'
      },
      treatmentThenVsNow: {
        then: 'Spray Propiconazole 25% EC (Tilt) @ 1ml per litre water. Refrain from excess urea.',
        now: 'No chemical pesticide required. Apply Potassium Sulphate 0:0:50 for grain boldness.'
      },
      whatChanged: 'Your wheat crop has improved significantly over the last 3 months (91 days). Yellow rust lesions have been completely eradicated, and healthy new flag leaves have emerged to support robust grain filling.',
      whatChangedHi: 'पिछले 3 महीनों (91 दिनों) में आपके गेहूं की फसल में शानदार सुधार हुआ है। पीला रतुआ पूरी तरह खत्म हो गया है और नई बालियां व पत्तियां पूर्णतः स्वस्थ हैं।',
      possibleReason: 'Timely application of Propiconazole 25% EC combined with restricted nitrogen and regulated drip watering successfully broke the fungal life cycle.',
      possibleReasonHi: 'समय पर प्रोपिकोनाजोल के छिड़काव और यूरिया के संतुलित प्रयोग से फफूंद का जीवन चक्र समाप्त हो गया।',
      actionAdvice: 'Maintain light soil moisture during the critical grain filling stage. Apply Potassium Sulphate (0:0:50) foliar spray to maximize grain weight and luster.',
      actionAdviceHi: 'दाना भराव के समय खेत में नमी बनाए रखें। दाने की चमक और वजन बढ़ाने के लिए 0:0:50 पोटैशियम सल्फेट का छिड़काव करें।',
      aiSummary: 'Excellent recovery from severe Yellow Rust. Health score improved from 42% to 96% (+54%).',
      aiSummaryHi: 'गंभीर पीले रतुए से शत-प्रतिशत सुधार। फसल स्वास्थ्य 42% से बढ़कर 96% (+54%) तक पहुंचा।'
    },
    comparisonDate: new Date()
  });

  // 5. Crop Analyses (Disease Scan Records for backward compatibility)
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
