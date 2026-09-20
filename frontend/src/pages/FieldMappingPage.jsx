import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import FieldIntelligenceHero from '../components/FieldMapping/FieldIntelligenceHero';
import FieldMap from '../components/FieldMapping/FieldMap';
import FieldDataForm from '../components/FieldMapping/FieldDataForm';
import FieldIntelligenceExtensions from '../components/FieldMapping/FieldIntelligenceExtensions';
import SavedFieldsList from '../components/FieldMapping/SavedFieldsList';
import { calculatePolygonArea, calculatePolygonCenter } from '../utils/areaUtils';
import { 
  getFarms,
  saveFarm,
  activateFarm,
  getActiveFarm,
  deleteFarm,
  purgeLegacyMockStorage
} from '../services/fieldService';
import { Plus, RotateCcw } from 'lucide-react';

export default function FieldMappingPage({ setActiveTab }) {
  const { lang, t } = useLanguage();

  // Section 3: New Farm Flow vs Edit Existing Farm Flow (createNew flag)
  const [createNew, setCreateNew] = useState(true);
  const [mappingMode, setMappingMode] = useState('new'); // 'new' | 'existing' | 'demo'
  const [savedFields, setSavedFields] = useState([]);
  const [activeField, setActiveFieldState] = useState(null);
  const [editingField, setEditingField] = useState(null);

  // Boundary points strictly initialized to [] for new farms
  const [boundaryPoints, setBoundaryPoints] = useState(() => []);
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  
  // GPS State
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('GPS Waiting');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isDemoLocation, setIsDemoLocationState] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const setIsDemoLocation = useCallback((val) => {
    setIsDemoLocationState(val);
    if (val) {
      setMappingMode('demo');
    } else {
      setMappingMode(prev => prev === 'demo' ? 'new' : prev);
    }
  }, []);

  // One-time self-healing auto-data purge on mount + Load Clean Saved Farms Catalog
  useEffect(() => {
    purgeLegacyMockStorage();

    // Clear hash parameters
    if (typeof window !== 'undefined') {
      try {
        if (window.location.hash.includes('fieldId=') || window.location.hash.includes('demo')) {
          window.history.replaceState(null, '', window.location.pathname + '#/field-mapping');
        }
      } catch (_) {}
    }

    // Load saved farms and active farm
    const farms = getFarms();
    setSavedFields(farms);

    const currentActive = getActiveFarm();
    if (currentActive) {
      setActiveFieldState(currentActive);
    }

    // Default to clean empty mapping session (Point 1 ready)
    setCreateNew(true);
    setMappingMode('new');
    setBoundaryPoints([]);
    setEditingField(null);
    setIsDemoLocationState(false);
  }, []);

  // Live Area Calculation
  const areaCalc = useMemo(() => {
    return calculatePolygonArea(boundaryPoints);
  }, [boundaryPoints]);

  // Section 11: Clear All Boundary & Form
  const handleClearAll = useCallback(() => {
    setBoundaryPoints([]);
    if (createNew) {
      setMappingMode('new');
      setEditingField(null);
    }
  }, [createNew]);

  // Section 3 & 19: Add Another Farm / New Farm Flow (createNew = true, _points = [])
  const handleCreateNewField = useCallback(() => {
    setCreateNew(true);
    setMappingMode('new');
    setEditingField(null);
    setBoundaryPoints([]); // Section 33: CRITICAL NEW-FARM BUG FIX: _points = []
    setSelectedCrop('Wheat');
    setIsDemoLocationState(false);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  }, []);

  // Redraw Boundary for current field (clears editable points; starts from Point 1)
  const handleRedrawField = useCallback(() => {
    if (window.confirm(lang === 'hi' ? 'क्या आप इस खेत की सीमा मिटाकर Point 1 से दोबारा बनाना चाहते हैं?' : 'Clear current boundary corners and redraw from Point 1?')) {
      setBoundaryPoints([]);
    }
  }, [lang]);

  // Section 8, 16, 17, 23: Save or Update Farm
  const handleSaveField = async (formData) => {
    setIsSaving(true);
    try {
      const saved = await saveFarm({
        id: createNew ? undefined : editingField?.id,
        name: formData.fieldName,
        farmerName: formData.farmerName,
        crop: formData.crop,
        season: formData.season,
        soilType: formData.soilType,
        notes: formData.notes,
        boundary: boundaryPoints,
        gpsAccuracy: gpsAccuracy || (isDemoLocation ? 12 : 20)
      }, createNew);

      // Refresh saved farms list
      const updatedFarms = getFarms();
      setSavedFields(updatedFarms);
      setActiveFieldState(saved);
      setEditingField(saved);
      setCreateNew(false);
      setMappingMode('existing');
    } finally {
      setIsSaving(false);
    }
  };

  // Section 20 & 21: Farm Switching (Only changes active context; preserves every farm's data)
  const handleActivateFarm = useCallback((farmId) => {
    const activated = activateFarm(farmId);
    if (activated) {
      setActiveFieldState(activated);
      const updatedFarms = getFarms();
      setSavedFields(updatedFarms);
    }
  }, []);

  // Section 22: Update Existing Farm (createNew = false, loads existing boundary)
  const handleEditField = useCallback((farm) => {
    setCreateNew(false);
    setMappingMode('existing');
    setEditingField(farm);
    setActiveFieldState(farm);
    setIsDemoLocationState(false);

    // Section 35: Load only the selected farm's boundary
    const pointsToLoad = (farm.boundary && Array.isArray(farm.boundary))
      ? farm.boundary
      : (farm.points && Array.isArray(farm.points) ? farm.points : []);

    setBoundaryPoints(pointsToLoad);

    if (farm.crop) {
      setSelectedCrop(farm.crop);
    }

    // Activate the farm being updated
    activateFarm(farm.id);

    window.scrollTo({ top: 120, behavior: 'smooth' });
  }, []);

  // View Field from List
  const handleViewField = useCallback((farm) => {
    handleEditField(farm);
  }, [handleEditField]);

  // Delete Farm
  const handleDeleteField = async (farmId) => {
    const remaining = deleteFarm(farmId);
    setSavedFields(remaining);

    const currentActive = getActiveFarm();
    setActiveFieldState(currentActive);

    if (editingField?.id === farmId) {
      setCreateNew(true);
      setEditingField(null);
      setBoundaryPoints([]);
      setMappingMode('new');
    }
  };

  // Navigate to Downstream Satellite NDVI Intelligence
  const handleNavigateSatellite = () => {
    if (setActiveTab) {
      setActiveTab('satellite');
    }
  };

  // Extensions Field Data: Single source of truth for active farm context
  const extensionsFieldData = useMemo(() => {
    if (boundaryPoints.length >= 3) {
      return {
        id: editingField?.id,
        fieldName: editingField?.name || editingField?.fieldName || 'Surveyed Parcel',
        crop: selectedCrop,
        season: editingField?.season || 'Kharif',
        areaAcres: areaCalc.acres,
        areaHectares: areaCalc.hectares,
        formattedAcres: areaCalc.formattedAcres,
        formattedHectares: areaCalc.formattedHectares,
        areaSqMeters: areaCalc.sqMeters,
        cornersCount: boundaryPoints.length,
        gpsAccuracy: gpsAccuracy || (isDemoLocation ? 12 : 20),
        updatedAt: new Date().toISOString(),
        center: calculatePolygonCenter(boundaryPoints),
        points: boundaryPoints,
        boundary: boundaryPoints
      };
    }
    if (activeField && (activeField.boundary?.length >= 3 || activeField.points?.length >= 3)) {
      return activeField;
    }
    return null;
  }, [boundaryPoints, areaCalc, selectedCrop, editingField, gpsAccuracy, isDemoLocation, activeField]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-28 md:pb-12 animate-in fade-in">
      
      {/* 1. HEADER / HERO CARD */}
      <FieldIntelligenceHero
        crop={selectedCrop}
        areaAcres={areaCalc.acres}
        areaHectares={areaCalc.hectares}
        cornersCount={boundaryPoints.length}
        gpsStatus={gpsStatus}
        gpsAccuracy={gpsAccuracy}
        isDemoLocation={isDemoLocation}
      />

      {/* Mode Switcher Banner: New Field vs Existing Saved Field vs Demo Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            mappingMode === 'demo' ? 'bg-amber-500' : (!createNew && editingField ? 'bg-blue-500' : 'bg-emerald-500')
          } animate-pulse`} />
          <span className="font-extrabold text-slate-800 text-sm">
            {mappingMode === 'demo'
              ? (lang === 'hi' ? '🧪 टेस्टिंग / डेमो मोड' : '🧪 Testing / Demo Mode')
              : (!createNew && editingField)
                ? (lang === 'hi' ? `खेत अपडेट: ${editingField.name || editingField.fieldName}` : `Updating Farm: ${editingField.name || editingField.fieldName}`)
                : (lang === 'hi' ? 'नया खेत मैपिंग (0 से शुरू)' : 'New Farm Mapping (Empty Boundary)')}
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-medium">
            {boundaryPoints.length === 0 
              ? (lang === 'hi' ? '0 बिंदु (नक्शे या GPS से Point 1 शुरू होगा)' : '0 corners (Ready for Point 1)')
              : `${boundaryPoints.length} ${boundaryPoints.length === 1 ? 'Point' : 'Points'} mapped`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!createNew && editingField && (
            <button
              type="button"
              id="btn-redraw-field"
              onClick={handleRedrawField}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
              title="Clear boundary and redraw from Point 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सीमा दोबारा बनाएं' : 'Redraw Field'}</span>
            </button>
          )}

          {(!createNew || mappingMode === 'demo' || boundaryPoints.length > 0) && (
            <button
              type="button"
              id="btn-start-new-field"
              onClick={handleCreateNewField}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{lang === 'hi' ? '+ नया खेत बनाएं' : '+ Add Another Farm'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN MAP & BOUNDARY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Map (8 Columns on Desktop) */}
        <div className="lg:col-span-8 space-y-4">
          <FieldMap
            boundaryPoints={boundaryPoints}
            onBoundaryChange={setBoundaryPoints}
            onClearAll={handleClearAll}
            gpsPosition={gpsPosition}
            onGpsPositionChange={(pos) => {
              setGpsPosition(pos);
              setGpsAccuracy(isDemoLocation ? 12 : 18);
            }}
            gpsStatus={gpsStatus}
            onGpsStatusChange={setGpsStatus}
            gpsAccuracy={gpsAccuracy}
            isDemoLocation={isDemoLocation}
            setIsDemoLocation={setIsDemoLocation}
          />
        </div>

        {/* Field Data & Profile Form (4 Columns on Desktop) */}
        <div className="lg:col-span-4 space-y-4">
          <FieldDataForm
            initialField={editingField}
            createNew={createNew}
            farmCount={savedFields.length}
            boundaryPoints={boundaryPoints}
            areaAcres={areaCalc.acres}
            areaHectares={areaCalc.hectares}
            onSave={handleSaveField}
            isSaving={isSaving}
            onCropChange={setSelectedCrop}
          />
        </div>

      </div>

      {/* 3. FIELD INTELLIGENCE EXTENSIONS & SPATIAL ANCHOR */}
      <FieldIntelligenceExtensions
        activeField={extensionsFieldData}
        onNavigateSatellite={handleNavigateSatellite}
      />

      {/* 4. MY FARMS SCREEN / CATALOG */}
      <SavedFieldsList
        fields={savedFields}
        activeFieldId={activeField?.id || activeField?._id}
        onViewField={handleViewField}
        onEditField={handleEditField}
        onActivateFarm={handleActivateFarm}
        onDeleteField={handleDeleteField}
        onCreateNewField={handleCreateNewField}
        onNavigateIntelligence={handleNavigateSatellite}
      />

    </div>
  );
}
