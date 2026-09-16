import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  fetchCropScans, 
  compareCropScans, 
  deleteCropScan, 
  fetchCropTimeline 
} from '../services/cropScanService';
import { fetchSavedFields } from '../services/fieldService';
import CropComparisonModal from '../components/CropComparisonModal';
import { 
  History, 
  Calendar, 
  Filter, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Trash2, 
  Eye, 
  Layers, 
  RefreshCw, 
  TrendingUp, 
  MapPin, 
  Info,
  CheckSquare,
  Square,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';

export default function CropHistory({ setActiveTab }) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const isHi = lang === 'hi';

  const [scans, setScans] = useState([]);
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedField, setSelectedField] = useState('All');
  const [selectedHealth, setSelectedHealth] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('all'); // 'all' | '30d' | '90d' | '180d' | '365d'
  const [searchQuery, setSearchQuery] = useState('');

  // Comparison State
  const [selectedScanIds, setSelectedScanIds] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  // Timeline View Toggle
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'timeline'
  const [timelineData, setTimelineData] = useState([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);

  // Single Scan Detail Modal
  const [activeScanModal, setActiveScanModal] = useState(null);

  // Delete Confirmation State
  const [scanToDelete, setScanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Fields & Scans
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [scansData, fieldsData] = await Promise.all([
        fetchCropScans({
          crop: selectedCrop,
          fieldId: selectedField,
          healthStatus: selectedHealth,
          dateRange: selectedDateRange,
          search: searchQuery
        }),
        fetchSavedFields()
      ]);

      setScans(scansData);
      setFields(fieldsData || []);
    } catch (err) {
      console.error('Failed to load crop history:', err);
      setError(isHi ? 'इतिहास लोड करने में त्रुटि। पुनः प्रयास करें।' : 'Failed to retrieve permanent crop history from database.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrop, selectedField, selectedHealth, selectedDateRange, searchQuery, isHi]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Timeline when switching to timeline view
  useEffect(() => {
    if (viewMode === 'timeline') {
      const cropForTimeline = selectedCrop !== 'All' ? selectedCrop : (scans[0]?.cropName || 'Wheat');
      setIsTimelineLoading(true);
      fetchCropTimeline(cropForTimeline)
        .then((data) => setTimelineData(data))
        .catch(() => setTimelineData([]))
        .finally(() => setIsTimelineLoading(false));
    }
  }, [viewMode, selectedCrop, scans]);

  // Unique list of crops present in history
  const uniqueCrops = useMemo(() => {
    const set = new Set(scans.map(s => s.cropName).filter(Boolean));
    return Array.from(set);
  }, [scans]);

  // Handle Selection for Comparison (Limit to 2)
  const toggleSelectScan = (scanId) => {
    if (selectedScanIds.includes(scanId)) {
      setSelectedScanIds(prev => prev.filter(id => id !== scanId));
    } else {
      if (selectedScanIds.length >= 2) {
        // Replace oldest selection
        setSelectedScanIds([selectedScanIds[1], scanId]);
      } else {
        setSelectedScanIds(prev => [...prev, scanId]);
      }
    }
  };

  // Trigger Comparison
  const handleCompareClick = async () => {
    if (selectedScanIds.length !== 2) return;
    setIsComparing(true);
    try {
      const result = await compareCropScans(selectedScanIds[0], selectedScanIds[1], lang);
      if (result) {
        setComparisonResult(result);
      }
    } catch (err) {
      alert(err.response?.data?.message || (isHi ? 'तुलना करने में समस्या आई।' : 'Error comparing crop scans.'));
    } finally {
      setIsComparing(false);
    }
  };

  // Handle Scan Delete
  const confirmDeleteScan = async () => {
    if (!scanToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCropScan(scanToDelete._id);
      setScans(prev => prev.filter(s => s._id !== scanToDelete._id));
      setSelectedScanIds(prev => prev.filter(id => id !== scanToDelete._id));
      setScanToDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting scan.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
      {/* Top Header Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <History className="w-3.5 h-3.5" />
              <span>{isHi ? 'स्थायी किसान इतिहास' : 'Permanent Farmer Records'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isHi ? 'फसल स्वास्थ्य इतिहास व तुलना' : 'Crop Health History & Comparison'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isHi 
                ? 'आपके खेत के सभी पुराने और नए स्कैन हमेशा के लिए सुरक्षित हैं। 1 महीने, 3 महीने या 1 साल पुराने स्कैन चुनकर तुलना करें कि फसल सुधरी या बिगड़ी।'
                : 'All crop scans are permanently archived in MongoDB Atlas. Select any two scans from 1 month, 3 months, or 1 year ago to compare recovery progress.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab && setActiveTab('diagnose')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isHi ? 'नई फसल स्कैन करें' : 'Scan New Crop'}</span>
            </button>

            <button
              onClick={() => setViewMode(prev => prev === 'cards' ? 'timeline' : 'cards')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5 border border-white/10"
            >
              <Layers className="w-4 h-4" />
              <span>{viewMode === 'cards' ? (isHi ? 'टाइमलाइन देखें' : 'View Timeline') : (isHi ? 'कार्ड देखें' : 'View Cards')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Comparison Floating Action Bar */}
      {selectedScanIds.length > 0 && (
        <div className="sticky top-20 z-30 bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              {selectedScanIds.length}/2
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                {selectedScanIds.length === 1 
                  ? (isHi ? '१ स्कैन चुना गया (तुलना के लिए १ और चुनें)' : '1 scan selected (Select 1 more to compare)')
                  : (isHi ? '२ स्कैन चुने गए - तुलना के लिए तैयार!' : '2 scans selected - Ready to compare!')}
              </h4>
              <p className="text-2xs text-slate-500 font-medium">
                {isHi ? 'पुराने और नए स्कैन की स्थिति का आमने-सामने विश्लेषण देखें' : 'Generate side-by-side health progression and recovery report'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedScanIds([])}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              {isHi ? 'हटाएं' : 'Clear'}
            </button>

            <button
              onClick={handleCompareClick}
              disabled={selectedScanIds.length !== 2 || isComparing}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition shadow-md flex items-center gap-2 ${
                selectedScanIds.length === 2 && !isComparing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isComparing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isHi ? 'तुलना की जा रही है...' : 'Comparing Scans...'}</span>
                </>
              ) : (
                <>
                  <span>⚖️</span>
                  <span>{isHi ? 'फसल स्वास्थ्य तुलना करें' : 'Compare Crop Health'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHi ? 'फसल, रोग, या खेत के नाम से खोजें...' : 'Search by crop, disease, or field name...'}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Crop Selector */}
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">{isHi ? '🌾 सभी फसलें' : '🌾 All Crops'}</option>
              {uniqueCrops.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Field Selector */}
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">{isHi ? '🗺️ सभी खेत (Plots)' : '🗺️ All Fields'}</option>
              {fields.map(f => (
                <option key={f.id || f._id} value={f._id || f.id}>{f.fieldName}</option>
              ))}
            </select>

            {/* Health Status Filter */}
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">{isHi ? '🩺 सभी स्वास्थ्य स्तर' : '🩺 All Health States'}</option>
              <option value="Healthy">Healthy (स्वस्थ)</option>
              <option value="Good">Good (अच्छा)</option>
              <option value="Moderate">Moderate (मध्यम)</option>
              <option value="Needs Attention">Needs Attention (ध्यान दें)</option>
              <option value="Critical">Critical (गंभीर)</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{isHi ? '📅 पूरा इतिहास (All Time)' : '📅 All Time'}</option>
              <option value="30d">{isHi ? 'पिछले ३० दिन (Last 1 Month)' : 'Last 1 Month'}</option>
              <option value="90d">{isHi ? 'पिछले ३ महीने (Last 3 Months)' : 'Last 3 Months'}</option>
              <option value="180d">{isHi ? 'पिछले ६ महीने (Last 6 Months)' : 'Last 6 Months'}</option>
              <option value="365d">{isHi ? 'पिछला १ साल (Last 1 Year)' : 'Last 1 Year'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-200/80 rounded-2xl"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
          >
            {isHi ? 'पुनः लोड करें' : 'Retry'}
          </button>
        </div>
      ) : scans.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center space-y-4 border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto">
            🌱
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800">
              {isHi ? 'कोई फसल स्कैन रिकॉर्ड नहीं मिला' : 'No Crop Scan Records Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isHi 
                ? 'आपने अभी तक कोई फसल स्कैन नहीं की है या चुने गए फिल्टर से कोई रिकॉर्ड मेल नहीं खा रहा।'
                : 'You have not scanned any crops yet, or no records match your selected filters.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab && setActiveTab('diagnose')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isHi ? 'पहला स्कैन अभी शुरू करें' : 'Perform First Scan'}</span>
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">
                {isHi ? 'फसल स्वास्थ्य प्रगति टाइमलाइन' : 'Crop Health Progression Timeline'}
              </h3>
              <p className="text-xs text-slate-500">
                {isHi ? 'समय के साथ रोग से सुधार की क्रमिक यात्रा' : 'Chronological recovery trajectory across scan dates'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
              {selectedCrop !== 'All' ? selectedCrop : (scans[0]?.cropName || 'Wheat')}
            </span>
          </div>

          <div className="relative border-l-2 border-emerald-300 ml-4 pl-6 space-y-8 py-2">
            {scans.map((scan, idx) => {
              const isHealthy = scan.healthStatus === 'Healthy' || scan.healthStatus === 'Good';
              return (
                <div key={scan._id} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[31px] top-1.5 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-2xs font-bold text-white shadow-sm ${
                    isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Timeline Item Card */}
                  <div className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={scan.imageUrl}
                        alt={scan.cropName}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-200 shrink-0"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(scan.scanDate).toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-2xs font-bold ${
                            isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {scan.healthStatus}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-800 mt-1">
                          {isHi ? (scan.detectedProblemHi || scan.detectedProblem) : scan.detectedProblem}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {scan.cropStage} • {scan.fieldName || 'General Plot'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => toggleSelectScan(scan._id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          selectedScanIds.includes(scan._id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {selectedScanIds.includes(scan._id) ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>{isHi ? 'तुलना में जोड़ें' : 'Select'}</span>
                      </button>

                      <button
                        onClick={() => setActiveScanModal(scan)}
                        className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {scans.map((scan) => {
            const isSelected = selectedScanIds.includes(scan._id);
            const isHealthy = scan.healthStatus === 'Healthy' || scan.healthStatus === 'Good';

            return (
              <div
                key={scan._id}
                className={`bg-white rounded-3xl border transition flex flex-col overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
                }`}
              >
                {/* Card Image Header */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                  <img
                    src={scan.imageUrl}
                    alt={scan.cropName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

                  {/* Selection Checkbox Pill */}
                  <button
                    onClick={() => toggleSelectScan(scan._id)}
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold transition backdrop-blur-xs flex items-center gap-1.5 shadow-md ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    <span>{isSelected ? (isHi ? 'तुलना हेतु चुना गया' : 'Selected') : (isHi ? 'तुलना के लिए चुनें' : 'Select')}</span>
                  </button>

                  {/* Health Score Pill */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-xs text-white text-xs font-bold">
                    Score: <span className={isHealthy ? 'text-emerald-400' : 'text-amber-400'}>{scan.healthScore}%</span>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-2xs">
                    <span className="font-extrabold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {scan.fieldName || 'General Plot'}
                    </span>
                    <span className="opacity-90 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(scan.scanDate).toLocaleDateString(isHi ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800">{scan.cropName}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-2xs font-extrabold ${
                        isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {scan.healthStatus}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-700 line-clamp-1">
                        {isHi ? (scan.detectedProblemHi || scan.detectedProblem) : scan.detectedProblem}
                      </p>
                      <p className="text-2xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {scan.diagnosis || scan.cause}
                      </p>
                    </div>

                    {/* Treatment Preview */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-2xs space-y-1">
                      <span className="font-bold text-slate-600 block uppercase tracking-wide">
                        {isHi ? 'उपचार सलाह' : 'Treatment:'}
                      </span>
                      <p className="text-slate-700 line-clamp-2">
                        {scan.recommendedTreatment?.organic || scan.recommendedTreatment?.chemical || scan.recommendedTreatment?.general || 'General foliar inspection'}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setActiveScanModal(scan)}
                      className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                    >
                      <span>{isHi ? 'पूरी रिपोर्ट देखें' : 'View Full Report'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setScanToDelete(scan)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title={isHi ? 'हटाएं' : 'Delete scan'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal */}
      {comparisonResult && (
        <CropComparisonModal
          comparisonData={comparisonResult}
          onClose={() => setComparisonResult(null)}
        />
      )}

      {/* Single Scan Details Modal */}
      {activeScanModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">{activeScanModal.cropName} Scan Report</h3>
                <p className="text-xs text-slate-500">
                  {new Date(activeScanModal.scanDate).toLocaleDateString()} • {activeScanModal.fieldName || 'Plot'}
                </p>
              </div>
              <button
                onClick={() => setActiveScanModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
              <img
                src={activeScanModal.imageUrl}
                alt={activeScanModal.cropName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-2xs font-bold uppercase text-slate-400 block">Diagnosis</span>
                  <span className="font-extrabold text-slate-800">{activeScanModal.detectedProblem}</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Score: {activeScanModal.healthScore}%
                </span>
              </div>

              <div>
                <span className="text-2xs font-bold uppercase text-slate-400 block mb-1">Recommended Treatment</span>
                <p className="text-slate-700 font-medium">
                  {activeScanModal.recommendedTreatment?.chemical || activeScanModal.recommendedTreatment?.organic || 'Standard maintenance'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveScanModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {scanToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isHi ? 'स्कैन रिकॉर्ड हटाएं?' : 'Delete Crop Scan Record?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isHi 
                  ? 'क्या आप सचमुच इस स्कैन को स्थायी इतिहास से हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।'
                  : 'Are you sure you want to delete this scan from permanent history? This cannot be undone.'}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setScanToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                onClick={confirmDeleteScan}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
              >
                {isDeleting ? (isHi ? 'हटाया जा रहा है...' : 'Deleting...') : (isHi ? 'हटाएं' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
