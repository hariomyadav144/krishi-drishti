import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  Search, 
  MapPin, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  ExternalLink,
  Navigation,
  Info,
  SlidersHorizontal,
  ArrowUpDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

// Official primary commodities with bilingual support
const OFFICIAL_COMMODITIES = [
  { value: 'All', labelEn: 'All Commodities', labelHi: 'सभी फसलें' },
  { value: 'Wheat', labelEn: 'Wheat', labelHi: 'गेहूं' },
  { value: 'Paddy(Dhan)(Common)', labelEn: 'Paddy / Dhan (Rice)', labelHi: 'धान (चावल)' },
  { value: 'Tomato', labelEn: 'Tomato', labelHi: 'टमाटर' },
  { value: 'Onion', labelEn: 'Onion', labelHi: 'प्याज' },
  { value: 'Potato', labelEn: 'Potato', labelHi: 'आलू' },
  { value: 'Mustard', labelEn: 'Mustard', labelHi: 'सरसों' },
  { value: 'Maize', labelEn: 'Maize', labelHi: 'मक्का' },
  { value: 'Soyabean', labelEn: 'Soybean', labelHi: 'सोयाबीन' },
  { value: 'Cotton', labelEn: 'Cotton', labelHi: 'कपास' },
  { value: 'Bengal Gram(Gram)(Whole)', labelEn: 'Gram / Chana', labelHi: 'चना' },
  { value: 'Bajra(Pearl Millet/Cumbu)', labelEn: 'Bajra', labelHi: 'बाजरा' },
  { value: 'Chilli Red', labelEn: 'Red Chilli', labelHi: 'लाल मिर्च' },
  { value: 'Pegeon Pea(Arhar Fali)', labelEn: 'Arhar / Tur', labelHi: 'अरहर (तूर)' }
];

export default function MandiPrices() {
  const { lang, t } = useLanguage();

  // Filters
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState('Gorakhpur');
  const [selectedMarket, setSelectedMarket] = useState('All');
  const [selectedCommodity, setSelectedCommodity] = useState('Wheat');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Master Data lists
  const [statesList, setStatesList] = useState(['Uttar Pradesh', 'Maharashtra', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Gujarat', 'Rajasthan', 'Bihar']);
  const [districtsList, setDistrictsList] = useState(['Gorakhpur', 'Basti', 'Lucknow', 'Deoria', 'Sant Kabir Nagar', 'Kanpur', 'Varanasi', 'Agra']);
  const [marketsList, setMarketsList] = useState([]);

  // Data & UI States
  const [mandiRates, setMandiRates] = useState([]);
  const [nearbyMarkets, setNearbyMarkets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'modalPrice' | 'maxPrice' | 'update'
  const [sourceMeta, setSourceMeta] = useState({
    source: 'AGMARKNET / Data.gov.in',
    sourceAuthority: 'Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, GoI',
    dataDate: '10/09/2026',
    fetchedAt: new Date().toISOString(),
    isCached: false,
    message: ''
  });

  // Fetch official master list for dropdowns
  useEffect(() => {
    let isMounted = true;
    api.get('/mandi/master', { params: { state: selectedState, district: selectedDistrict } })
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success) {
          if (Array.isArray(res.data.states)) setStatesList(res.data.states);
          if (Array.isArray(res.data.districts)) setDistrictsList(res.data.districts);
          if (Array.isArray(res.data.markets)) setMarketsList(res.data.markets);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [selectedState, selectedDistrict]);

  // Main fetch function for official government data
  const fetchMandiRates = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        district: selectedDistrict,
        market: selectedMarket,
        commodity: selectedCommodity,
        date: selectedDate || undefined,
        search: searchQuery || undefined
      };

      const res = await api.get('/mandi/prices', { params });
      if (res.data?.success) {
        const records = Array.isArray(res.data.data) ? res.data.data : [];
        setMandiRates(records);
        setSourceMeta({
          source: res.data.source || 'AGMARKNET / Data.gov.in',
          sourceAuthority: res.data.sourceAuthority || 'Ministry of Agriculture & Farmers Welfare, Government of India',
          dataDate: res.data.dataDate || res.data.date || 'Today',
          fetchedAt: res.data.fetchedAt || new Date().toISOString(),
          isCached: Boolean(res.data.isCached),
          message: res.data.message || ''
        });

        if (records.length > 0) {
          setSelectedItem(records[0]);
        } else {
          setSelectedItem(null);
        }
      }
    } catch (err) {
      console.warn('Error querying official mandi data:', err.message);
      setMandiRates([]);
      setSelectedItem(null);
      setSourceMeta(prev => ({
        ...prev,
        message: 'Official mandi data is temporarily unavailable from the government server.'
      }));
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedMarket, selectedCommodity, selectedDate, searchQuery]);

  // Fetch when filters change
  useEffect(() => {
    fetchMandiRates();
  }, [fetchMandiRates]);

  // "Use My Location" (GPS) handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingUser(true);
    setLocationStatus(lang === 'hi' ? 'GPS लोकेशन खोजी जा रही है...' : 'Locating your GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await api.get('/mandi/nearby', {
            params: {
              latitude,
              longitude,
              radius: 80,
              commodity: selectedCommodity !== 'All' ? selectedCommodity : undefined
            }
          });

          if (res.data?.success) {
            const loc = res.data.userLocation;
            if (loc?.nearestState) setSelectedState(loc.nearestState);
            if (loc?.nearestDistrict) setSelectedDistrict(loc.nearestDistrict);
            if (Array.isArray(res.data.nearbyMarkets)) {
              setNearbyMarkets(res.data.nearbyMarkets);
            }
            if (Array.isArray(res.data.data) && res.data.data.length > 0) {
              setMandiRates(res.data.data);
              setSelectedItem(res.data.data[0]);
            }
            setLocationStatus(
              lang === 'hi'
                ? `निकटतम मंडी: ${loc?.nearestMandi || loc?.nearestDistrict} (${loc?.distanceKm || 0} किमी)`
                : `Nearest Mandi: ${loc?.nearestMandi || loc?.nearestDistrict} (${loc?.distanceKm || 0} km)`
            );
          }
        } catch (e) {
          setLocationStatus('Could not resolve nearby mandis from GPS.');
        } finally {
          setLocatingUser(false);
        }
      },
      (err) => {
        setLocatingUser(false);
        setLocationStatus('GPS permission denied or unavailable. Please select your district manually.');
      },
      { timeout: 8000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMandiRates();
  };

  // Sort comparison records
  const sortedRecords = [...mandiRates].sort((a, b) => {
    if (sortBy === 'modalPrice') return b.modalPrice - a.modalPrice;
    if (sortBy === 'maxPrice') return b.maxPrice - a.maxPrice;
    if (sortBy === 'distance') {
      const distA = a.distanceKm != null ? a.distanceKm : 999;
      const distB = b.distanceKm != null ? b.distanceKm : 999;
      return distA - distB;
    }
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-12">
      
      {/* 1. Header with Government Source Attribution & Trust Badges */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#0f3d24] to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-emerald-700/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official Government of India Data</span>
              </span>
              <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">
                AGMARKNET • DMI
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🌾</span>
              <span>{lang === 'hi' ? 'आधिकारिक मंडी भाव' : 'Official Mandi Rates'}</span>
            </h1>

            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              {lang === 'hi'
                ? 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार (AGMARKNET / DMI) द्वारा जारी प्रामाणिक दैनिक मंडी भाव।'
                : 'Current daily market prices reported directly from official APMC mandis via AGMARKNET, Ministry of Agriculture & Farmers Welfare, GoI.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUseMyLocation}
              disabled={locatingUser}
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${locatingUser ? 'animate-spin' : ''}`} />
              <span>{lang === 'hi' ? 'मेरा स्थान खोजें' : 'Use My Location'}</span>
            </button>

            <button
              onClick={fetchMandiRates}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition active:rotate-180"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {locationStatus && (
          <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-emerald-200/90 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{locationStatus}</span>
          </div>
        )}
      </div>

      {/* 2. Hierarchical Location & Commodity Selector (State -> District -> Mandi -> Commodity) */}
      <div className="agri-card p-4 sm:p-5 bg-white border-slate-200 shadow-sm space-y-4">
        
        {/* Search Bar supporting Hindi + English */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'hi'
                  ? 'खोजें: "गेहूं गोरखपुर", "धान बस्ती", "Tomato", "आलू"...'
                  : 'Search by crop or mandi: "Wheat Gorakhpur", "Paddy Basti", "Potato Lucknow"...'
              }
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="agri-btn-primary px-6 text-xs font-bold shrink-0 rounded-2xl shadow-xs"
          >
            {lang === 'hi' ? 'खोजें' : 'Search'}
          </button>
        </form>

        {/* Structured Dropdown Filter Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* State */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              {lang === 'hi' ? '1. राज्य (State)' : '1. State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('All');
                setSelectedMarket('All');
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {statesList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              {lang === 'hi' ? '2. जिला (District)' : '2. District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedMarket('All');
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="All">{lang === 'hi' ? 'सभी जिले' : 'All Districts'}</option>
              {districtsList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Market / Mandi */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              {lang === 'hi' ? '3. आधिकारिक मंडी (Mandi)' : '3. Official APMC'}
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="All">{lang === 'hi' ? 'सभी मंडियां' : 'All Mandis'}</option>
              {marketsList.map((m) => (
                <option key={m.id || m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Commodity / Crop */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
              {lang === 'hi' ? '4. फसल / जिंस (Crop)' : '4. Commodity'}
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {OFFICIAL_COMMODITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {lang === 'hi' ? `${c.labelHi} (${c.labelEn})` : `${c.labelEn} (${c.labelHi})`}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filter summary & Freshness notice */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {selectedDistrict !== 'All' ? `${selectedDistrict}, ` : ''}{selectedState}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-bold text-slate-800">{selectedCommodity !== 'All' ? selectedCommodity : 'All Crops'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            <Clock className="w-3 h-3" />
            <span>Reported Date: {sourceMeta.dataDate}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Data Area: Spotlight Card + Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Official Mandi Price Cards List */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>📊</span>
              <span>{lang === 'hi' ? 'आधिकारिक मंडी रिपोर्ट' : 'Official APMC Price Reports'}</span>
              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {mandiRates.length}
              </span>
            </h3>

            {/* Sort options */}
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="distance">{lang === 'hi' ? 'दूरी के अनुसार (Distance)' : 'Sort: Distance'}</option>
                <option value="modalPrice">{lang === 'hi' ? 'मॉडल भाव (उच्च से निम्न)' : 'Sort: Modal Price (High)'}</option>
                <option value="maxPrice">{lang === 'hi' ? 'अधिकतम भाव' : 'Sort: Max Price'}</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>
              <div className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>
              <div className="h-32 bg-slate-200 animate-pulse rounded-3xl"></div>
            </div>
          ) : mandiRates.length === 0 ? (
            /* Safe Fail state - NO FAKE DATA */
            <div className="agri-card p-8 text-center bg-white border-slate-200 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 mx-auto flex items-center justify-center text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                {lang === 'hi' 
                  ? 'चयनित मंडी या फसल का आधिकारिक भाव अभी उपलब्ध नहीं है।' 
                  : "Today's official mandi price is not available yet."}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {lang === 'hi'
                  ? 'मंडी नीलामी रिपोर्ट दर्ज होने के बाद डेटा स्वतः अपडेट हो जाएगा। आप अन्य जिला या पास की मंडी चुन सकते हैं।'
                  : 'Official APMC reporting is updated daily following market auction hours. Try selecting a nearby district or commodity.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedDistrict('Gorakhpur');
                    setSelectedCommodity('Wheat');
                  }}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition"
                >
                  {lang === 'hi' ? 'गोरखपुर गेहूं भाव देखें' : 'View Gorakhpur Wheat Rates'}
                </button>
              </div>
            </div>
          ) : (
            sortedRecords.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`agri-card p-5 transition cursor-pointer border relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-50/80 to-white border-emerald-500 shadow-md ring-2 ring-emerald-200'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-base sm:text-lg">
                          {item.commodityHi || item.commodity}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {item.variety || 'Standard'}
                        </span>
                        {item.distanceKm != null && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            📍 {item.distanceKm} km away
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-extrabold text-slate-900">{item.market}</span>
                        <span className="text-slate-400">• {item.district}, {item.state}</span>
                      </div>
                    </div>

                    {/* Prominent Modal Price */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                        {lang === 'hi' ? 'मॉडल भाव (Modal)' : 'Modal Price'}
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-emerald-700">
                        ₹{Number(item.modalPrice).toLocaleString()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        per {item.priceUnit || 'Quintal'}
                      </span>
                    </div>
                  </div>

                  {/* Price Range Details & Arrivals */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {lang === 'hi' ? 'न्यूनतम भाव' : 'Min Price'}
                      </span>
                      <span className="font-black text-slate-800">₹{item.minPrice}</span>
                    </div>

                    <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 block">
                        {lang === 'hi' ? 'मॉडल भाव' : 'Modal Price'}
                      </span>
                      <span className="font-black text-emerald-700">₹{item.modalPrice}</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        {lang === 'hi' ? 'अधिकतम भाव' : 'Max Price'}
                      </span>
                      <span className="font-black text-slate-800">₹{item.maxPrice}</span>
                    </div>
                  </div>

                  {/* Footer: Trust Indicator & Date */}
                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>AGMARKNET Official ✓</span>
                    </span>
                    <span className="font-medium text-slate-500">
                      Reported: {item.sourceDate}
                    </span>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Right Column: Detailed Price Breakdown & Official Attribution */}
        {selectedItem && (
          <div className="lg:col-span-5 space-y-4">
            <div className="agri-card p-5 sm:p-6 bg-white border-slate-200 shadow-md space-y-5 sticky top-20">
              
              {/* Card Header */}
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Official APMC Report
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Grade: {selectedItem.grade || 'FAQ'}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {selectedItem.commodityHi || selectedItem.commodity}
                </h3>
                <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{selectedItem.market}, {selectedItem.district} ({selectedItem.state})</span>
                </p>
              </div>

              {/* Price Spotlight Matrix */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-slate-50 border border-emerald-200/80 space-y-3">
                <div className="text-center pb-2 border-b border-emerald-100">
                  <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                    {lang === 'hi' ? 'सर्वाधिक बिका हुआ मॉडल भाव' : 'Official Modal Price'}
                  </span>
                  <div className="text-3xl font-black text-emerald-700 mt-1">
                    ₹{selectedItem.modalPrice}
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    per {selectedItem.priceUnit || 'Quintal'}
                  </span>
                </div>

                {/* Explanatory Callout for Farmers */}
                <div className="text-[11px] text-emerald-900/90 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>{lang === 'hi' ? 'मॉडल भाव क्या है?' : 'What is Modal Price?'}</strong>{' '}
                    {lang === 'hi'
                      ? 'यह वह दर है जिस पर संबंधित मंडी में दिन भर में सबसे अधिक मात्रा में फसल की खरीद-बिक्री हुई है।'
                      : 'The most representative price at which the highest quantity of the commodity was traded on this market day.'}
                  </p>
                </div>

                {/* Range Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold block">
                      {lang === 'hi' ? 'न्यूनतम बोली (Min)' : 'Lowest Bid (Min)'}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{selectedItem.minPrice}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold block">
                      {lang === 'hi' ? 'उच्चतम बोली (Max)' : 'Highest Bid (Max)'}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{selectedItem.maxPrice}</span>
                  </div>
                </div>
              </div>

              {/* Verified Government Source Box (Requirement 8) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Government Data Authority</span>
                  </span>
                  <a
                    href="https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                  >
                    <span>Verify on Data.gov.in</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Directorate of Marketing & Inspection (DMI), Ministry of Agriculture & Farmers Welfare, Government of India.
                </p>

                <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200">
                  {lang === 'hi'
                    ? 'अस्वीकरण: यह सरकार द्वारा रिपोर्टेड वास्तविक मंडी दर है। फसल की गुणवत्ता, नमी और स्थानीय नीलामी के आधार पर वास्तविक बिक्री मूल्य भिन्न हो सकता है।'
                    : 'Official reported mandi price. Actual sale price may vary based on crop quality, moisture, grade, and local market conditions.'}
                </p>
              </div>

              {/* AI Forecast & Selling Advisory (Visually Separated - Requirement 15) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Market Advisory</span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                    Prediction
                  </span>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {lang === 'hi' ? selectedItem.aiForecast?.rationaleHi : selectedItem.aiForecast?.rationale}
                </p>

                <div className="pt-1.5 border-t border-amber-200/80 text-[10px] font-bold text-amber-800 flex items-center justify-between">
                  <span>Recommendation: {selectedItem.aiForecast?.action || 'HOLD'}</span>
                  <span className="text-[9px] text-amber-700 italic">Not official government price</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
