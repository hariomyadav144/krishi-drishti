/**
 * Commodity Name Mapping for Indian Agricultural Markets
 * Maps common vernacular, Hindi, and English terms to standard official AGMARKNET commodity names.
 * Ensures strict deterministic matching without fuzzy false positives.
 */

const COMMODITY_MAPPINGS = [
  {
    official: 'Wheat',
    hindi: 'गेहूं',
    aliases: ['wheat', 'gehun', 'gehu', 'गेहूं', 'गेहू', 'कनक']
  },
  {
    official: 'Paddy(Dhan)(Common)',
    hindi: 'धान',
    aliases: ['paddy', 'dhan', 'dhaan', 'धान', 'chawal', 'rice', 'चावल', 'झोना']
  },
  {
    official: 'Tomato',
    hindi: 'टमाटर',
    aliases: ['tomato', 'tamatar', 'टमाटर', 'टोमॅटो', 'टमाटार']
  },
  {
    official: 'Onion',
    hindi: 'प्याज',
    aliases: ['onion', 'pyaz', 'pyaaz', 'प्याज', 'कांदा', 'गंडा']
  },
  {
    official: 'Potato',
    hindi: 'आलू',
    aliases: ['potato', 'aloo', 'alu', 'आलू', 'बटाटा']
  },
  {
    official: 'Cotton',
    hindi: 'कपास',
    aliases: ['cotton', 'kapas', 'kapaas', 'कपास', 'रूई', 'नरमा']
  },
  {
    official: 'Soyabean',
    hindi: 'सोयाबीन',
    aliases: ['soyabean', 'soybean', 'soya', 'सोयाबीन', 'सोया']
  },
  {
    official: 'Mustard',
    hindi: 'सरसों',
    aliases: ['mustard', 'sarson', 'sarso', 'सरसों', 'राई', 'तोरी']
  },
  {
    official: 'Maize',
    hindi: 'मक्का',
    aliases: ['maize', 'corn', 'makka', 'मक्का', 'भुट्टा', 'छल्ली']
  },
  {
    official: 'Bengal Gram(Gram)(Whole)',
    hindi: 'चना',
    aliases: ['chana', 'gram', 'chickpea', 'चना', 'छोले', 'हरभरा']
  },
  {
    official: 'Bajra(Pearl Millet/Cumbu)',
    hindi: 'बाजरा',
    aliases: ['bajra', 'pearl millet', 'बाजरा', 'बाजरी']
  },
  {
    official: 'Sugarcane',
    hindi: 'गन्ना',
    aliases: ['sugarcane', 'ganna', 'गन्ना', 'ऊस']
  },
  {
    official: 'Chilli Red',
    hindi: 'लाल मिर्च',
    aliases: ['red chilli', 'chilli', 'chilli red', 'mirch', 'मिर्च', 'लाल मिर्च']
  },
  {
    official: 'Green Chilli',
    hindi: 'हरी मिर्च',
    aliases: ['green chilli', 'hari mirch', 'हरी मिर्च']
  },
  {
    official: 'Garlic',
    hindi: 'लहसुन',
    aliases: ['garlic', 'lahsun', 'lehsun', 'लहसुन', 'लसूण']
  },
  {
    official: 'Ginger(Green)',
    hindi: 'अदरक',
    aliases: ['ginger', 'adrak', 'अदरक', 'आले']
  },
  {
    official: 'Turmeric',
    hindi: 'हल्दी',
    aliases: ['turmeric', 'haldi', 'हल्दी']
  },
  {
    official: 'Groundnut',
    hindi: 'मूंगफली',
    aliases: ['groundnut', 'peanut', 'moongfali', 'mungfali', 'मूंगफली', 'भुईमूग']
  },
  {
    official: 'Pegeon Pea(Arhar Fali)',
    hindi: 'अरहर / तूर',
    aliases: ['arhar', 'tur', 'toor', 'pigeon pea', 'अरहर', 'तूर']
  },
  {
    official: 'Green Gram (Moong)(Whole)',
    hindi: 'मूंग',
    aliases: ['moong', 'mung', 'green gram', 'मूंग']
  },
  {
    official: 'Black Gram (Urd Beans)(Whole)',
    hindi: 'उड़द',
    aliases: ['urad', 'black gram', 'उड़द', 'उडद']
  }
];

/**
 * Resolves any user text input (English, Hindi, transliterated) to official AGMARKNET commodity name
 */
function resolveOfficialCommodity(input) {
  if (!input || typeof input !== 'string') return null;
  const clean = input.trim().toLowerCase();
  if (clean === 'all') return null;

  for (const item of COMMODITY_MAPPINGS) {
    if (item.official.toLowerCase() === clean) return item.official;
    if (item.hindi === input.trim()) return item.official;
    if (item.aliases.includes(clean)) return item.official;
  }
  // Return cleaned original if no exact alias found
  return input.trim();
}

/**
 * Get Hindi display name for official commodity
 */
function getCommodityHindiName(officialName) {
  if (!officialName) return '';
  const match = COMMODITY_MAPPINGS.find(
    (c) => c.official.toLowerCase() === officialName.toLowerCase()
  );
  return match ? match.hindi : officialName;
}

module.exports = {
  COMMODITY_MAPPINGS,
  resolveOfficialCommodity,
  getCommodityHindiName
};
