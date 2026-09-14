import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import FieldIntelligenceHero from '../components/FieldMapping/FieldIntelligenceHero';
import FieldMap from '../components/FieldMapping/FieldMap';
import FieldDataForm from '../components/FieldMapping/FieldDataForm';
import FieldIntelligenceExtensions from '../components/FieldMapping/FieldIntelligenceExtensions';
import SavedFieldsList from '../components/FieldMapping/SavedFieldsList';
import { calculatePolygonArea } from '../utils/areaUtils';
import { DEFAULT_DEMO_COORDINATE, SAMPLE_DEMO_FIELD_BOUNDARY } from '../utils/gpsUtils';
import { 
  fetchSavedFields, 
  saveFieldData, 
  deleteFieldData, 
  getActiveField, 
  setActiveField as persistActiveField 
} from '../services/fieldService';

export default function FieldMappingPage({ setActiveTab }) {
  const { lang, t } = useLanguage();

  const [savedFields, setSavedFields] = useState([]);
  const [activeField, setActiveFieldState] = useState(null);
  const [editingField, setEditingField] = useState(null);

  // Map and Boundary State
  const [boundaryPoints, setBoundaryPoints] = useState(() => SAMPLE_DEMO_FIELD_BOUNDARY);
  const [selectedCrop, setSelectedCrop] = useState('Maize');
  
  // GPS State
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('GPS Waiting');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isDemoLocation, setIsDemoLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load Saved Fields on Mount
  useEffect(() => {
    async function loadFields() {
      const fields = await fetchSavedFields();
      setSavedFields(fields);

      const initialActive = getActiveField();
      if (initialActive) {
        setActiveFieldState(initialActive);
        setEditingField(initialActive);
        if (initialActive.points && initialActive.points.length > 0) {
          setBoundaryPoints(initialActive.points);
        }
        if (initialActive.crop) {
          setSelectedCrop(initialActive.crop);
        }
      }
    }
    loadFields();
  }, []);

  // Compute live polygon area from boundary points
  const areaCalc = useMemo(() => {
    return calculatePolygonArea(boundaryPoints);
  }, [boundaryPoints]);

  // Handle Save Field
  const handleSaveField = async (formData) => {
    setIsSaving(true);
    try {
      const saved = await saveFieldData({
        ...formData,
        gpsAccuracy: gpsAccuracy || (isDemoLocation ? 12 : 20)
      });

      // Update state
      const updatedFields = await fetchSavedFields();
      setSavedFields(updatedFields);
      setActiveFieldState(saved);
      setEditingField(saved);
      persistActiveField(saved);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle View Field from List
  const handleViewField = useCallback((field) => {
    setActiveFieldState(field);
    setEditingField(field);
    if (field.points && Array.isArray(field.points)) {
      setBoundaryPoints(field.points);
    }
    if (field.crop) {
      setSelectedCrop(field.crop);
    }
    persistActiveField(field);

    // Smooth scroll up to map
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }, []);

  // Handle Edit Field from List
  const handleEditField = useCallback((field) => {
    setEditingField(field);
    setActiveFieldState(field);
    if (field.points && Array.isArray(field.points)) {
      setBoundaryPoints(field.points);
    }
    if (field.crop) {
      setSelectedCrop(field.crop);
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }, []);

  // Handle Delete Field from List
  const handleDeleteField = async (fieldId) => {
    const remaining = await deleteFieldData(fieldId);
    setSavedFields(remaining);

    if (activeField?.id === fieldId) {
      const next = remaining.length > 0 ? remaining[0] : null;
      setActiveFieldState(next);
      setEditingField(next);
      if (next?.points) {
        setBoundaryPoints(next.points);
        if (next.crop) setSelectedCrop(next.crop);
      } else {
        setBoundaryPoints([]);
      }
    }
  };

  // Navigate to Satellite NDVI
  const handleNavigateSatellite = () => {
    if (setActiveTab) {
      setActiveTab('satellite');
    }
  };

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

      {/* 2. MAIN MAP & BOUNDARY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Map (8 Columns on Desktop) */}
        <div className="lg:col-span-8 space-y-4">
          <FieldMap
            boundaryPoints={boundaryPoints}
            onBoundaryChange={setBoundaryPoints}
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
        activeField={activeField || {
          crop: selectedCrop,
          areaAcres: areaCalc.acres,
          areaHectares: areaCalc.hectares,
          formattedAcres: areaCalc.formattedAcres,
          formattedHectares: areaCalc.formattedHectares,
          cornersCount: boundaryPoints.length,
          gpsAccuracy: gpsAccuracy || 18,
          updatedAt: new Date().toISOString(),
          center: DEFAULT_DEMO_COORDINATE,
          points: boundaryPoints
        }}
        onNavigateSatellite={handleNavigateSatellite}
      />

      {/* 4. SAVED FIELDS CATALOG */}
      <SavedFieldsList
        fields={savedFields}
        activeFieldId={activeField?.id}
        onViewField={handleViewField}
        onEditField={handleEditField}
        onDeleteField={handleDeleteField}
      />

    </div>
  );
}
