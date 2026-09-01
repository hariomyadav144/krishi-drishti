import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAlerts } from '../context/AlertContext';
import AlertItem from '../components/AlertItem';
import { Bell, CheckCheck, Filter } from 'lucide-react';

export default function AlertsPage() {
  const { lang, t } = useLanguage();
  const { alerts, unreadCount, markAsRead, markAllRead } = useAlerts();
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filteredAlerts = alerts.filter(a => {
    if (priorityFilter === 'critical') return a.priority === 'critical';
    if (priorityFilter === 'high') return a.priority === 'high';
    if (priorityFilter === 'unread') return !a.isRead;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{t('alerts.title')}</h2>
            <p className="text-xs text-slate-600">
              {unreadCount} unread notices
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>{t('alerts.markAllRead')}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setPriorityFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            priorityFilter === 'all'
              ? 'bg-purple-700 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Alerts ({alerts.length})
        </button>

        <button
          onClick={() => setPriorityFilter('unread')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            priorityFilter === 'unread'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setPriorityFilter('critical')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            priorityFilter === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Critical
        </button>

        <button
          onClick={() => setPriorityFilter('high')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
            priorityFilter === 'high'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          High
        </button>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('alerts.noAlerts')}</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertItem
              key={alert._id}
              alert={alert}
              onMarkRead={markAsRead}
            />
          ))
        )}
      </div>

    </div>
  );
}
