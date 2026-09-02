import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Calculator, 
  Leaf, 
  Layers, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  Info, 
  Sprout, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function FertilizerCalculator() {
  const { lang, t } = useLanguage();
  const { currentCrop, farm } = useAuth();

  const [cropName, setCropName] = useState(currentCrop?.cropName || 'Tomato');
  const [landArea, setLandArea] = useState(farm?.farmSize || '2.5');
  const [landUnit, setLandUnit] = useState(farm?.landUnit || 'Acres');
  const [soilType, setSoilType] = useState(farm?.soilType || 'Black Soil');
  const [loading, setLoading] = useState(false);
  const [calcResult, setCalcResult] = useState(null);

  const calculateDoses = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/tools/fertilizer-calc', {
        cropName,
        landArea,
        landUnit,
        soilType
      });
      if (res.data.success) {
        setCalcResult(res.data.data);
      }
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateDoses();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <Calculator className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('fertilizer.title')}</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {t('fertilizer.subtitle')}
        </p>
      </div>

      {/* Input Parameters Form */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm">
        <form onSubmit={calculateDoses} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Target Crop */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('fertilizer.cropType')}
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              >
                <option value="Tomato">Tomato (टमाटर)</option>
                <option value="Wheat">Wheat (गेहूं)</option>
                <option value="Rice / Paddy">Rice / Paddy (धान)</option>
                <option value="Cotton">Cotton (कपास)</option>
                <option value="Potato">Potato (आलू)</option>
              </select>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('fertilizer.soilType')}
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              >
                <option value="Black Soil">Black Cotton Soil (काली मिट्टी)</option>
                <option value="Alluvial Soil">Alluvial Soil (जलोढ़ मिट्टी)</option>
                <option value="Red Loamy Soil">Red Loamy Soil (लाल दोमट)</option>
                <option value="Sandy Soil">Sandy Loam (बलुई दोमट)</option>
                <option value="Clayey Soil">Clayey Soil (चिकनी मिट्टी)</option>
              </select>
            </div>

            {/* Land Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('fertilizer.landSize')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              />
            </div>

            {/* Land Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Land Unit
              </label>
              <select
                value={landUnit}
                onChange={(e) => setLandUnit(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              >
                <option value="Acres">{t('fertilizer.unitAcres')}</option>
                <option value="Bigha">{t('fertilizer.unitBigha')}</option>
                <option value="Guntha">{t('fertilizer.unitGuntha')}</option>
                <option value="Hectares">{t('fertilizer.unitHectare')}</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full agri-btn-primary py-3 text-xs font-bold shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('fertilizer.calculating')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t('fertilizer.btnCalculate')}</span>
              </>
            )}
          </button>

        </form>
      </div>

      {/* Result Display */}
      {calcResult && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Summary Box: Total Bags & Cost */}
          <div className="agri-card p-5 bg-gradient-to-br from-emerald-800 via-agri-900 to-slate-900 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  {calcResult.cropName || 'Crop'} • {calcResult.enteredArea || 1} {calcResult.enteredUnit || 'Acres'} ({calcResult.normalizedAcres || 1} Acres Normalized)
                </span>
                <h3 className="text-lg font-black mt-1">
                  {t('fertilizer.totalBagsSummary')}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-emerald-200 block">{t('fertilizer.estimatedCost')}</span>
                <span className="text-2xl font-black text-amber-300">
                  ₹{(calcResult.recommendation?.estimatedCostINR || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 3 Main Nutrient Fertilizer Bags */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/15">
                <span className="text-xs font-bold text-emerald-200 block">UREA (46% N)</span>
                <span className="text-2xl font-black block my-0.5">{calcResult.recommendation?.ureaBags ?? 0}</span>
                <span className="text-[11px] text-white/80 block">Bags ({calcResult.recommendation?.totalUreaKg ?? 0} kg)</span>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/15">
                <span className="text-xs font-bold text-amber-200 block">DAP (18:46:0)</span>
                <span className="text-2xl font-black block my-0.5">{calcResult.recommendation?.dapBags ?? 0}</span>
                <span className="text-[11px] text-white/80 block">Bags ({calcResult.recommendation?.totalDapKg ?? 0} kg)</span>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 text-center border border-white/15">
                <span className="text-xs font-bold text-sky-200 block">MOP (60% K)</span>
                <span className="text-2xl font-black block my-0.5">{calcResult.recommendation?.mopBags ?? 0}</span>
                <span className="text-[11px] text-white/80 block">Bags ({calcResult.recommendation?.totalMopKg ?? 0} kg)</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-200/90 flex items-center gap-1.5 bg-black/20 p-2.5 rounded-xl">
              <Info className="w-4 h-4 shrink-0 text-amber-300" />
              <span>{calcResult.soilAdjustment || 'Standard recommended dosage'}</span>
            </div>
          </div>

          {/* Stage-wise Application Timeline */}
          <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{t('fertilizer.stageWiseSchedule')}</span>
            </h4>

            <div className="space-y-3">
              {(calcResult.recommendation?.stageBreakup || []).map((stageItem, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-black text-xs text-slate-900">
                      Phase {idx + 1}: {stageItem.stage}
                    </span>
                    <span className="text-[10px] text-agri-800 bg-agri-100 font-bold px-2 py-0.5 rounded-md">
                      Calibrated for {calcResult.enteredArea} {calcResult.enteredUnit}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {(stageItem?.scaledDoses?.ureaKg || 0) > 0 && (
                      <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold px-2.5 py-1 rounded-lg">
                        Urea: {stageItem.scaledDoses.ureaKg} kg
                      </span>
                    )}
                    {(stageItem?.scaledDoses?.dapKg || 0) > 0 && (
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 font-bold px-2.5 py-1 rounded-lg">
                        DAP: {stageItem.scaledDoses.dapKg} kg
                      </span>
                    )}
                    {(stageItem?.scaledDoses?.mopKg || 0) > 0 && (
                      <span className="bg-sky-50 text-sky-900 border border-sky-200 font-bold px-2.5 py-1 rounded-lg">
                        MOP Potash: {stageItem.scaledDoses.mopKg} kg
                      </span>
                    )}
                    {(stageItem?.scaledDoses?.specialKg || 0) > 0 && (
                      <span className="bg-purple-50 text-purple-900 border border-purple-200 font-bold px-2.5 py-1 rounded-lg">
                        Special / Micronutrient: {stageItem.scaledDoses.specialKg} kg/L
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 italic">
                    💡 {stageItem?.notes || ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Organic & Bio-Fertilizer Alternatives */}
          <div className="agri-card p-5 bg-white border-green-200 shadow-sm space-y-3">
            <h4 className="font-extrabold text-sm text-green-950 flex items-center gap-2">
              <Sprout className="w-4 h-4 text-green-600" />
              <span>{t('fertilizer.organicDoses')}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(calcResult.recommendation?.organicAlternatives || []).map((org, i) => (
                <div key={i} className="p-3 bg-green-50/60 rounded-xl border border-green-100 text-xs">
                  <span className="font-bold text-green-900 block">{org.name}</span>
                  <span className="text-green-800 text-[11px] mt-0.5 block">{org.dosePerAcre}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
