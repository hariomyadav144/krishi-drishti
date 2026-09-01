import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  Layers, 
  Activity, 
  Bell, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  Search,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/users?role=${roleFilter}`),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [roleFilter]);

  const handleSeedData = async () => {
    if (!window.confirm('Reset and re-populate database with realistic Indian agricultural demo data?')) return;
    setSeeding(true);
    setSeedSuccess('');
    try {
      const res = await api.post('/admin/seed');
      if (res.data.success) {
        setSeedSuccess('Database populated with sample farmers, crops, analyses, and alerts successfully!');
        fetchAdminData();
      }
    } catch (e) {
      console.error('Seeding error:', e);
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
      </div>
    );
  }

  const { counts, recentUsers, recentAnalyses } = stats || { counts: {} };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 px-2.5 py-0.5 rounded-full">
              ⚙️ Krishi Drishti Central Command
            </span>
          </div>
          <h2 className="text-2xl font-black">System Administration</h2>
          <p className="text-xs text-purple-200/80 mt-0.5">
            Platform Health, Regional Farmer Analytics & Knowledge Base
          </p>
        </div>

        <button
          onClick={handleSeedData}
          disabled={seeding}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>{seeding ? 'Seeding...' : 'Populate Sample Data'}</span>
        </button>
      </div>

      {seedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{seedSuccess}</span>
        </div>
      )}

      {/* 6 Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="agri-card p-3.5 bg-white border-slate-200">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Farmers</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{counts.totalFarmers || 0}</span>
        </div>

        <div className="agri-card p-3.5 bg-white border-slate-200">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Farms</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{counts.totalFarms || 0}</span>
        </div>

        <div className="agri-card p-3.5 bg-white border-slate-200">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">AI Scans</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{counts.totalAnalyses || 0}</span>
        </div>

        <div className="agri-card p-3.5 bg-white border-slate-200">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Advisories</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{counts.totalRecommendations || 0}</span>
        </div>

        <div className="agri-card p-3.5 bg-white border-slate-200">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Experts</span>
          <span className="text-xl font-black text-purple-600 mt-1 block">{counts.totalExperts || 0}</span>
        </div>

        <div className="agri-card p-3.5 bg-white border-slate-200">
          <span className="text-slate-500 block text-[10px] uppercase font-bold">Feedbacks</span>
          <span className="text-xl font-black text-teal-600 mt-1 block">{counts.totalFeedbacks || 0}</span>
        </div>
      </div>

      {/* User Management Table */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-700" />
            <h3 className="font-extrabold text-sm text-slate-900">Registered Platform Users</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="all">All Roles</option>
              <option value="farmer">Farmers</option>
              <option value="expert">Experts</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Language</th>
                <th className="py-2.5 px-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{u.phone}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'expert'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 uppercase text-slate-500">{u.languagePreference || 'en'}</td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
