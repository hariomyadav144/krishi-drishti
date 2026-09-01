/**
 * Smart Agricultural Tools Controller for Krishi Drishti
 * Includes:
 * 1. Fertilizer & NPK Dosage Calculator
 * 2. Satellite NDVI vegetative stress monitoring
 * 3. Government Schemes & Subsidies registry
 * 4. Pest & Disease Outbreak Radar
 */

// 1. Fertilizer Dosage Calculations
const cropNutrientNorms = {
  'Tomato': {
    targetYield: '25-30 Tonnes/Acre',
    nitrogenKg: 60,
    phosphorusKg: 40,
    potashKg: 40,
    stageBreakup: [
      { stage: 'Basal (Land Prep / Transplanting)', ureaKg: 25, dapKg: 85, mopKg: 35, zincKg: 5, notes: 'Mix well into soil before mulching.' },
      { stage: 'Vegetative (15-30 Days)', ureaKg: 30, npk19Kg: 4, micronutrientKg: 1, notes: 'Foliar spray + root fertigation.' },
      { stage: 'Flowering Stage (30-50 Days)', npk130045Kg: 5, boronKg: 0.5, calciumNitrateKg: 10, notes: 'Boosts flower retention and reduces blossom end rot.' },
      { stage: 'Fruiting & Maturity (50+ Days)', mopKg: 25, npk05234Kg: 5, potassiumSulphateKg: 4, notes: 'Enhances fruit size, red color, and shelf life.' }
    ],
    organicAlternatives: [
      { name: 'Well-rotted FYM / Compost', dosePerAcre: '4-5 Tonnes at basal' },
      { name: 'Vermicompost', dosePerAcre: '1,000 kg at planting' },
      { name: 'Neem Cake (De-oiled)', dosePerAcre: '150 kg for root nematode control' },
      { name: 'Jeevamrutha Solution', dosePerAcre: '200 Litres every 15 days via drip' }
    ]
  },
  'Wheat': {
    targetYield: '20-24 Quintals/Acre',
    nitrogenKg: 50,
    phosphorusKg: 25,
    potashKg: 15,
    stageBreakup: [
      { stage: 'Basal (Sowing Time)', ureaKg: 25, dapKg: 55, mopKg: 25, zincKg: 10, notes: 'Drill with seed or broadcast before final harrowing.' },
      { stage: 'CRI Stage (1st Irrigation, 21 Days)', ureaKg: 35, notes: 'Top dress Urea immediately before or after 1st irrigation.' },
      { stage: 'Jointing / Tillering (40-45 Days)', ureaKg: 25, notes: '2nd top dressing to maximize productive tillers.' },
      { stage: 'Booting / Flag Leaf (65-70 Days)', npk19Kg: 2, tebuconazoleG: 100, notes: 'Foliar spray for grain bolding and rust defense.' }
    ],
    organicAlternatives: [
      { name: 'Compost / FYM', dosePerAcre: '3 Tonnes' },
      { name: 'Azotobacter Seed Treatment', dosePerAcre: '250 ml/40kg seed' },
      { name: 'PSB (Phosphate Solubilizing Bacteria)', dosePerAcre: '250 ml seed inoculant' }
    ]
  },
  'Rice / Paddy': {
    targetYield: '25-30 Quintals/Acre',
    nitrogenKg: 48,
    phosphorusKg: 24,
    potashKg: 24,
    stageBreakup: [
      { stage: 'Basal (Puddling Time)', ureaKg: 20, dapKg: 50, mopKg: 20, zincSulphateKg: 10, notes: 'Incorporate into puddled mud before transplanting.' },
      { stage: 'Active Tillering (20-25 DAT)', ureaKg: 30, notes: 'Broadcast into shallow standing water.' },
      { stage: 'Panicle Initiation (45-50 DAT)', ureaKg: 20, mopKg: 15, notes: 'Final top dress for vigorous panicle elongation.' }
    ],
    organicAlternatives: [
      { name: 'Dhaincha (Green Manure)', dosePerAcre: 'Plough in 45-day green crop' },
      { name: 'Azospirillum & BGA', dosePerAcre: '2 kg/Acre in puddle soil' }
    ]
  },
  'Cotton': {
    targetYield: '12-16 Quintals/Acre',
    nitrogenKg: 40,
    phosphorusKg: 20,
    potashKg: 20,
    stageBreakup: [
      { stage: 'Basal (Sowing)', dapKg: 45, mopKg: 20, magnesiumSulphateKg: 10, notes: 'Side placement 5cm away from seed line.' },
      { stage: 'Square Formation (35-40 DAS)', ureaKg: 30, notes: 'Side dressing along rows.' },
      { stage: 'Peak Flowering (60-70 DAS)', ureaKg: 25, npk130045Kg: 3, notes: 'Prevents square dropping.' },
      { stage: 'Boll Development (90 DAS)', mopKg: 15, boronKg: 0.5, notes: 'Improves boll opening and staple quality.' }
    ],
    organicAlternatives: [
      { name: 'Castor Cake / Neem Cake', dosePerAcre: '200 kg at sowing' },
      { name: 'Cow Urine & Bio-fertilizer foliar', dosePerAcre: '10% solution at square stage' }
    ]
  },
  'Potato': {
    targetYield: '120-150 Quintals/Acre',
    nitrogenKg: 75,
    phosphorusKg: 50,
    potashKg: 60,
    stageBreakup: [
      { stage: 'Basal (Planting)', ureaKg: 40, dapKg: 110, mopKg: 60, zincKg: 5, notes: 'Apply in furrows 5cm below seed tubers.' },
      { stage: 'Earthing Up (30-35 DAP)', ureaKg: 45, notes: 'Top dress along ridges before earthing up.' },
      { stage: 'Tuber Bulking (50-60 DAP)', npk000050Kg: 5, calciumNitrateKg: 5, notes: 'Spray SOP (0:0:50) for solid tuber weight.' }
    ],
    organicAlternatives: [
      { name: 'Poultry Manure / FYM', dosePerAcre: '5 Tonnes' },
      { name: 'Trichoderma in FYM', dosePerAcre: '2.5 kg mixed in 100 kg compost' }
    ]
  }
};

exports.calculateFertilizer = async (req, res) => {
  try {
    const { cropName, landArea, landUnit, soilType, growthStage } = req.body;
    const area = parseFloat(landArea) || 1.0;
    
    // Normalize area to Acres
    let acreFactor = 1.0;
    const unit = (landUnit || 'Acres').toLowerCase();
    if (unit === 'hectares' || unit === 'hectare') acreFactor = 2.471;
    else if (unit === 'bigha') acreFactor = 0.4;
    else if (unit === 'guntha') acreFactor = 0.025;
    
    const acresCalculated = area * acreFactor;
    const cropKey = cropNutrientNorms[cropName] ? cropName : 'Tomato';
    const cropData = cropNutrientNorms[cropKey];

    // Scale requirements
    const totalUreaKg = Math.round((cropData.nitrogenKg * 2.17) * acresCalculated);
    const totalDapKg = Math.round((cropData.phosphorusKg * 2.17) * acresCalculated);
    const totalMopKg = Math.round((cropData.potashKg * 1.67) * acresCalculated);

    const ureaBags = (totalUreaKg / 45).toFixed(1); // 45kg bag
    const dapBags = (totalDapKg / 50).toFixed(1);   // 50kg bag
    const mopBags = (totalMopKg / 50).toFixed(1);   // 50kg bag

    // Approximate cost in INR
    const estimatedCost = Math.round((ureaBags * 266.5) + (dapBags * 1350) + (mopBags * 1700));

    res.json({
      success: true,
      data: {
        cropName: cropKey,
        enteredArea: area,
        enteredUnit: landUnit || 'Acres',
        normalizedAcres: Number(acresCalculated.toFixed(2)),
        soilAdjustment: soilType === 'Sandy Soil' ? 'Add +15% Potash due to high leaching' : 'Standard dosage',
        recommendation: {
          totalUreaKg,
          ureaBags: Number(ureaBags),
          totalDapKg,
          dapBags: Number(dapBags),
          totalMopKg,
          mopBags: Number(mopBags),
          estimatedCostINR: estimatedCost,
          stageBreakup: cropData.stageBreakup.map(st => ({
            stage: st.stage,
            notes: st.notes,
            scaledDoses: {
              ureaKg: st.ureaKg ? Math.round(st.ureaKg * acresCalculated) : 0,
              dapKg: st.dapKg ? Math.round(st.dapKg * acresCalculated) : 0,
              mopKg: st.mopKg ? Math.round(st.mopKg * acresCalculated) : 0,
              specialKg: st.calciumNitrateKg ? Math.round(st.calciumNitrateKg * acresCalculated) : (st.npk19Kg || st.npk130045Kg || st.npk05234Kg || st.npk000050Kg || 0)
            }
          })),
          organicAlternatives: cropData.organicAlternatives
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Satellite NDVI vegetative index
exports.getSatelliteNDVI = async (req, res) => {
  try {
    const satelliteData = {
      satellite: 'Sentinel-2 Multispectral L2A',
      lastPassDate: 'Yesterday, 10:42 AM IST',
      resolution: '10m x 10m Pixel Matrix',
      overallNDVIScore: 0.74, // 0 to 1 scale
      healthStatus: 'High Vegetative Vigour',
      healthStatusHi: 'उत्कृष्ट वानस्पतिक स्वास्थ्य (स्वस्थ फसल)',
      cloudCover: '4%',
      fieldSectors: [
        {
          sectorId: 'Plot-North (2.0 Ac)',
          crop: 'Tomato (Hybrid)',
          ndvi: 0.78,
          status: 'Optimal Health',
          statusColor: '#10B981',
          moistureIndex: '88% Adequate',
          stressWarning: 'None',
          recommendedAction: 'Maintain current fertigation schedule.'
        },
        {
          sectorId: 'Plot-South (1.5 Ac)',
          crop: 'Tomato (Flowering)',
          ndvi: 0.69,
          status: 'Mild Moisture Stress',
          statusColor: '#F59E0B',
          moistureIndex: '62% Low',
          stressWarning: 'Drying root zone in south-west boundary',
          recommendedAction: 'Schedule 2.5 hours drip cycle today before sunset.'
        },
        {
          sectorId: 'Plot-East (1.0 Ac)',
          crop: 'Onion (Rabi)',
          ndvi: 0.76,
          status: 'Vigorous Growth',
          statusColor: '#10B981',
          moistureIndex: '84% Optimal',
          stressWarning: 'None',
          recommendedAction: 'Weeding recommended in furrow alleys.'
        }
      ],
      historicalNDVI: [
        { date: 'Day 1', score: 0.52 },
        { date: 'Day 10', score: 0.58 },
        { date: 'Day 20', score: 0.65 },
        { date: 'Day 30', score: 0.71 },
        { date: 'Day 40', score: 0.74 }
      ]
    };

    res.json({ success: true, data: satelliteData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Government Agricultural Schemes Registry
const govtSchemesDatabase = [
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
    requiredDocs: ['7/12 Land Extract & 8A', 'Electricity Bill / Water Source Proof', 'Quotation from authorized Micro-irrigation vendor', 'Caste Certificate (for SC/ST extra subsidy)'],
    portalUrl: 'https://pmksy.gov.in',
    status: 'Accepting Online Applications'
  },
  {
    id: 'scheme-4',
    title: 'PM-KUSUM Solar Agriculture Pump Scheme',
    titleHi: 'पीएम-कुसुम सौर ऊर्जा पंप योजना',
    category: 'Renewable Power',
    categoryHi: 'सौर ऊर्जा कृषि पंप',
    benefit: '60% subsidy (30% Central + 30% State) for 3HP, 5HP & 7.5HP Solar Water Pumps with 30% bank loan.',
    benefitHi: '3HP, 5HP और 7.5HP सोलर पंप पर 60% तक सब्सिडी (किसान का अंशदान केवल 10%)।',
    eligibility: 'Farmers without grid electricity or farmers wishing to replace existing diesel pumps.',
    eligibilityHi: 'ग्रिड बिजली से वंचित किसान अथवा डीजल पंप को सोलर पंप में बदलने के इच्छुक किसान।',
    requiredDocs: ['Land Ownership papers', 'Identity Proof', 'Bank statement', 'Water source verification certificate'],
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
];

exports.getGovtSchemes = async (req, res) => {
  try {
    res.json({
      success: true,
      count: govtSchemesDatabase.length,
      data: govtSchemesDatabase
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Regional Pest & Disease Outbreak Radar
const regionalOutbreaks = [
  {
    id: 'outbreak-1',
    pestName: 'Fall Armyworm (FAW)',
    pestNameHi: 'फॉल आर्मीवर्म सुंडी',
    affectedCrops: ['Maize / Corn', 'Sugarcane', 'Sorghum'],
    distanceKm: '14 km away',
    location: 'Dindori Block, Nashik',
    riskLevel: 'HIGH ALERT',
    riskColor: 'red',
    reportedCases: 23,
    firstDetected: '3 days ago',
    preventiveGuideline: 'Install 5 FAW pheromone traps per acre immediately. If whorl damage >5%, spray Emamectin Benzoate 5% SG @ 0.5g/L directly into plant whorls.',
    preventiveGuidelineHi: 'प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं। यदि 5% से अधिक पौधों में नुकसान दिखे तो इमामेक्टिन बेंजोएट (0.5 ग्राम/लीटर) का पोंगे (Whorl) में छिड़काव करें।'
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
    preventiveGuideline: 'High morning humidity (>85%) favoring fungal sporulation. Apply preventive spray of Mancozeb 75% WP @ 2.5g/L or Azoxystrobin @ 1ml/L before rain event.',
    preventiveGuidelineHi: 'सुबह की उच्च आर्द्रता से फफूंद पनप रही है। बारिश से पूर्व मैंकोजेब (2.5 ग्राम/लीटर) का सुरक्षात्मक छिड़काव करें।'
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
    preventiveGuideline: 'Erect 20 yellow sticky traps per acre at canopy level. Spray 5% Neem Seed Kernel Extract (NSKE) or Neem Oil 10,000 ppm @ 4ml/L.',
    preventiveGuidelineHi: 'प्रति एकड़ 20 पीले स्टिकी ट्रैप लगाएं। 10,000 PPM नीम तेल का 4 मिली/लीटर की दर से छिड़काव करें।'
  }
];

exports.getOutbreakRadar = async (req, res) => {
  try {
    res.json({
      success: true,
      district: 'Nashik & Surrounding 25km Region',
      activeAlertsCount: regionalOutbreaks.length,
      data: regionalOutbreaks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
