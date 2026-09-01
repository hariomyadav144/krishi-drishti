import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Circle, Clock, Tag, ArrowRight } from 'lucide-react';

export default function ActionPlanChecklist({ tasks = [], onToggleTask, onSeeAllTasks }) {
  const { t, lang } = useLanguage();

  const total = tasks.length;
  const completed = tasks.filter(t => t.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getDayBadgeStyle = (dayLabel) => {
    if (dayLabel === 'TODAY') {
      return 'bg-emerald-600 text-white font-extrabold';
    }
    return 'bg-slate-100 text-slate-700 font-semibold';
  };

  return (
    <div className="agri-card p-5 bg-white border-slate-200 shadow-sm">
      {/* Header & Progress Bar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{t('dashboard.upcomingTasks')}</h4>
          <p className="text-[11px] text-slate-500">
            {completed} of {total} {t('actionPlan.completed')} ({percentage}%)
          </p>
        </div>
        {onSeeAllTasks && (
          <button
            onClick={onSeeAllTasks}
            className="text-xs font-semibold text-agri-700 hover:text-agri-800 flex items-center gap-1"
          >
            <span>{t('dashboard.viewAllTasks')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
        <div 
          className="bg-gradient-to-r from-agri-600 to-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-500">{t('dashboard.noTasks')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => onToggleTask && onToggleTask(task._id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                task.isCompleted
                  ? 'bg-slate-50/80 border-slate-200 opacity-70'
                  : 'bg-white border-slate-200 hover:border-agri-300 hover:shadow-xs'
              }`}
            >
              {/* Checkbox Icon */}
              <button 
                type="button"
                className="mt-0.5 shrink-0 text-slate-400 hover:text-agri-600 focus:outline-none transition"
              >
                {task.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 hover:text-agri-600" />
                )}
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${getDayBadgeStyle(task.dayLabel)}`}>
                    {task.dayLabel || 'TODAY'}
                  </span>

                  {task.category && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {task.category}
                    </span>
                  )}

                  {task.priority && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getPriorityStyle(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>

                <p className={`text-xs font-semibold ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                  {lang === 'hi' && task.titleHi ? task.titleHi : task.title}
                </p>

                {task.description && !task.isCompleted && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {lang === 'hi' && task.descriptionHi ? task.descriptionHi : task.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
