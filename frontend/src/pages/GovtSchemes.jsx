import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  Building2, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Award, 
  Search, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function GovtSchemes() {
  const { lang, t } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [eligibilityCheck, setEligibilityCheck] = useState({
    hasLand: true,
    hasBankAadhar: true,
    hasIrrigation: true
  });

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await api.get('/tools/schemes');
        const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.schemes) ? res.data.schemes : []);
        setSchemes(list);
        if (list.length > 0) setSelectedScheme(list[0]);
      } catch (e) {
        console.error('Failed to load schemes:', e);
      }
    };
    fetchSchemes();
  }, []);

  const filteredSchemes = (schemes || []).filter(s =>
    (s?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (s?.titleHi || '').includes(search) ||
    (s?.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t('schemes.title')}</h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          {t('schemes.subtitle')}
        </p>
      </div>

      {/* Search Filter */}
      <div className="agri-card p-3 bg-white border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schemes by name, subsidy type (e.g. PM-Kisan, Drip, Solar pump)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Schemes Grid + Scheme Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Column: Scheme Cards */}
        <div className="md:col-span-6 space-y-3">
          {filteredSchemes.map((scheme) => {
            const isSelected = selectedScheme?.id === scheme.id;

            return (
              <div
                key={scheme.id}
                onClick={() => setSelectedScheme(scheme)}
                className={`agri-card p-4 transition cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-50/70 to-white border-amber-500 shadow-md ring-2 ring-amber-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {lang === 'hi' && scheme.categoryHi ? scheme.categoryHi : scheme.category}
                </span>

                <h4 className="font-extrabold text-sm text-slate-900 mt-1.5">
                  {lang === 'hi' && scheme.titleHi ? scheme.titleHi : scheme.title}
                </h4>

                <p className="text-xs text-emerald-700 font-bold mt-1">
                  💰 {lang === 'hi' && scheme.benefitHi ? scheme.benefitHi : scheme.benefit}
                </p>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="text-emerald-600 font-semibold">{scheme.status}</span>
                  <span className="font-bold text-amber-800 flex items-center gap-1">
                    Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Scheme Expanded Details */}
        {selectedScheme && (
          <div className="md:col-span-6">
            <div className="agri-card p-5 bg-white border-slate-200 shadow-md space-y-4 sticky top-4">
              
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Verified Government Scheme
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {lang === 'hi' && selectedScheme.titleHi ? selectedScheme.titleHi : selectedScheme.title}
                </h3>
              </div>

              {/* Benefit Card */}
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-950 block">
                  {t('schemes.financialBenefit')}:
                </span>
                <p className="text-xs text-emerald-900 font-semibold mt-0.5 leading-relaxed">
                  {lang === 'hi' && selectedScheme.benefitHi ? selectedScheme.benefitHi : selectedScheme.benefit}
                </p>
              </div>

              {/* Eligibility */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">
                  {t('schemes.eligibility')}:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {lang === 'hi' && selectedScheme.eligibilityHi ? selectedScheme.eligibilityHi : selectedScheme.eligibility}
                </p>
              </div>

              {/* Required Documents */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  {t('schemes.requiredDocs')}:
                </span>
                <div className="space-y-1.5">
                  {(selectedScheme?.requiredDocs || []).map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply Official Portal CTA */}
              <a
                href={selectedScheme.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition active:scale-95"
              >
                <span>{t('schemes.applyOfficial')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
