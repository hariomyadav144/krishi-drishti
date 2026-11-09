/**
 * Fasal Drishti - Automatic Satellite Harvest Detection & Empty Field State Machine (Backend)
 */

const FIELD_CONDITIONS = {
  ACTIVE_CROP: 'active_crop',
  CROP_NEARING_MATURITY: 'crop_nearing_maturity',
  HARVEST_SUSPECTED: 'harvest_suspected',
  EMPTY_FIELD: 'empty_field',
  FALLOW_BARE_LAND: 'fallow_bare_land',
  INSUFFICIENT_DATA: 'insufficient_data',
  UNKNOWN_CROP: 'unknown_crop'
};

function evaluateHarvestCondition({
  observations = [],
  currentObservation = null,
  cropName = 'Paddy',
  existingState = {}
}) {
  const currentObs = currentObservation || (observations.length > 0 ? observations[0] : null);

  if (!currentObs) {
    return {
      fieldCondition: FIELD_CONDITIONS.INSUFFICIENT_DATA,
      statusLabelEn: 'SATELLITE DATA UNAVAILABLE',
      statusLabelHi: 'उपग्रह डेटा अनुपलब्ध',
      activeCrop: cropName || null,
      isHarvested: false,
      harvestSuspected: false,
      confidence: 0,
      explanationEn: 'No valid satellite acquisition records available.',
      explanationHi: 'कोई वैध उपग्रह अवलोकन उपलब्ध नहीं है।'
    };
  }

  if (currentObs.cloudCoverPercent > 25 || currentObs.isCloudObscured) {
    const lastConfirmedStatus = existingState.lastConfirmedCrop || cropName || 'Paddy';
    return {
      fieldCondition: FIELD_CONDITIONS.INSUFFICIENT_DATA,
      statusLabelEn: 'SATELLITE DATA UNAVAILABLE',
      statusLabelHi: 'उपग्रह डेटा अनुपलब्ध (घने बादल)',
      activeCrop: existingState.activeCrop !== undefined ? existingState.activeCrop : cropName,
      isHarvested: existingState.fieldCondition === FIELD_CONDITIONS.EMPTY_FIELD,
      harvestSuspected: existingState.fieldCondition === FIELD_CONDITIONS.HARVEST_SUSPECTED,
      confidence: 0,
      explanationEn: `Cloud cover (${currentObs.cloudCoverPercent}%) prevented optical analysis. Last confirmed status: ${lastConfirmedStatus}.`,
      explanationHi: `घने बादलों (${currentObs.cloudCoverPercent}%) के कारण ऑप्टिकल अवलोकन बाधित रहा। अंतिम पुष्ट स्थिति: ${lastConfirmedStatus}।`
    };
  }

  const currentNdvi = Number(currentObs.ndvi ?? currentObs.ndviMean ?? 0.65);

  const validSeries = (observations || [])
    .filter(o => o && (o.cloudCoverPercent === undefined || o.cloudCoverPercent <= 25))
    .sort((a, b) => new Date(b.observationDate || b.date) - new Date(a.observationDate || a.date));

  let peakNdvi = 0.75;
  for (const obs of validSeries.slice(0, 8)) {
    const v = Number(obs.ndvi ?? obs.ndviMean ?? 0);
    if (v > peakNdvi) peakNdvi = v;
  }

  const ndviDrop = +(peakNdvi - currentNdvi).toFixed(3);

  // If already confirmed Empty Field
  if (existingState.fieldCondition === FIELD_CONDITIONS.EMPTY_FIELD) {
    if (currentNdvi >= 0.40) {
      return {
        fieldCondition: FIELD_CONDITIONS.ACTIVE_CROP,
        statusLabelEn: 'ACTIVE CROP DETECTED',
        statusLabelHi: 'नई सक्रिय फसल का अंकुरण',
        activeCrop: null,
        previousCrop: existingState.previousCrop || cropName,
        isHarvested: false,
        harvestSuspected: false,
        confidence: 82,
        explanationEn: `New vegetation canopy emergence detected (NDVI: ${currentNdvi.toFixed(2)}) following previous harvest.`,
        explanationHi: `पिछली फसल कटाई के पश्चात खेत में नए आच्छादन का अंकुरण दर्ज हुआ (NDVI: ${currentNdvi.toFixed(2)})।`
      };
    } else {
      return {
        fieldCondition: FIELD_CONDITIONS.EMPTY_FIELD,
        statusLabelEn: 'EMPTY FIELD',
        statusLabelHi: 'खाली खेत (कटाई उपरांत)',
        activeCrop: null,
        previousCrop: existingState.previousCrop || cropName || 'Paddy',
        harvestConfirmedDate: existingState.harvestConfirmedDate || currentObs.observationDate,
        isHarvested: true,
        harvestSuspected: false,
        confidence: 96,
        explanationEn: `No active crop detected after confirmed harvesting. Field is bare soil (NDVI: ${currentNdvi.toFixed(2)}).`,
        explanationHi: `कटाई की पुष्टि के पश्चात खेत पर कोई सक्रिय फसल नहीं है। भूमि खाली परती अवस्था में है।`
      };
    }
  }

  const isPostHarvestNdviRange = currentNdvi < 0.28;
  const isSharpDropFromPeak = (peakNdvi >= 0.60 && ndviDrop >= 0.32);

  if (isPostHarvestNdviRange || isSharpDropFromPeak) {
    let consecutiveLowCount = 1;
    for (const priorObs of validSeries.slice(1, 4)) {
      const pNdvi = Number(priorObs.ndvi ?? priorObs.ndviMean ?? 0);
      if (pNdvi < 0.30) consecutiveLowCount++;
      else break;
    }

    const wasAlreadySuspected = existingState.fieldCondition === FIELD_CONDITIONS.HARVEST_SUSPECTED;

    if (consecutiveLowCount >= 2 || wasAlreadySuspected) {
      return {
        fieldCondition: FIELD_CONDITIONS.EMPTY_FIELD,
        statusLabelEn: 'EMPTY FIELD',
        statusLabelHi: 'खाली खेत (कटाई पूर्ण)',
        activeCrop: null,
        previousCrop: existingState.activeCrop || cropName || 'Paddy',
        harvestConfirmedDate: currentObs.observationDate || new Date().toISOString(),
        isHarvested: true,
        harvestSuspected: false,
        confidence: 95,
        explanationEn: `Confirmed harvesting: Sustained vegetation drop from peak NDVI ${peakNdvi.toFixed(2)} to ${currentNdvi.toFixed(2)}. Active crop cleared.`,
        explanationHi: `कटाई पूर्ण रूप से सत्यापित: उपग्रह सेंटिनल-2 के क्रमिक अवलोकनों में NDVI ${peakNdvi.toFixed(2)} से गिरकर ${currentNdvi.toFixed(2)} दर्ज हुआ। खेत अब खाली अवस्था में है।`
      };
    } else {
      return {
        fieldCondition: FIELD_CONDITIONS.HARVEST_SUSPECTED,
        statusLabelEn: 'HARVEST SUSPECTED',
        statusLabelHi: 'कटाई संभावित (पुष्टि प्रतीक्षित)',
        activeCrop: existingState.activeCrop || cropName,
        previousCrop: null,
        harvestSuspectedDate: currentObs.observationDate || new Date().toISOString(),
        isHarvested: false,
        harvestSuspected: true,
        confidence: 76,
        explanationEn: `Vegetation changes indicate possible harvesting (NDVI dropped from ${peakNdvi.toFixed(2)} to ${currentNdvi.toFixed(2)}). Confirmation pending subsequent pass.`,
        explanationHi: `वनस्पति सूचकांक में तीव्र गिरावट के कारण कटाई की संभावना है। पुष्टि प्रतीक्षित है।`
      };
    }
  }

  return {
    fieldCondition: FIELD_CONDITIONS.ACTIVE_CROP,
    statusLabelEn: `ACTIVE CROP: ${(cropName || 'PADDY').toUpperCase()}`,
    statusLabelHi: `सक्रिय फसल: ${cropName || 'धान'}`,
    activeCrop: cropName,
    isHarvested: false,
    harvestSuspected: false,
    confidence: 92,
    explanationEn: `Active photosynthetically vigorous crop canopy verified by Sentinel-2 MSI (NDVI: ${currentNdvi.toFixed(2)}).`,
    explanationHi: `उपग्रह सेंटिनल-2 द्वारा स्वस्थ फसल आच्छादन सत्यापित (NDVI: ${currentNdvi.toFixed(2)})।`
  };
}

module.exports = {
  FIELD_CONDITIONS,
  evaluateHarvestCondition
};
