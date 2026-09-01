import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  MapPin, 
  Clock, 
  Sparkles, 
  ShieldAlert, 
  RefreshCw, 
  ArrowUpRight,
  Filter,
  BarChart3,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export default function MandiPrices() {
  const { lang, t } = useLanguage();
  const [mandiData, setMandiData] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMandiData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mandi/prices', {
        params: {
          commodity: selectedCommodity,
          state: selectedState,
          search: searchQuery
        }
      });
      if (res.data.success) {
        setMandiData(res.data.data);
        if (res.data.data.length > 0 && !selectedItem) {
          setSelectedItem(res.data.data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch mandi prices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandiData();
  }, [selectedCommodity, selectedState]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMandiData();
  };

  const getCommodityName = (item) => {
    if (lang === 'hi' && item.commodityHi) return item.commodityHi;
    if (lang === 'mr' && item.commodityMr) return item.commodityMr;
    if (lang === 'pa' && item.commodityPa) return item.commodityPa;
    return item.commodity;
  };

  const getActionText = (forecast) => {
    if (lang === 'hi' && forecast.actionHi) return forecast.actionHi;
    if (lang === 'mr' && forecast.actionMr) return forecast.actionMr;
    if (lang === 'pa' && forecast.actionPa) return forecast.actionPa;
    return forecast.action;
  };

  const getRationaleText = (forecast) => {
    if (lang === 'hi' && forecast.rationaleHi) return forecast.rationaleHi;
    return forecast.rationale;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <h2 className="text-2xl font-black text-slate-900">{t('mandi.title')}</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {t('mandi.subtitle')}
          </p>
        </div>

        <button
          onClick={fetchMandiData}
          className="flex items-center gap-1.5 text-xs font-bold text-agri-800 bg-white hover:bg-agri-50 border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Live APMC Sync</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="agri-card p-4 bg-white border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('mandi.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="agri-btn-primary px-5 text-xs font-bold shrink-0"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="All">{t('mandi.allCommodities')}</option>
            <option value="Tomato">Tomato (टमाटर)</option>
            <option value="Onion">Onion (प्याज)</option>
            <option value="Wheat">Wheat (गेहूं)</option>
            <option value="Cotton">Cotton (कपास)</option>
            <option value="Rice / Paddy">Rice / Paddy (धान)</option>
            <option value="Potato">Potato (आलू)</option>
            <option value="Soybean">Soybean (सोयाबीन)</option>
            <option value="Chilli">Chilli (मिर्च)</option>
          </select>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
          >
            <option value="All">{t('mandi.allStates')}</option>
            <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
            <option value="Punjab">Punjab (ਪੰਜਾਬ)</option>
            <option value="Gujarat">Gujarat (ગુજરાત)</option>
            <option value="Madhya Pradesh">Madhya Pradesh (म.प्र.)</option>
            <option value="Uttar Pradesh">Uttar Pradesh (उ.प्र.)</option>
            <option value="Haryana">Haryana (हरियाणा)</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
          </select>
        </div>
      </div>

      {/* Grid: Mandi Cards + Spotlight Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Mandi Rate Cards Column */}
        <div className="lg:col-span-7 space-y-3">
          {loading && mandiData.length === 0 ? (
            <div className="space-y-3">
              <div className="h-24 bg-slate-200 animate-pulse rounded-2xl"></div>
              <div className="h-24 bg-slate-200 animate-pulse rounded-2xl"></div>
              <div className="h-24 bg-slate-200 animate-pulse rounded-2xl"></div>
            </div>
          ) : mandiData.length === 0 ? (
            <div className="agri-card p-8 text-center bg-white border-slate-200 text-slate-500">
              <p className="font-semibold text-sm">No mandi price matches found for your filter.</p>
            </div>
          ) : (
            mandiData.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isUp = item.trend === 'up';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`agri-card p-4 transition cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-50/70 to-white border-emerald-500 shadow-md ring-2 ring-emerald-200'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm sm:text-base">
                          {getCommodityName(item)}
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{item.market}</span>
                        <span className="text-slate-400">• {item.state}</span>
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-lg sm:text-xl font-black text-slate-900">
                        ₹{item.modalPrice.toLocaleString()}
                      </div>
                      <div className={`text-[11px] font-extrabold flex items-center justify-end gap-0.5 ${
                        isUp ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isUp ? '+' : ''}{item.change} ({item.changePercent}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Range: ₹{item.minPrice} - ₹{item.maxPrice}</span>
                    <span className="font-semibold text-slate-700">Arrivals: {item.arrivalQuantity}</span>
                    <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                      item.aiForecast.action.includes('HOLD')
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      AI: {item.aiForecast.action}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Spotlight & AI Forecast Pane */}
        {selectedItem && (
          <div className="lg:col-span-5 space-y-4">
            <div className="agri-card p-5 bg-white border-slate-200 shadow-md space-y-4 sticky top-4">
              
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {selectedItem.market}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {getCommodityName(selectedItem)} Price Analysis
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-700">₹{selectedItem.modalPrice}</span>
                  <span className="text-[10px] text-slate-500 block">per Quintal</span>
                </div>
              </div>

              {/* 7-Day Sparkline Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                    {t('mandi.priceTrajectory')}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">Last 6 Market Days</span>
                </div>

                <div className="h-44 w-full bg-slate-50/60 rounded-xl p-2 border border-slate-100">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedItem.historicalTrend}>
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="price"
                        name="Price (₹/Qtl)"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Selling Recommendation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-emerald-500/10 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    {t('mandi.aiRecommendation')}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-2xs">
                    {getActionText(selectedItem.aiForecast)}
                  </span>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {getRationaleText(selectedItem.aiForecast)}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
                  <span>AI Confidence Score:</span>
                  <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                    {selectedItem.aiForecast.confidence}% High
                  </span>
                </div>
              </div>

              {/* Market Summary Table */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-[10px] block">Daily Minimum</span>
                  <span className="font-bold text-slate-800">₹{selectedItem.minPrice}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-[10px] block">Daily Maximum</span>
                  <span className="font-bold text-slate-800">₹{selectedItem.maxPrice}</span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
