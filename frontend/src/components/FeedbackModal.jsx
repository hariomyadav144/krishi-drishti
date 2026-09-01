import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { ThumbsUp, ThumbsDown, HelpCircle, CheckCircle2, MessageSquare } from 'lucide-react';

export default function FeedbackModal({ recommendationId, cropAnalysisId, cropName, onFeedbackSubmitted }) {
  const { t, lang } = useLanguage();
  const [rating, setRating] = useState(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (selectedRating) => {
    const finalRating = selectedRating || rating;
    if (!finalRating) return;

    setIsSubmitting(true);
    try {
      await api.post('/feedback', {
        recommendationId,
        cropAnalysisId,
        rating: finalRating,
        comments,
        cropName,
      });
      setIsSubmitted(true);
      if (onFeedbackSubmitted) onFeedbackSubmitted(finalRating);
    } catch (e) {
      console.error('Error submitting feedback:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 flex items-center justify-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold">{t('advisor.feedbackThanks')}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
      <p className="font-bold text-slate-800 text-center mb-2.5">
        {t('advisor.didItHelp')}
      </p>

      {/* 3 Feedback options */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          type="button"
          onClick={() => { setRating('helped'); handleSubmit('helped'); }}
          disabled={isSubmitting}
          className={`py-2 px-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
            rating === 'helped'
              ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
              : 'bg-white hover:bg-emerald-50 border-slate-200 text-slate-700'
          }`}
        >
          <ThumbsUp className="w-4 h-4 text-emerald-600" />
          <span className="text-[10px] leading-tight">{t('advisor.yesHelped')}</span>
        </button>

        <button
          type="button"
          onClick={() => { setRating('partially_helped'); handleSubmit('partially_helped'); }}
          disabled={isSubmitting}
          className={`py-2 px-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
            rating === 'partially_helped'
              ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold'
              : 'bg-white hover:bg-amber-50 border-slate-200 text-slate-700'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] leading-tight">{t('advisor.partiallyHelped')}</span>
        </button>

        <button
          type="button"
          onClick={() => { setRating('not_helped'); handleSubmit('not_helped'); }}
          disabled={isSubmitting}
          className={`py-2 px-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
            rating === 'not_helped'
              ? 'bg-red-100 border-red-400 text-red-900 font-bold'
              : 'bg-white hover:bg-red-50 border-slate-200 text-slate-700'
          }`}
        >
          <ThumbsDown className="w-4 h-4 text-red-500" />
          <span className="text-[10px] leading-tight">{t('advisor.notHelped')}</span>
        </button>
      </div>

      <p className="text-[10px] text-slate-500 text-center">
        {lang === 'hi'
          ? 'आपकी प्रतिक्रिया भविष्य में AI सिफारिशों को और सटीक बनाती है।'
          : 'Your feedback continuously improves future AI agronomy advice.'}
      </p>
    </div>
  );
}
