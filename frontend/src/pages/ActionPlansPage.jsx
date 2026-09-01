import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  CheckSquare, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Filter, 
  Clock, 
  CheckCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function ActionPlansPage() {
  const { lang, t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, completionRate: 0 });
  const [filter, setFilter] = useState('all'); // all | pending | completed
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dayLabel: 'TODAY',
    priority: 'Medium',
    category: 'Inspection',
  });

  const fetchActionPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/action-plans');
      if (res.data.success) {
        setTasks(res.data.data.tasks);
        setStats(res.data.data.stats);
      }
    } catch (e) {
      console.error('Failed to load action plans:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionPlans();
  }, []);

  const handleToggle = async (taskId) => {
    try {
      await api.put(`/action-plans/${taskId}/toggle`);
      fetchActionPlans();
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  const handleDelete = async (taskId, e) => {
    e.stopPropagation();
    if (!window.confirm(lang === 'hi' ? 'क्या आप इस कार्य को हटाना चाहते हैं?' : 'Delete this task?')) return;
    try {
      await api.delete(`/action-plans/${taskId}`);
      fetchActionPlans();
    } catch (e) {
      console.error('Error deleting task:', e);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await api.post('/action-plans', newTask);
      setShowAddModal(false);
      setNewTask({ title: '', description: '', dayLabel: 'TODAY', priority: 'Medium', category: 'Inspection' });
      fetchActionPlans();
    } catch (e) {
      console.error('Error creating task:', e);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t('actionPlan.title')}</h2>
          <p className="text-xs text-slate-600 mt-0.5">{t('actionPlan.subtitle')}</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="agri-btn-primary text-xs py-2 px-4 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('actionPlan.addTask')}</span>
        </button>
      </div>

      {/* Stats & Progress Overview */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-agri-600" />
            <h4 className="font-bold text-slate-900 text-sm">{t('actionPlan.progress')}</h4>
          </div>
          <span className="text-sm font-extrabold text-agri-700">
            {stats.completionRate}% Done
          </span>
        </div>

        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-gradient-to-r from-agri-600 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">{t('actionPlan.total')}</span>
            <span className="font-bold text-base text-slate-900">{stats.total}</span>
          </div>

          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block">{t('actionPlan.completed')}</span>
            <span className="font-bold text-base text-emerald-900">{stats.completed}</span>
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-[11px] text-amber-700 block">{t('actionPlan.pending')}</span>
            <span className="font-bold text-base text-amber-900">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-agri-700 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t('actionPlan.allFilter')} ({stats.total})
        </button>

        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'pending'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t('actionPlan.pendingFilter')} ({stats.pending})
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'completed'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {t('actionPlan.completedFilter')} ({stats.completed})
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <CheckCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No tasks in this view.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              onClick={() => handleToggle(task._id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                task.isCompleted
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 hover:border-agri-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  className="mt-0.5 shrink-0 text-slate-400 hover:text-agri-600"
                >
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-agri-600 text-white">
                      {task.dayLabel || 'TODAY'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {task.category || 'General'}
                    </span>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                      {task.priority || 'Medium'} Priority
                    </span>
                  </div>

                  <h4 className={`text-xs font-bold leading-snug ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {lang === 'hi' && task.titleHi ? task.titleHi : task.title}
                  </h4>

                  {task.description && !task.isCompleted && (
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {lang === 'hi' && task.descriptionHi ? task.descriptionHi : task.description}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDelete(task._id, e)}
                className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-extrabold text-base text-slate-900">
              {lang === 'hi' ? 'नया कार्य जोड़ें' : 'Add Custom Farming Task'}
            </h3>

            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {lang === 'hi' ? 'कार्य का शीर्षक *' : 'Task Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Apply neem oil spray on lower leaves"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {lang === 'hi' ? 'विवरण (वैकल्पिक)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Dosage and special notes..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {lang === 'hi' ? 'समय / दिन' : 'Day Label'}
                  </label>
                  <select
                    value={newTask.dayLabel}
                    onChange={(e) => setNewTask({ ...newTask, dayLabel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="TODAY">TODAY</option>
                    <option value="DAY 2">DAY 2</option>
                    <option value="DAY 3">DAY 3</option>
                    <option value="DAY 5">DAY 5</option>
                    <option value="DAY 7">DAY 7</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {lang === 'hi' ? 'श्रेणी' : 'Category'}
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Inspection">Inspection</option>
                    <option value="Irrigation">Irrigation</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Pest Management">Pest Management</option>
                    <option value="Pruning & Weeding">Pruning & Weeding</option>
                    <option value="Soil Care">Soil Care</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 agri-btn-primary py-2.5 text-xs font-bold"
                >
                  {lang === 'hi' ? 'सहेजें' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
