import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  User, 
  Filter, 
  Clock, 
  FileText,
  Activity
} from 'lucide-react';

export default function ExpertDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState({ totalCases: 0, pendingReview: 0, criticalCases: 0, resolvedCases: 0 });
  const [filter, setFilter] = useState('all'); // all | pending | reviewed
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [expertNotes, setExpertNotes] = useState('');
  const [additionalTreatment, setAdditionalTreatment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expert/cases?status=${filter}`);
      if (res.data.success) {
        setCases(res.data.data);
        setStats(res.data.stats);
      }
    } catch (e) {
      console.error('Error fetching expert cases:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filter]);

  const handleOpenPrescribe = (caseItem) => {
    setSelectedCase(caseItem);
    setExpertNotes(caseItem.expertNotes || '');
    setAdditionalTreatment('');
    setSuccessMsg('');
  };

  const handleSendPrescription = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSubmitting(true);
    try {
      const res = await api.post('/expert/prescribe', {
        analysisId: selectedCase._id,
        expertNotes,
        additionalTreatment,
      });

      if (res.data.success) {
        setSuccessMsg('Expert prescription and advisory sent directly to farmer!');
        fetchCases();
        setTimeout(() => {
          setSelectedCase(null);
          setSuccessMsg('');
        }, 1500);
      }
    } catch (e) {
      console.error('Error submitting prescription:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-950 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-200 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
              👨‍🔬 Agricultural Expert Portal
            </span>
          </div>
          <h2 className="text-2xl font-black">{user?.name || 'Dr. Ananya Sharma'}</h2>
          <p className="text-xs text-amber-200/80 mt-0.5">
            Krishi Vigyan Kendra (KVK) Agronomy & Pathology Desk
          </p>
        </div>

        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs text-right text-xs">
          <span className="text-amber-200 block text-[11px]">Cases Pending Review</span>
          <span className="text-2xl font-black text-white">{stats.pendingReview}</span>
        </div>
      </div>

      {/* 4 Stats Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="agri-card p-4 bg-white border-slate-200">
          <span className="text-slate-500 block">Total Farmer Cases</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalCases}</span>
        </div>

        <div className="agri-card p-4 bg-white border-slate-200">
          <span className="text-amber-700 block font-semibold">Pending Review</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pendingReview}</span>
        </div>

        <div className="agri-card p-4 bg-white border-slate-200">
          <span className="text-red-700 block font-semibold">Critical Outbreaks</span>
          <span className="text-2xl font-black text-red-600 mt-1 block">{stats.criticalCases}</span>
        </div>

        <div className="agri-card p-4 bg-white border-slate-200">
          <span className="text-emerald-700 block font-semibold">Expert Prescribed</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.resolvedCases}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'all' ? 'bg-amber-800 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          All Cases ({stats.totalCases})
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          Pending Review ({stats.pendingReview})
        </button>

        <button
          onClick={() => setFilter('reviewed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'reviewed' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          Reviewed ({stats.resolvedCases})
        </button>
      </div>

      {/* Case List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((item) => (
          <div
            key={item._id}
            className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Farmer: {item.farmerId?.name || 'Farmer'} ({item.farmerId?.phone || '9876543210'})
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                    {item.detectedProblem}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Crop: <span className="font-semibold text-slate-700">{item.cropName}</span> • Confidence: {item.confidence}%
                  </p>
                </div>

                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  item.severity === 'Critical' || item.severity === 'High'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.severity}
                </span>
              </div>

              {/* Leaf photo preview */}
              <div className="relative rounded-xl overflow-hidden h-36 bg-slate-100 my-2">
                <img
                  src={item.imageUrl}
                  alt={item.cropName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=400&auto=format&fit=crop&q=80';
                  }}
                />
              </div>

              <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl">
                <p className="text-slate-600">
                  <span className="font-bold text-slate-800">Symptom Note:</span> {item.symptomDescription || 'Field sample photographed.'}
                </p>
                {item.expertReviewed && (
                  <p className="text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Prescribed: {item.expertNotes}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => handleOpenPrescribe(item)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>{item.expertReviewed ? 'Update Prescription' : 'Review & Prescribe Treatment'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Prescription Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase">Expert Prescription Desk</span>
                <h3 className="font-black text-lg text-slate-900">{selectedCase.detectedProblem}</h3>
                <p className="text-xs text-slate-500">Patient Crop: {selectedCase.cropName} • Farmer: {selectedCase.farmerId?.name}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSendPrescription} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Expert Scientific Diagnosis & Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={expertNotes}
                  onChange={(e) => setExpertNotes(e.target.value)}
                  placeholder="E.g., Diagnosis confirmed as Early Blight. Spores active due to high humidity. Pruning lower leaves essential."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Specialist Chemical / Bio Prescription & Dosage
                </label>
                <textarea
                  rows={2}
                  value={additionalTreatment}
                  onChange={(e) => setAdditionalTreatment(e.target.value)}
                  placeholder="E.g., Spray Mancozeb 75% WP @ 2.5g/L + sticker. Repeat after 6 days if symptoms persist."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900">
                ⚡ Submitting will instantly dispatch a high-priority alert to the farmer's mobile app and schedule a follow-up action task.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-amber-700 hover:bg-amber-800 text-white py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Dispatching...' : 'Send Prescription'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
