/**
 * Universal Crop & Problem Detection Engine
 * 
 * Accurately extracts:
 * - Crop (English + Hindi/Hinglish aliases)
 * - Problem Category & Specific Symptoms
 * - Severity & Urgency
 * 
 * Works dynamically across any crop:
 * Wheat, Paddy/Rice, Tomato, Potato, Maize, Sugarcane, Mustard, Cotton, Pulses,
 * Onion, Garlic, Chilli, Soybean, Groundnut, Gram/Chana, Vegetables, Fruits, etc.
 * 
 * And any problem:
 * Waterlogging/Excess water, Drought/Low moisture, Yellow leaves/Chlorosis,
 * Leaf spots/Blight, Pests/Insects/Caterpillars, Wilting, Stunted growth,
 * Flower dropping, Fruit damage, Weed competition, Frost/Cold, Heat stress,
 * Chemical/Herbicide burn, Nutrient deficiencies, etc.
 */

// Comprehensive Multilingual Crop Dictionary
const CROP_MAP = [
  // Cereals
  { id: 'paddy', canonical: 'Paddy / Rice', nameHi: 'धान (चावल)', aliases: ['paddy', 'rice', 'dhan', 'dhaan', 'धान', 'चावल'] },
  { id: 'wheat', canonical: 'Wheat', nameHi: 'गेहूं', aliases: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेंहू', 'कनक'] },
  { id: 'maize', canonical: 'Maize / Corn', nameHi: 'मक्का (भुट्टा)', aliases: ['maize', 'corn', 'makka', 'makai', 'मक्का', 'मकई', 'भुट्टा'] },
  { id: 'barley', canonical: 'Barley', nameHi: 'जौ', aliases: ['barley', 'jau', 'जौ'] },
  { id: 'bajra', canonical: 'Pearl Millet (Bajra)', nameHi: 'बाजरा', aliases: ['bajra', 'pearl millet', 'millet', 'बाजरा'] },
  { id: 'jowar', canonical: 'Sorghum (Jowar)', nameHi: 'ज्वार', aliases: ['jowar', 'sorghum', 'ज्वार'] },

  // Vegetables
  { id: 'tomato', canonical: 'Tomato', nameHi: 'टमाटर', aliases: ['tomato', 'tamatar', 'टमाटर'] },
  { id: 'potato', canonical: 'Potato', nameHi: 'आलू', aliases: ['potato', 'aloo', 'alu', 'आलू'] },
  { id: 'onion', canonical: 'Onion', nameHi: 'प्याज', aliases: ['onion', 'pyaz', 'pyaaj', 'kanda', 'कांदा', 'प्याज'] },
  { id: 'garlic', canonical: 'Garlic', nameHi: 'लहसुन', aliases: ['garlic', 'lahsun', 'lasun', 'लहसुन'] },
  { id: 'chilli', canonical: 'Chilli', nameHi: 'मिर्च', aliases: ['chilli', 'chili', 'mirch', 'mirchi', 'मिर्च'] },
  { id: 'brinjal', canonical: 'Brinjal / Eggplant', nameHi: 'बैंगन', aliases: ['brinjal', 'eggplant', 'baingan', 'baigan', 'बैंगन'] },
  { id: 'cauliflower', canonical: 'Cauliflower', nameHi: 'फूलगोभी', aliases: ['cauliflower', 'gobhi', 'phool gobhi', 'फूलगोभी'] },
  { id: 'cabbage', canonical: 'Cabbage', nameHi: 'पत्तागोभी', aliases: ['cabbage', 'patta gobhi', 'पत्तागोभी', 'बंदगोभी'] },
  { id: 'okra', canonical: 'Okra / Ladyfinger', nameHi: 'भिंडी', aliases: ['okra', 'ladyfinger', 'bhindi', 'भिंडी'] },
  { id: 'pea', canonical: 'Pea', nameHi: 'मटर', aliases: ['pea', 'peas', 'matar', 'मटर'] },
  { id: 'cucumber', canonical: 'Cucumber', nameHi: 'खीरा', aliases: ['cucumber', 'kheera', 'khira', 'kakdi', 'खीरा', 'ककड़ी'] },
  { id: 'bittergourd', canonical: 'Bitter Gourd', nameHi: 'करेला', aliases: ['bitter gourd', 'karela', 'करेला'] },
  { id: 'bottlegourd', canonical: 'Bottle Gourd', nameHi: 'लौकी', aliases: ['bottle gourd', 'lauki', 'ghiya', 'लौकी', 'घिया'] },

  // Commercial / Cash Crops
  { id: 'sugarcane', canonical: 'Sugarcane', nameHi: 'गन्ना', aliases: ['sugarcane', 'ganna', 'ikh', 'गन्ना', 'ईख'] },
  { id: 'cotton', canonical: 'Cotton', nameHi: 'कपास', aliases: ['cotton', 'kapas', 'rui', 'कपास'] },
  { id: 'jute', canonical: 'Jute', nameHi: 'जूट / पटसन', aliases: ['jute', 'patson', 'पटसन', 'जूट'] },
  { id: 'tobacco', canonical: 'Tobacco', nameHi: 'तंबाकू', aliases: ['tobacco', 'tambaku', 'तंबाकू'] },

  // Oilseeds & Pulses
  { id: 'mustard', canonical: 'Mustard', nameHi: 'सरसों', aliases: ['mustard', 'sarson', 'sarso', 'raai', 'सरसों', 'राई', 'तोरिया'] },
  { id: 'soybean', canonical: 'Soybean', nameHi: 'सोयाबीन', aliases: ['soybean', 'soya', 'सोयाबीन'] },
  { id: 'groundnut', canonical: 'Groundnut / Peanut', nameHi: 'मूंगफली', aliases: ['groundnut', 'peanut', 'moongfali', 'mungfali', 'मूंगफली'] },
  { id: 'chana', canonical: 'Chickpea / Gram', nameHi: 'चना', aliases: ['chickpea', 'gram', 'chana', 'chane', 'चना'] },
  { id: 'moong', canonical: 'Green Gram (Moong)', nameHi: 'मूंग', aliases: ['green gram', 'moong', 'mung', 'मूंग'] },
  { id: 'urad', canonical: 'Black Gram (Urad)', nameHi: 'उड़द', aliases: ['black gram', 'urad', 'mash', 'उड़द'] },
  { id: 'arhar', canonical: 'Pigeon Pea (Arhar / Tur)', nameHi: 'अरहर (तूर)', aliases: ['pigeon pea', 'arhar', 'toor', 'tur', 'अरहर', 'तूर'] },

  // Fruits & Spices
  { id: 'mango', canonical: 'Mango', nameHi: 'आम', aliases: ['mango', 'aam', 'आम'] },
  { id: 'banana', canonical: 'Banana', nameHi: 'केला', aliases: ['banana', 'kela', 'केला'] },
  { id: 'citrus', canonical: 'Citrus / Lemon', nameHi: 'नींबू / संतरा', aliases: ['citrus', 'lemon', 'nimbu', 'orange', 'santra', 'नींबू', 'संतरा', 'मौसमी'] },
  { id: 'guava', canonical: 'Guava', nameHi: 'अमरूद', aliases: ['guava', 'amrood', 'amrud', 'अमरूद'] },
  { id: 'pomegranate', canonical: 'Pomegranate', nameHi: 'अनार', aliases: ['pomegranate', 'anar', 'anaar', 'अनार'] },
  { id: 'ginger', canonical: 'Ginger', nameHi: 'अदरक', aliases: ['ginger', 'adrak', 'अदरक'] },
  { id: 'turmeric', canonical: 'Turmeric', nameHi: 'हल्दी', aliases: ['turmeric', 'haldi', 'हल्दी'] }
];

// Universal Problem Patterns
const PROBLEM_PATTERNS = [
  // 1. Waterlogging / Excess Water
  {
    category: 'WATERLOGGING',
    keywords: [
      'pani bhar gaya', 'paani bhar gaya', 'waterlogging', 'excess water', 
      'jalbharav', 'water logging', 'flood', 'flooding', 'standing water', 
      'जलभराव', 'पानी भर गया', 'डूब गया', 'अत्यधिक पानी', 'जल भराव'
    ],
    titleEn: 'Excess Water & Waterlogging Stress',
    titleHi: 'खेत में अतिरिक्त जलभराव (Waterlogging)',
    severity: 'URGENT',
    urgencyPriority: 1,
    immediateStepsEn: [
      'Dig emergency peripheral surface trenches to drain standing water immediately.',
      'Aerate field root zone; avoid walking or heavy machinery on saturated soil.',
      'Do not apply urea or fertilizers while soil is waterlogged.'
    ],
    immediateStepsHi: [
      'खेत से तुरंत निकास नाली बनाकर खड़े पानी को बाहर निकालें।',
      'जलभराव की स्थिति में यूरिया या रासायनिक खाद बिल्कुल न डालें।',
      'पानी निकलने के बाद जड़ों को हवा लगने दें।'
    ],
    whyEn: 'Roots suffocate and cannot absorb oxygen or nutrients when submerged, causing sudden wilting and root rot.',
    whyHi: 'खेत में पानी भरने से जड़ों को ऑक्सीजन नहीं मिलती, जिससे पौधे पीले पड़कर सड़ने लगते हैं।',
    whenEn: 'Immediately (within 12–24 hours).',
    whenHi: 'तुरंत (अगले 12 से 24 घंटे के भीतर)।',
    monitorEn: 'Check for root darkening or soft rot 2 days after drainage.',
    monitorHi: 'पानी निकलने के 2 दिन बाद तने और जड़ों की सड़न की जांच करें।'
  },

  // 2. Yellowing Leaves / Chlorosis
  {
    category: 'YELLOW_LEAVES',
    keywords: [
      'yellow', 'peeli', 'peela', 'peelapan', 'chlorosis', 'yellowing',
      'पीली', 'पीला', 'पीलापन', 'पत्तियां पीली'
    ],
    titleEn: 'Foliage Discoloration & Leaf Yellowing',
    titleHi: 'पत्तियों का पीलापन (Yellowing Leaves)',
    severity: 'HIGH',
    urgencyPriority: 2,
    immediateStepsEn: [
      'Inspect whether yellowing is on bottom older leaves (Nitrogen/water issue) or top young leaves (Iron/Sulphur).',
      'Verify root moisture; do not add urea if soil is soggy.',
      'Spray water-soluble 19:19:19 (5g/L) or Chelated Micronutrients once moisture is balanced.'
    ],
    immediateStepsHi: [
      'देखें कि पीलापन पुरानी निचली पत्तियों पर है (नत्रजन/नमी) या नई ऊपरी पत्तियों पर (आयरन/सल्फर)।',
      'यदि मिट्टी में नमी बहुत अधिक है तो पहले खेत को सूखने दें, यूरिया न डालें।',
      'उचित नमी होने पर घुलनशील 19:19:19 (5 ग्राम/लीटर) या सूक्ष्म पोषक तत्वों का हल्का छिड़काव करें।'
    ],
    whyEn: 'Yellowing indicates loss of chlorophyll, often triggered by root zone saturation, nutrient deficiency, or alkaline pH lockup.',
    whyHi: 'पत्तियों में क्लोरोफिल कम होने से पीलापन आता है, जो पोषक तत्वों की कमी या अधिक नमी के कारण हो सकता है।',
    whenEn: 'Within 24–48 hours.',
    whenHi: 'अगले 24 से 48 घंटे में।',
    monitorEn: 'Inspect leaf color improvement 3–4 days after spray.',
    monitorHi: 'छिड़काव के 3-4 दिन बाद पत्तियों के हरेपन की जांच करें।'
  },

  // 3. Pest / Insect Attack
  {
    category: 'PEST_ATTACK',
    keywords: [
      'keeda', 'kida', 'keede', 'pest', 'insect', 'caterpillar', 'aphid', 
      'borer', 'sundi', 'illli', 'illi', 'whitefly', 'thrips', 'mite',
      'कीड़ा', 'कीड़े', 'सुंडी', 'इल्ली', 'माहू', 'सफेद मक्खी', 'चेपा', 'कीट'
    ],
    titleEn: 'Pest Infestation & Insect Damage',
    titleHi: 'कीट का प्रकोप (Pest Infestation)',
    severity: 'URGENT',
    urgencyPriority: 1,
    immediateStepsEn: [
      'Examine leaf undersides and stem joints to identify the pest type.',
      'Install yellow/blue sticky traps or pheromone traps (5–8 per acre).',
      'Apply recommended biological (Neem oil 10,000 PPM @ 5ml/L) or targeted pesticide.'
    ],
    immediateStepsHi: [
      'पत्तियों के नीचे और तने के जोड़ों में देखकर कीट की पहचान करें।',
      'खेत में 5-8 पीले चिपचिपे या फेरोमोन ट्रैप लगाएं।',
      'नीम तेल (5 मिली/लीटर) या फसल-विशिष्ट अनुशंसित कीटनाशक का छिड़काव सुबह या शाम करें।'
    ],
    whyEn: 'Sucking pests and borers weaken plant vascular tissues and transmit viral pathogens.',
    whyHi: 'रस चूसक कीट और सुंडियां पौधों का रस चूसकर वायरस व बीमारियों को तेजी से फैलाती हैं।',
    whenEn: 'Do now / within 24 hours.',
    whenHi: 'आज ही या अगले 24 घंटे में।',
    monitorEn: 'Recheck pest population after 3 days to determine if repeat spray is required.',
    monitorHi: '3 दिन बाद दोबारा गिनें कि कीटों की संख्या घटी या नहीं।'
  },

  // 4. Disease / Leaf Spots / Blight / Fungus
  {
    category: 'DISEASE_SPOTS',
    keywords: [
      'spot', 'spots', 'daag', 'dhaba', 'dhabbe', 'blight', 'fungus', 'rust',
      'powdery', 'mildew', 'jhulsa', 'rot', 'sadan', 'धब्बे', 'दाग', 'झुलसा', 
      'फफूंद', 'रतुआ', 'सड़न', 'बीमारी', 'रोग', 'धब्बा'
    ],
    titleEn: 'Possible Fungal / Bacterial Foliar Infection',
    titleHi: 'संभावित फफूंद या पत्ती धब्बा रोग (Leaf Spots / Blight)',
    severity: 'HIGH',
    urgencyPriority: 2,
    immediateStepsEn: [
      'Pluck and safely destroy severely spotted or diseased leaves away from the field.',
      'Avoid overhead irrigation to keep canopy dry.',
      'Spray broad-spectrum protective fungicide (Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride 3g/L).'
    ],
    immediateStepsHi: [
      'रोगग्रस्त और दाग वाली पत्तियों को तोड़कर खेत से दूर नष्ट करें।',
      'फसल पर ऊपर से पानी न छिड़कें ताकि पत्तियां सूखी रहें।',
      'सुरक्षात्मक फफूंदनाशक (मैंकोजेब 2.5 ग्राम/लीटर या कॉपर ऑक्सीक्लोराइड 3 ग्राम/लीटर) का छिड़काव करें।'
    ],
    whyEn: 'High humidity and warm canopy temperatures encourage fungal spores to germinate and spread across leaves.',
    whyHi: 'हवा में अधिक नमी और अनुकूल तापमान में फफूंद के जीवाणु पत्तियों पर तेजी से फैलते हैं।',
    whenEn: 'Within 24–36 hours on a dry, clear day.',
    whenHi: 'अगले 24 से 36 घंटे में (धूप वाले दिन)।',
    monitorEn: 'Look for new spot emergence on top fresh leaves.',
    monitorHi: 'देखें कि नई निकल रही पत्तियों पर धब्बे तो नहीं आ रहे।'
  },

  // 5. Low Moisture / Drought / Dry Field
  {
    category: 'DROUGHT_MOISTURE',
    keywords: [
      'sookh', 'sukha', 'drought', 'dry', 'kam pani', 'pani ki kami', 'nami kam',
      'moisture low', 'sukha pad', 'सूख', 'सूखा', 'पानी की कमी', 'नमी कम'
    ],
    titleEn: 'Low Soil Moisture & Moisture Deficit',
    titleHi: 'मिट्टी में नमी की कमी (Low Soil Moisture)',
    severity: 'URGENT',
    urgencyPriority: 1,
    immediateStepsEn: [
      'Provide light to moderate irrigation in the early morning or late evening.',
      'If water is scarce, use alternate furrow irrigation or drip.',
      'Apply organic mulch (straw/crop residue) around root zones to conserve moisture.'
    ],
    immediateStepsHi: [
      'सुबह या शाम के शांत समय में खेत में हल्की से मध्यम सिंचाई करें।',
      'यदि पानी कम हो तो एक कतार छोड़कर सिंचाई (Alternate Furrow) या ड्रिप का प्रयोग करें।',
      'जड़ों के आसपास सूखी घास या पुआल की मल्चिंग करें जिससे नमी उड़े नहीं।'
    ],
    whyEn: 'Soil moisture deficit prevents nutrient uptake, leading to wilting and stunting.',
    whyHi: 'मिट्टी में पानी की कमी से पौधे जड़ों से खुराक नहीं ले पाते और मुरझाने लगते हैं।',
    whenEn: 'Within 24 hours.',
    whenHi: 'अगले 24 घंटे के भीतर।'
  },

  // 6. Stunted Growth / Poor Growth
  {
    category: 'POOR_GROWTH',
    keywords: [
      'growth nahi', 'growth ruk gayi', 'bada nahi', 'chhota reh gaya', 'stunted',
      'growth slow', 'poor growth', 'baad nahi', 'बढ़वार नहीं', 'बढ़ नहीं', 'रुक गई', 'धीमी बढ़वार'
    ],
    titleEn: 'Stunted Growth & Poor Crop Development',
    titleHi: 'फसल की धीमी बढ़वार (Stunted Growth)',
    severity: 'MEDIUM',
    urgencyPriority: 3,
    immediateStepsEn: [
      'Check root health for compaction, hardpan, or root nematode swelling.',
      'Perform light intercultural weeding/hoeing to aerate the root zone.',
      'Apply balanced vegetative feed (NPK 19:19:19 @ 5g/L + Humic Acid 2ml/L).'
    ],
    immediateStepsHi: [
      'जड़ों को थोड़ा खोदकर देखें कि कहीं मिट्टी बहुत सख्त तो नहीं है या जड़ों में गांठें तो नहीं हैं।',
      'खेत में हल्की निराई-गुड़ाई करें ताकि जड़ों को हवा मिले।',
      'संतुलित वानस्पतिक खुराक हेतु 19:19:19 (5 ग्राम/लीटर) के साथ ह्यूमिक एसिड का हल्का छिड़काव करें।'
    ],
    whyEn: 'Poor growth can stem from root compaction, low active root zone nutrients, or pest stress.',
    whyHi: 'जड़ों में हवा की कमी, सख्त मिट्टी या पोषक तत्वों के असंतुलन से बढ़वार रुक जाती है।',
    whenEn: 'Within 2–3 days.',
    whenHi: 'अगले 2 से 3 दिनों में।'
  },

  // 7. Flower / Fruit Dropping
  {
    category: 'FLOWER_FRUIT_DROP',
    keywords: [
      'flower drop', 'phool gir', 'phool jhad', 'fruit drop', 'fall', 'dropping',
      'फूल गिर', 'फूल झड़', 'फल गिर', 'झड़ रहे'
    ],
    titleEn: 'Flower & Fruit Dropping Stress',
    titleHi: 'फूल व फल झड़ने की समस्या (Flower / Fruit Dropping)',
    severity: 'HIGH',
    urgencyPriority: 2,
    immediateStepsEn: [
      'Maintain uniform soil moisture; avoid drought followed by sudden heavy watering.',
      'Spray Alpha Naphthyl Acetic Acid (NAA 4.5% SL @ 1ml per 4.5L water) or Boron 20% (1g/L).',
      'Protect beneficial pollinators; do not spray harsh insecticides during peak flowering.'
    ],
    immediateStepsHi: [
      'मिट्टी में एक समान नमी रखें; सूखा पड़ने के बाद एकदम भारी पानी न लगाएं।',
      'फूल झड़ने से रोकने हेतु प्लानोफिक्स (NAA 4.5%) 1 मिली प्रति 4.5 लीटर पानी या बोरॉन 20% (1 ग्राम/लीटर) का छिड़काव करें।',
      'फूल आने के समय तेज रासायनिक कीटनाशकों का छिड़काव न करें ताकि मित्र कीट और मधुमक्खियां बची रहें।'
    ],
    whyEn: 'Sudden temperature shifts, moisture shock, or boron deficiency trigger abscission layer formation at pedicels.',
    whyHi: 'नमी के झटके, तेज गर्मी या बोरॉन की कमी से फूलों की डंडी कमजोर होकर टूटने लगती है।',
    whenEn: 'Within 24–48 hours.',
    whenHi: 'अगले 24 से 48 घंटे में।'
  },

  // 8. Fertilizer / Nutrient Query
  {
    category: 'FERTILIZER_QUERY',
    keywords: [
      'fertilizer', 'khad', 'urea', 'dap', 'npk', 'potash', 'zinc', 'sulphur',
      'खाद', 'यूरिया', 'डीएपी', 'पोटाश', 'जिंक', 'सल्फर', 'उर्वरक'
    ],
    titleEn: 'Targeted Nutrient & Fertilizer Management',
    titleHi: 'संतुलित खाद व उर्वरक प्रबंधन (Nutrient Management)',
    severity: 'MEDIUM',
    urgencyPriority: 3,
    immediateStepsEn: [
      'Follow split application rule; never dump full nitrogen at once.',
      'Ensure adequate soil moisture before top-dressing urea or granular fertilizers.',
      'Incorporate micronutrients (Zinc/Boron) based on soil test to balance macro NPK.'
    ],
    immediateStepsHi: [
      'खाद हमेशा किस्तों में दें; पूरा यूरिया एक साथ कभी न डालें।',
      'खेत में पर्याप्त नमी होने पर ही यूरिया का बुरकाव करें।',
      'मुख्य खाद (NPK) के साथ-साथ सूक्ष्म पोषक तत्व जैसे जिंक व सल्फर का भी संतुलित प्रयोग करें।'
    ],
    whyEn: 'Balanced nutrient split application improves uptake efficiency and prevents nutrient leaching or leaf scorch.',
    whyHi: 'संतुलित मात्रा में समय पर खाद देने से फसल मजबूत होती है और पैदावार बढ़ती है।',
    whenEn: 'According to crop stage and schedule.',
    whenHi: 'फसल अवस्था और तय समय के अनुसार।'
  }
];

/**
 * Universal Crop Extractor:
 * Extracts crop name from text query using alias dictionary.
 * Guaranteed to NEVER force "Wheat" or "Tomato" if farmer specified another crop!
 */
function extractCropFromQuery(queryText) {
  if (!queryText || typeof queryText !== 'string') return null;
  const q = queryText.toLowerCase();

  for (const crop of CROP_MAP) {
    for (const alias of crop.aliases) {
      // Regex word boundary or exact match
      const regex = new RegExp(`(^|[^a-zA-Z0-9\u0900-\u097F])${alias}([^a-zA-Z0-9\u0900-\u097F]|$)`, 'i');
      if (regex.test(q)) {
        return {
          id: crop.id,
          canonical: crop.canonical,
          nameHi: crop.nameHi
        };
      }
    }
  }

  return null;
}

/**
 * Universal Problem Extractor:
 * Identifies the exact problem the farmer is reporting from their query.
 */
function extractProblemFromQuery(queryText) {
  if (!queryText || typeof queryText !== 'string') return null;
  const q = queryText.toLowerCase();

  for (const pat of PROBLEM_PATTERNS) {
    for (const kw of pat.keywords) {
      if (q.includes(kw.toLowerCase())) {
        return pat;
      }
    }
  }

  return null;
}

/**
 * Build dynamic universal action response
 */
function buildUniversalActionAdvice({ crop, problem, language = 'hi', queryText = '' }) {
  const isEn = language === 'en';
  const cropDisplay = crop ? (isEn ? crop.canonical : crop.nameHi) : (isEn ? 'Your Crop' : 'आपकी फसल');

  if (problem) {
    const title = isEn ? problem.titleEn : problem.titleHi;
    const why = isEn ? problem.whyEn : problem.whyHi;
    const when = isEn ? problem.whenEn : problem.whenHi;
    const steps = isEn ? problem.immediateStepsEn : problem.immediateStepsHi;

    if (isEn) {
      return [
        `🌾 Crop: ${cropDisplay}`,
        `⚠️ Problem: ${title}`,
        `🔴 Priority: ${problem.severity} — Take action soon`,
        `💡 Why: ${why}`,
        `✅ What You Should Do Now:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        `⏰ When to act: ${when}`,
        `🔍 What to monitor next: Recheck crop status and moisture balance in 2–3 days.`
      ].join('\n\n');
    } else {
      return [
        `🌾 फसल: ${cropDisplay}`,
        `⚠️ समस्या: ${title}`,
        `🔴 प्राथमिकता: ${problem.severity === 'URGENT' ? 'तुरंत करें (URGENT)' : 'जरूरी कदम'}`,
        `💡 कारण: ${why}`,
        `✅ अभी क्या करें:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        `⏰ कब करें: ${when}`,
        `🔍 क्या निगरानी रखें: 2-3 दिन बाद फसल और मिट्टी की स्थिति दोबारा जांचें।`
      ].join('\n\n');
    }
  }

  // Fallback if problem is not specifically in catalogue
  if (isEn) {
    return [
      `🌾 Crop: ${cropDisplay}`,
      `⚠️ Problem: Farming Consultation for "${queryText || 'your crop'}"`,
      `🔴 Priority: Normal`,
      `💡 Guidance: Farm conditions require balanced management of soil moisture, nutrients, and regular scouting.`,
      `✅ What to do now:\n1. Inspect the field for specific discoloration or pest presence.\n2. Ensure root zone moisture is optimal (neither bone dry nor waterlogged).\n3. Recheck the crop after 2–3 days.`,
      `⏰ When to act: Within 24–48 hours.`
    ].join('\n\n');
  } else {
    return [
      `🌾 फसल: ${cropDisplay}`,
      `⚠️ विषय: "${queryText || 'फसल सलाह'}"`,
      `🔴 प्राथमिकता: सामान्य`,
      `💡 सलाह: खेत में नमी, पोषण और नियमित निरीक्षण द्वारा फसल की बेहतर बढ़वार सुनिश्चित करें।`,
      `✅ अभी क्या करें:\n1. पत्तियों और जड़ों का बारीकी से निरीक्षण करें।\n2. मिट्टी में नमी का संतुलन बनाए रखें (न अधिक सूखा, न जलभराव)।\n3. 2 से 3 दिन बाद फसल की स्थिति दोबारा जांचें।`,
      `⏰ कब करें: अगले 24 से 48 घंटे में।`
    ].join('\n\n');
  }
}

module.exports = {
  extractCropFromQuery,
  extractProblemFromQuery,
  buildUniversalActionAdvice,
  CROP_MAP,
  PROBLEM_PATTERNS
};
