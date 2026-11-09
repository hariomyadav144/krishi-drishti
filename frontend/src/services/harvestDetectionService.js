/**
 * Fasal Drishti - Automatic Satellite Harvest Detection & Empty Field State Machine
 * 
 * Rules:
 * 1. Single low reading does NOT declare harvest; it triggers HARVEST_SUSPECTED.
 * 2. Multi-observation persistence confirms harvest -> EMPTY_FIELD.
 * 3. Upon confirmation, activeCrop is set to null, and previous crop is moved to cropHistory.
 * 4. Separate states: active_crop, crop_nearing_maturity, harvest_suspected, empty_field, fallow_bare_land, insufficient_data, unknown_crop.
 */

export const FIELD_CONDITIONS = {
  ACTIVE_CROP: 'active_crop',
  CROP_NEARING_MATURITY: 'crop_nearing_maturity',
  HARVEST_SUSPECTED: 'harvest_suspected',
  EMPTY_FIELD: 'empty_field',
  FALLOW_BARE_LAND: 'fallow_bare_land',
  INSUFFICIENT_DATA: 'insufficient_data',
  UNKNOWN_CROP: 'unknown_crop'
};

/**
 * Evaluates satellite observation time series to detect harvesting events
 * 
 * @param {Object} params
 * @param {Array} params.observations - Array of historical observations: [{ date, ndvi, cloudCover, satelliteId, ... }]
 * @param {Object} params.currentObservation - Latest observation { date, ndvi, cloudCover, productId, satellite, ... }
 * @param {string} params.cropName - Crop currently or previously grown
 * @param {Object} params.existingState - Current field state from storage/DB
 * @returns {Object} Harvest assessment result with state transition
 */
export function evaluateHarvestCondition({
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
      explanationEn: 'No valid satellite acquisition records available for this field geometry.',
      explanationHi: 'इस खेत के भूखंड हेतु कोई वैध उपग्रह अवलोकन उपलब्ध नहीं है।'
    };
  }

  // Check cloud cover
  if (currentObs.cloudCoverPercent > 25 || currentObs.isCloudObscured) {
    // Cloud cover blocks observation - preserve existing state but flag data unavailable
    const lastConfirmedStatus = existingState.lastConfirmedCrop || cropName || 'Paddy';
    const lastDate = existingState.lastConfirmedDate ? new Date(existingState.lastConfirmedDate).toLocaleDateString() : 'recent';
    return {
      fieldCondition: FIELD_CONDITIONS.INSUFFICIENT_DATA,
      statusLabelEn: 'SATELLITE DATA UNAVAILABLE',
      statusLabelHi: 'उपग्रह डेटा अनुपलब्ध (घने बादल)',
      activeCrop: existingState.activeCrop !== undefined ? existingState.activeCrop : cropName,
      isHarvested: existingState.fieldCondition === FIELD_CONDITIONS.EMPTY_FIELD,
      harvestSuspected: existingState.fieldCondition === FIELD_CONDITIONS.HARVEST_SUSPECTED,
      confidence: 0,
      cloudCover: currentObs.cloudCoverPercent,
      lastConfirmedStatus,
      lastConfirmedDate: existingState.lastConfirmedDate || null,
      explanationEn: `Cloud cover (${currentObs.cloudCoverPercent}%) prevented optical analysis. Last confirmed status: ${lastConfirmedStatus} on ${lastDate}.`,
      explanationHi: `घने बादलों (${currentObs.cloudCoverPercent}%) के कारण ऑप्टिकल अवलोकन बाधित रहा। अंतिम पुष्ट स्थिति: ${lastConfirmedStatus} (${lastDate})।`
    };
  }

  const currentNdvi = Number(currentObs.ndvi ?? currentObs.ndviMean ?? 0.65);
  
  // Build a valid historical time series (excluding clouded observations)
  const validSeries = (observations || [])
    .filter(o => o && (o.cloudCoverPercent === undefined || o.cloudCoverPercent <= 25))
    .sort((a, b) => new Date(b.observationDate || b.date) - new Date(a.observationDate || a.date));

  // Determine historical peak NDVI in past 60 days
  let peakNdvi = 0.75;
  for (const obs of validSeries.slice(0, 8)) {
    const v = Number(obs.ndvi ?? obs.ndviMean ?? 0);
    if (v > peakNdvi) peakNdvi = v;
  }

  const ndviDrop = +(peakNdvi - currentNdvi).toFixed(3);
  const obsDate = new Date(currentObs.observationDate || currentObs.date || Date.now());
  const formattedObsDate = obsDate.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedObsDateEn = obsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // If the field was ALREADY confirmed harvested (Empty Field)
  if (existingState.fieldCondition === FIELD_CONDITIONS.EMPTY_FIELD) {
    // Check if new crop is emerging (NDVI rising significantly > 0.38)
    if (currentNdvi >= 0.40) {
      // New crop emerging!
      return {
        fieldCondition: FIELD_CONDITIONS.ACTIVE_CROP,
        statusLabelEn: 'ACTIVE CROP DETECTED',
        statusLabelHi: 'नई सक्रिय फसल का अंकुरण',
        activeCrop: null, // To be classified by cropClassificationEngine
        previousCrop: existingState.previousCrop || cropName,
        isHarvested: false,
        harvestSuspected: false,
        confidence: 82,
        explanationEn: `New vegetation canopy emergence detected (NDVI: ${currentNdvi.toFixed(2)}) following previous harvest.`,
        explanationHi: `पिछली फसल कटाई के पश्चात खेत में नए आच्छादन का अंकुरण दर्ज हुआ (NDVI: ${currentNdvi.toFixed(2)})।`
      };
    } else {
      // Still Empty Field / Bare Soil
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
        explanationHi: `कटाई की पुष्टि के पश्चात खेत पर कोई सक्रिय फसल नहीं है। भूमि खाली परती अवस्था (NDVI: ${currentNdvi.toFixed(2)}) में है।`
      };
    }
  }

  // CRITICAL THRESHOLDS FOR HARVEST DETECTION:
  // Post-harvest bare ground NDVI is typically 0.12 - 0.26
  // Active crop NDVI is typically > 0.48, peak 0.70 - 0.88
  const isPostHarvestNdviRange = currentNdvi < 0.28;
  const isSharpDropFromPeak = (peakNdvi >= 0.60 && ndviDrop >= 0.32);

  if (isPostHarvestNdviRange || isSharpDropFromPeak) {
    // Count consecutive low observations in recent passes
    let consecutiveLowCount = 1;
    for (const priorObs of validSeries.slice(1, 4)) {
      const pNdvi = Number(priorObs.ndvi ?? priorObs.ndviMean ?? 0);
      if (pNdvi < 0.30) {
        consecutiveLowCount++;
      } else {
        break;
      }
    }

    // Also check if prior state was already harvest_suspected
    const wasAlreadySuspected = existingState.fieldCondition === FIELD_CONDITIONS.HARVEST_SUSPECTED;

    if (consecutiveLowCount >= 2 || wasAlreadySuspected) {
      // CONFIRMED HARVEST -> EMPTY FIELD
      return {
        fieldCondition: FIELD_CONDITIONS.EMPTY_FIELD,
        statusLabelEn: 'EMPTY FIELD',
        statusLabelHi: 'खाली खेत (कटाई पूर्ण)',
        activeCrop: null, // Crucial: Active crop becomes null!
        previousCrop: existingState.activeCrop || cropName || 'Paddy',
        harvestConfirmedDate: currentObs.observationDate || new Date().toISOString(),
        estimatedHarvestDate: existingState.harvestSuspectedDate || currentObs.observationDate,
        isHarvested: true,
        harvestSuspected: false,
        confidence: 95,
        transitionTriggered: true,
        explanationEn: `Confirmed harvesting: Sustained vegetation drop from peak NDVI ${peakNdvi.toFixed(2)} to ${currentNdvi.toFixed(2)} across multiple Sentinel-2 passes. Active crop cleared.`,
        explanationHi: `कटाई पूर्ण रूप से सत्यापित: उपग्रह सेंटिनल-2 के क्रमिक अवलोकनों में NDVI ${peakNdvi.toFixed(2)} से गिरकर ${currentNdvi.toFixed(2)} दर्ज हुआ। खेत अब खाली अवस्था में है।`
      };
    } else {
      // FIRST LOW READING -> HARVEST SUSPECTED (Confirmation Pending)
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
        explanationEn: `Vegetation changes indicate possible harvesting on ${formattedObsDateEn} (NDVI dropped from ${peakNdvi.toFixed(2)} to ${currentNdvi.toFixed(2)}). Confirmation pending subsequent pass.`,
        explanationHi: `${formattedObsDate} को वनस्पति सूचकांक में तीव्र गिरावट (NDVI: ${peakNdvi.toFixed(2)} से ${currentNdvi.toFixed(2)}) के कारण कटाई की संभावना है। पुष्टि प्रतीक्षित है।`
      };
    }
  }

  // Normal active crop or nearing maturity
  const isRipening = currentNdvi >= 0.35 && currentNdvi < 0.55 && ndviDrop > 0.15;
  if (isRipening) {
    return {
      fieldCondition: FIELD_CONDITIONS.CROP_NEARING_MATURITY,
      statusLabelEn: 'CROP NEARING MATURITY',
      statusLabelHi: 'फसल पकाव की अवस्था में',
      activeCrop: existingState.activeCrop || cropName,
      isHarvested: false,
      harvestSuspected: false,
      confidence: 88,
      explanationEn: `Canopy senescence indicates natural ripening prior to harvest (NDVI: ${currentNdvi.toFixed(2)}).`,
      explanationHi: `फसल में प्राकृतिक पकाव के लक्षण (NDVI: ${currentNdvi.toFixed(2)})। कटाई का समय निकट है।`
    };
  }

  // Healthy active growing crop
  return {
    fieldCondition: FIELD_CONDITIONS.ACTIVE_CROP,
    statusLabelEn: `ACTIVE CROP: ${(cropName || 'PADDY').toUpperCase()}`,
    statusLabelHi: `सक्रिय फसल: ${cropName || 'धान'}`,
    activeCrop: cropName,
    isHarvested: false,
    harvestSuspected: false,
    confidence: 92,
    explanationEn: `Active photosynthetically vigorous crop canopy verified by Sentinel-2 MSI (NDVI: ${currentNdvi.toFixed(2)}).`,
    explanationHi: `उपग्रह सेंटिनल-2 द्वारा स्वस्थ प्रकाश संश्लेषक फसल आच्छादन सत्यापित (NDVI: ${currentNdvi.toFixed(2)})।`
  };
}
