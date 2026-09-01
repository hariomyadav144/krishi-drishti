/**
 * Mandi Market Prices Controller for Krishi Drishti
 * Provides live APMC mandi prices, price trajectories, and AI selling advisory.
 */

const mandiMarketDatabase = [
  {
    id: 'mandi-1',
    commodity: 'Tomato',
    commodityHi: 'टमाटर',
    commodityMr: 'टोमॅटो',
    commodityPa: 'ਟਮਾਟਰ',
    category: 'Vegetables',
    market: 'Nashik (Lasalgaon)',
    state: 'Maharashtra',
    district: 'Nashik',
    minPrice: 1400,
    maxPrice: 2200,
    modalPrice: 1850,
    unit: '₹ / Quintal',
    change: +120,
    changePercent: +6.9,
    trend: 'up',
    arrivalQuantity: '450 Tonnes',
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें (3 दिन बाद बेचें)',
      actionMr: 'थांबा (3 दिवसांनी विका)',
      actionPa: 'ਰੋਕੋ (3 ਦਿਨ ਬਾਅਦ ਵੇਚੋ)',
      rationale: 'Festive demand surge expected over the next 4 days in Mumbai/Surat terminal markets. Prices projected to climb to ₹2,100/Qtl.',
      rationaleHi: 'मुंबई और सूरत बाजारों में आगामी 4 दिनों में मांग बढ़ने की संभावना। भाव ₹2,100 तक पहुंचने का अनुमान।',
      confidence: 88
    },
    historicalTrend: [
      { day: 'Mon', price: 1650 },
      { day: 'Tue', price: 1680 },
      { day: 'Wed', price: 1720 },
      { day: 'Thu', price: 1750 },
      { day: 'Fri', price: 1800 },
      { day: 'Sat', price: 1850 }
    ]
  },
  {
    id: 'mandi-2',
    commodity: 'Onion',
    commodityHi: 'प्याज',
    commodityMr: 'कांदा',
    commodityPa: 'ਪਿਆਜ਼',
    category: 'Vegetables',
    market: 'Lasalgaon APMC',
    state: 'Maharashtra',
    district: 'Nashik',
    minPrice: 1800,
    maxPrice: 2650,
    modalPrice: 2350,
    unit: '₹ / Quintal',
    change: +80,
    changePercent: +3.5,
    trend: 'up',
    arrivalQuantity: '1,200 Tonnes',
    aiForecast: {
      action: 'SELL NOW',
      actionHi: 'अभी बेचें',
      actionMr: 'आता विका',
      actionPa: 'ਹੁਣੇ ਵੇਚੋ',
      rationale: 'Heavy incoming arrivals expected from Madhya Pradesh starting next week, which may stabilize or slightly soften modal prices.',
      rationaleHi: 'अगले सप्ताह मध्य प्रदेश से नई आवक बढ़ने से भाव स्थिर या थोड़े कम हो सकते हैं।',
      confidence: 91
    },
    historicalTrend: [
      { day: 'Mon', price: 2150 },
      { day: 'Tue', price: 2200 },
      { day: 'Wed', price: 2280 },
      { day: 'Thu', price: 2300 },
      { day: 'Fri', price: 2320 },
      { day: 'Sat', price: 2350 }
    ]
  },
  {
    id: 'mandi-3',
    commodity: 'Wheat',
    commodityHi: 'गेहूं',
    commodityMr: 'गहू',
    commodityPa: 'ਕਣਕ',
    category: 'Grains',
    market: 'Khanna Mandi',
    state: 'Punjab',
    district: 'Ludhiana',
    minPrice: 2275,
    maxPrice: 2550,
    modalPrice: 2420,
    unit: '₹ / Quintal',
    change: +25,
    changePercent: +1.0,
    trend: 'up',
    arrivalQuantity: '850 Tonnes',
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें',
      actionMr: 'थांबा',
      actionPa: 'ਰੋਕੋ',
      rationale: 'Government procurement MSP support and steady institutional mill buying providing upward price support.',
      rationaleHi: 'सरकारी खरीद समर्थन और फ्लोर मिलों की निरंतर मांग से भाव मजबूत रहने का अनुमान।',
      confidence: 86
    },
    historicalTrend: [
      { day: 'Mon', price: 2380 },
      { day: 'Tue', price: 2390 },
      { day: 'Wed', price: 2400 },
      { day: 'Thu', price: 2410 },
      { day: 'Fri', price: 2415 },
      { day: 'Sat', price: 2420 }
    ]
  },
  {
    id: 'mandi-4',
    commodity: 'Cotton',
    commodityHi: 'कपास',
    commodityMr: 'कापूस',
    commodityPa: 'ਕਪਾਹ',
    category: 'Cash Crops',
    market: 'Rajkot APMC',
    state: 'Gujarat',
    district: 'Rajkot',
    minPrice: 6800,
    maxPrice: 7650,
    modalPrice: 7350,
    unit: '₹ / Quintal',
    change: -50,
    changePercent: -0.7,
    trend: 'down',
    arrivalQuantity: '620 Tonnes',
    aiForecast: {
      action: 'PARTIAL SELL',
      actionHi: 'आधा स्टॉक बेचें',
      actionMr: 'अर्धा स्टॉक विका',
      actionPa: 'ਅੱਧਾ ਸਟਾਕ ਵੇਚੋ',
      rationale: 'International textile mill buying steady, but short-term domestic arrivals keeping prices in ₹7,200 - ₹7,500 band.',
      rationaleHi: 'अंतर्राष्ट्रीय मांग स्थिर है लेकिन घरेलू आवक बढ़ने से भाव ₹7,200-₹7,500 के दायरे में रहेगा।',
      confidence: 84
    },
    historicalTrend: [
      { day: 'Mon', price: 7450 },
      { day: 'Tue', price: 7420 },
      { day: 'Wed', price: 7400 },
      { day: 'Thu', price: 7380 },
      { day: 'Fri', price: 7360 },
      { day: 'Sat', price: 7350 }
    ]
  },
  {
    id: 'mandi-5',
    commodity: 'Rice / Paddy',
    commodityHi: 'धान / चावल',
    commodityMr: 'भात / तांदूळ',
    commodityPa: 'ਝੋਨਾ / ਚਾਵਲ',
    category: 'Grains',
    market: 'Karnal Mandi',
    state: 'Haryana',
    district: 'Karnal',
    minPrice: 2200,
    maxPrice: 3850,
    modalPrice: 3450,
    unit: '₹ / Quintal (Basmati)',
    change: +110,
    changePercent: +3.3,
    trend: 'up',
    arrivalQuantity: '940 Tonnes',
    aiForecast: {
      action: 'SELL NOW',
      actionHi: 'अभी बेचें',
      actionMr: 'आता विका',
      actionPa: 'ਹੁਣੇ ਵੇਚੋ',
      rationale: 'Strong export contracts to Gulf countries currently at peak pricing.',
      rationaleHi: 'खाड़ी देशों को बासमती निर्यात मांग अपने चरम पर है, अच्छा मुनाफा कमाने का सही समय।',
      confidence: 93
    },
    historicalTrend: [
      { day: 'Mon', price: 3250 },
      { day: 'Tue', price: 3300 },
      { day: 'Wed', price: 3340 },
      { day: 'Thu', price: 3390 },
      { day: 'Fri', price: 3420 },
      { day: 'Sat', price: 3450 }
    ]
  },
  {
    id: 'mandi-6',
    commodity: 'Potato',
    commodityHi: 'आलू',
    commodityMr: 'बटाटा',
    commodityPa: 'ਆਲੂ',
    category: 'Vegetables',
    market: 'Agra Mandi',
    state: 'Uttar Pradesh',
    district: 'Agra',
    minPrice: 1200,
    maxPrice: 1650,
    modalPrice: 1480,
    unit: '₹ / Quintal',
    change: +40,
    changePercent: +2.8,
    trend: 'up',
    arrivalQuantity: '1,500 Tonnes',
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें',
      actionMr: 'थांबा',
      actionPa: 'ਰੋਕੋ',
      rationale: 'Cold storage stock depletion in eastern states will push prices upward by ₹150-200/Qtl within 10 days.',
      rationaleHi: 'कोल्ड स्टोरेज स्टॉक घटने से अगले 10 दिनों में भाव में ₹150-200 की तेजी संभव।',
      confidence: 87
    },
    historicalTrend: [
      { day: 'Mon', price: 1380 },
      { day: 'Tue', price: 1400 },
      { day: 'Wed', price: 1420 },
      { day: 'Thu', price: 1450 },
      { day: 'Fri', price: 1460 },
      { day: 'Sat', price: 1480 }
    ]
  },
  {
    id: 'mandi-7',
    commodity: 'Soybean',
    commodityHi: 'सोयाबीन',
    commodityMr: 'सोयाबीन',
    commodityPa: 'ਸੋਇਆਬੀਨ',
    category: 'Oilseeds',
    market: 'Indore APMC',
    state: 'Madhya Pradesh',
    district: 'Indore',
    minPrice: 4200,
    maxPrice: 4850,
    modalPrice: 4620,
    unit: '₹ / Quintal',
    change: +60,
    changePercent: +1.3,
    trend: 'up',
    arrivalQuantity: '780 Tonnes',
    aiForecast: {
      action: 'HOLD',
      actionHi: 'रोकें',
      actionMr: 'थांबा',
      actionPa: 'ਰੋਕੋ',
      rationale: 'Domestic edible oil crushing demand and global soymeal export uptick.',
      rationaleHi: 'घरेलू तेल मिलों की मांग और वैश्विक सोयामील निर्यात में बढ़ोतरी।',
      confidence: 89
    },
    historicalTrend: [
      { day: 'Mon', price: 4500 },
      { day: 'Tue', price: 4530 },
      { day: 'Wed', price: 4560 },
      { day: 'Thu', price: 4590 },
      { day: 'Fri', price: 4600 },
      { day: 'Sat', price: 4620 }
    ]
  },
  {
    id: 'mandi-8',
    commodity: 'Chilli / Pepper',
    commodityHi: 'लाल मिर्च',
    commodityMr: 'मिरची',
    commodityPa: 'ਲਾਲ ਮਿਰਚ',
    category: 'Spices',
    market: 'Guntur APMC',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    minPrice: 15500,
    maxPrice: 21000,
    modalPrice: 18800,
    unit: '₹ / Quintal',
    change: +350,
    changePercent: +1.9,
    trend: 'up',
    arrivalQuantity: '310 Tonnes',
    aiForecast: {
      action: 'SELL NOW',
      actionHi: 'अभी बेचें',
      actionMr: 'आता विका',
      actionPa: 'ਹੁਣੇ ਵੇਚੋ',
      rationale: 'Export quality Teja and Byadgi varieties attracting highest premium this quarter.',
      rationaleHi: 'तेजा और ब्याडगी किस्मों की प्रीमियम मांग से रिकॉर्ड भाव मिल रहे हैं।',
      confidence: 94
    },
    historicalTrend: [
      { day: 'Mon', price: 18100 },
      { day: 'Tue', price: 18250 },
      { day: 'Wed', price: 18400 },
      { day: 'Thu', price: 18600 },
      { day: 'Fri', price: 18700 },
      { day: 'Sat', price: 18800 }
    ]
  }
];

exports.getAllMandiPrices = async (req, res) => {
  try {
    const { commodity, state, search } = req.query;
    let results = [...mandiMarketDatabase];

    if (commodity && commodity !== 'All') {
      results = results.filter(item => item.commodity.toLowerCase().includes(commodity.toLowerCase()));
    }
    if (state && state !== 'All') {
      results = results.filter(item => item.state.toLowerCase() === state.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(item =>
        item.commodity.toLowerCase().includes(q) ||
        item.commodityHi.includes(q) ||
        item.market.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      count: results.length,
      timestamp: new Date().toISOString(),
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMandiPriceById = async (req, res) => {
  try {
    const item = mandiMarketDatabase.find(m => m.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Mandi record not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
