import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { 
  User, 
  MapPin, 
  Layers, 
  Sprout, 
  Droplets, 
  Edit3, 
  Check, 
  Plus, 
  Trash2, 
  Phone, 
  Mail,
  ShieldCheck
} from 'lucide-react';

export default function FarmProfile() {
  const { user, profile, farm, currentCrop, refreshUser } = useAuth();
  const { lang, t } = useLanguage();

  const [crops, setCrops] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    state: profile?.state || 'Maharashtra',
    district: profile?.district || 'Nashik',
    village: profile?.village || 'Pimpalgaon',
    farmSize: farm?.farmSize || 4.5,
    landUnit: farm?.landUnit || 'Acres',
    soilType: farm?.soilType || 'Black Soil / Regur',
    irrigationMethod: farm?.irrigationMethod || 'Drip Irrigation',
  });

  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropData, setNewCropData] = useState({
    cropName: 'Tomato',
    variety: 'Hybrid F1',
    cropStage: 'Vegetative Stage',
    areaAllocated: 2.0,
  });

  const fetchCrops = async () => {
    try {
      const res = await api.get('/crops');
      if (res.data.success) {
        setCrops(res.data.data);
      }
    } catch (e) {
      console.warn('Error fetching crops:', e.message);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.post('/farmer/onboarding', editData);
      await refreshUser();
      setIsEditing(false);
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    try {
      await api.post('/crops', newCropData);
      setShowAddCropModal(false);
      fetchCrops();
      await refreshUser();
    } catch (e) {
      console.error('Error adding crop:', e);
    }
  };

  const handleSetActiveCrop = async (cropId) => {
    try {
      await api.put(`/crops/${cropId}/set-active`);
      fetchCrops();
      await refreshUser();
    } catch (e) {
      console.error('Error activating crop:', e);
    }
  };

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Delete this crop record?')) return;
    try {
      await api.delete(`/crops/${cropId}`);
      fetchCrops();
      await refreshUser();
    } catch (e) {
      console.error('Error deleting crop:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{t('profile.title')}</h2>
          <p className="text-xs text-slate-600">Farmer ID: {user?._id?.substring(0, 10)}...</p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-bold transition shadow-xs"
        >
          <Edit3 className="w-4 h-4 text-agri-600" />
          <span>{isEditing ? (lang === 'hi' ? 'रद्द करें' : 'Cancel Edit') : t('profile.editProfile')}</span>
        </button>
      </div>

      {/* Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="agri-card p-6 bg-white border-agri-300 shadow-md space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">
            {lang === 'hi' ? 'खेत और किसान विवरण संपादित करें' : 'Edit Farm & Farmer Profile'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Village / Area</label>
              <input
                type="text"
                value={editData.village}
                onChange={(e) => setEditData({ ...editData, village: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">District</label>
              <input
                type="text"
                value={editData.district}
                onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State</label>
              <input
                type="text"
                value={editData.state}
                onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Farm Size</label>
              <input
                type="number"
                step="0.5"
                value={editData.farmSize}
                onChange={(e) => setEditData({ ...editData, farmSize: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Soil Type</label>
              <select
                value={editData.soilType}
                onChange={(e) => setEditData({ ...editData, soilType: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Black Soil / Regur">Black Soil / Regur</option>
                <option value="Alluvial">Alluvial</option>
                <option value="Red & Yellow">Red & Yellow</option>
                <option value="Laterite">Laterite</option>
                <option value="Sandy Loam">Sandy Loam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Irrigation Method</label>
              <select
                value={editData.irrigationMethod}
                onChange={(e) => setEditData({ ...editData, irrigationMethod: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Drip Irrigation">Drip Irrigation</option>
                <option value="Sprinkler System">Sprinkler System</option>
                <option value="Flood / Canal">Flood / Canal</option>
                <option value="Tube Well">Tube Well</option>
                <option value="Rainfed">Rainfed</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="agri-btn-primary py-2.5 px-6 text-xs font-bold"
            >
              <Check className="w-4 h-4" />
              <span>{t('profile.saveChanges')}</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Info Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Personal & Contact Details */}
        <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-5 h-5 text-agri-600" />
            <h4 className="font-bold text-sm text-slate-900">{t('profile.personalInfo')}</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Farmer Name</span>
              <span className="font-bold text-slate-900 text-sm">{user?.name || 'Rameshwar Patil'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.phone || '9876543210'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || 'farmer@krishidrishti.in'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{profile?.village || 'Pimpalgaon'}, {profile?.district || 'Nashik'}, {profile?.state || 'Maharashtra'}</span>
            </div>
          </div>
        </div>

        {/* Farm & Agronomic Setup */}
        <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Layers className="w-5 h-5 text-agri-600" />
            <h4 className="font-bold text-sm text-slate-900">{t('profile.farmInfo')}</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px]">Total Holding</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {farm?.farmSize || 4.5} {farm?.landUnit || 'Acres'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px]">Soil Type</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                {farm?.soilType || 'Black Soil'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px]">Irrigation</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                {farm?.irrigationMethod || 'Drip Irrigation'}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px]">Water Source</span>
              <span className="font-bold text-slate-900 text-xs mt-0.5 block truncate">
                Borewell & Pond
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Cultivated Crops Management */}
      <div className="agri-card p-5 bg-white border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-agri-600" />
            <h4 className="font-bold text-sm text-slate-900">{t('profile.cropsInfo')}</h4>
          </div>

          <button
            onClick={() => setShowAddCropModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-agri-700 bg-agri-50 px-3 py-1.5 rounded-xl border border-agri-200 hover:bg-agri-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Crop</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {crops.map((crop) => (
            <div
              key={crop._id}
              className={`p-4 rounded-2xl border transition-all ${
                crop.isCurrent
                  ? 'bg-agri-50/70 border-agri-400 ring-1 ring-agri-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-sm text-slate-900">{crop.cropName}</h5>
                    {crop.isCurrent && (
                      <span className="text-[10px] uppercase font-bold bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                        Active Main
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {crop.variety} • {crop.areaAllocated} Acres
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Stage: <span className="font-semibold">{crop.cropStage}</span> • Health: <span className="font-semibold text-emerald-700">{crop.healthStatus} ({crop.healthScore}%)</span>
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {!crop.isCurrent && (
                    <button
                      onClick={() => handleSetActiveCrop(crop._id)}
                      className="text-[10px] font-bold text-agri-700 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-agri-50"
                      title="Set as active crop"
                    >
                      Make Active
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCrop(crop._id)}
                    className="text-slate-300 hover:text-red-500 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Crop Modal */}
      {showAddCropModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Add Crop to Farm</h3>
            <form onSubmit={handleAddCrop} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Crop Type</label>
                <select
                  value={newCropData.cropName}
                  onChange={(e) => setNewCropData({ ...newCropData, cropName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Tomato">Tomato</option>
                  <option value="Rice / Paddy">Rice / Paddy</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Potato">Potato</option>
                  <option value="Onion">Onion</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Chilli / Pepper">Chilli / Pepper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Variety Name</label>
                <input
                  type="text"
                  value={newCropData.variety}
                  onChange={(e) => setNewCropData({ ...newCropData, variety: e.target.value })}
                  placeholder="e.g. Abhinav F1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Growth Stage</label>
                <select
                  value={newCropData.cropStage}
                  onChange={(e) => setNewCropData({ ...newCropData, cropStage: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Sowing / Germination">Sowing / Germination</option>
                  <option value="Vegetative Stage">Vegetative Stage</option>
                  <option value="Flowering Stage">Flowering Stage</option>
                  <option value="Fruit / Pod Formation">Fruit / Pod Formation</option>
                  <option value="Harvesting">Harvesting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Area (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newCropData.areaAllocated}
                  onChange={(e) => setNewCropData({ ...newCropData, areaAllocated: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCropModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 agri-btn-primary py-2.5 text-xs font-bold"
                >
                  Add Crop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
