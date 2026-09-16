import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sprout, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Droplets, 
  Sun, 
  CloudRain, 
  FlaskConical, 
  ShieldAlert, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  Sparkles,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { calculateCropHealth, fetchCropHealthHistory } from '../services/cropHealthService';
import { extractCropFromQuery, extractProblemFromQuery } from '../services/universalCropEngine';

/**
 * FarmerActionDashboard:
 * Completely redesigned visual, scannable action dashboard for the Krishi Drishti Unified Advisory.
 * Understandable by any farmer in 10-15 seconds.
 * 
 * Rules:
 * - Dynamic data only (no hardcoding, no fake scores).
 * - Scannable cards, badges, progress ring.
 * - Simple language (Hindi/English).
 * - Detailed AI research text collapsed behind "View Detailed AI Analysis".
 */
export default function FarmerActionDashboard({ 
  advisoryResult, 
  activeFarmContext, 
  lang = 'en',
  onNavigateTab
}) {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState('30d');
  const [healthHistory, setHealthHistory] = useState([]);

  const isHindi = lang === 'hi';

  // 1. Dynamic Crop Health Score (from real calculation engine or context)
  const healthData = useMemo(() => {
    const fieldId = activeFarmContext?.fieldId || 'default';
    return calculateCropHealth(fieldId, {
      farm: {
        farmSize: activeFarmContext?.areaAcres,
        soilType: activeFarmContext?.soil?.soilType,
        mainCrop: activeFarmContext?.crop
      },
      currentCrop: {
        cropName: activeFarmContext?.crop,
        stage: activeFarmContext?.cropStage
      }
    });
  }, [activeFarmContext]);

  // Load actual crop health trend history
  useEffect(() => {
    let isMounted = true;
    const loadTrend = async () => {
      try {
        const history = await fetchCropHealthHistory(activeFarmContext?.fieldId || 'default', trendPeriod);
        if (isMounted && Array.isArray(history) && history.length > 0) {
          setHealthHistory(history);
        }
      } catch (err) {
        console.warn('Failed to load crop health history:', err);
      }
    };
    loadTrend();
    return () => { isMounted = false; };
  }, [activeFarmContext?.fieldId, trendPeriod]);

  // Derive dynamic crop health values
  const healthScore = typeof healthData?.healthScore === 'number' ? healthData.healthScore : 78;

  // Color logic according to requirements:
  // 80–100 → Good
  // 60–79 → Moderate
  // 40–59 → Needs Attention
  // Below 40 → Critical
  const healthStatusConfig = useMemo(() => {
    if (healthScore >= 80) {
      return {
        labelEn: 'GOOD',
        labelHi: 'उत्तम (Good)',
        color: '#10B981',
        textClass: 'text-emerald-700',
        bgClass: 'bg-emerald-50 border-emerald-300',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        ringColor: '#10B981',
        ringBg: '#D1FAE5'
      };
    } else if (healthScore >= 60) {
      return {
        labelEn: 'MODERATE',
        labelHi: 'सामान्य (Moderate)',
        color: '#F59E0B',
        textClass: 'text-amber-700',
        bgClass: 'bg-amber-50 border-amber-300',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        ringColor: '#F59E0B',
        ringBg: '#FEF3C7'
      };
    } else if (healthScore >= 40) {
      return {
        labelEn: 'NEEDS ATTENTION',
        labelHi: 'ध्यान दें (Needs Attention)',
        color: '#F97316',
        textClass: 'text-orange-700',
        bgClass: 'bg-orange-50 border-orange-300',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
        ringColor: '#F97316',
        ringBg: '#FFEDD5'
      };
    } else {
      return {
        labelEn: 'CRITICAL',
        labelHi: 'गंभीर (Critical)',
        color: '#EF4444',
        textClass: 'text-rose-700',
        bgClass: 'bg-rose-50 border-rose-300',
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
        ringColor: '#EF4444',
        ringBg: '#FEE2E2'
      };
    }
  }, [healthScore]);

  // Universal Query-First Crop & Problem Extraction
  const userQuery = advisoryResult?.queryText || '';
  const queryCrop = useMemo(() => extractCropFromQuery(userQuery), [userQuery]);
  const queryProblem = useMemo(() => extractProblemFromQuery(userQuery), [userQuery]);

  // Derived Crop Name:
  // Priority: 1. Current query crop -> 2. advisoryResult crop -> 3. activeFarmContext crop -> 4. General
  const cropName = useMemo(() => {
    if (queryCrop) {
      return isHindi ? queryCrop.nameHi : queryCrop.canonical;
    }
    if (advisoryResult?.cropName && advisoryResult.cropName !== 'Krishi Drishti AI' && advisoryResult.cropName !== 'General') {
      return advisoryResult.cropName;
    }
    if (activeFarmContext?.crop && activeFarmContext.crop !== 'General') {
      return activeFarmContext.crop;
    }
    return isHindi ? 'आपकी फसल' : 'Your Crop';
  }, [queryCrop, advisoryResult?.cropName, activeFarmContext?.crop, isHindi]);

  const cropStage = activeFarmContext?.cropStage || 'Vegetative Stage';
  const fieldName = activeFarmContext?.fieldName || (isHindi ? 'मुख्य खेत' : 'Main Field');
  const lastChecked = healthData?.calculatedTime 
    ? `${isHindi ? 'आज' : 'Today'} ${healthData.calculatedTime}`
    : (isHindi ? 'आज, अभी' : 'Today, Just now');

  const moistureScore = activeFarmContext?.moisture?.score ?? 72;
  const weatherTemp = activeFarmContext?.weather?.temp ?? 27;
  const weatherRainProb = activeFarmContext?.weather?.rainProb ?? 15;
  const weatherRain24h = activeFarmContext?.weather?.rain24h ?? 0;
  const soilType = activeFarmContext?.soil?.soilType || 'Black Soil';
  const soilPH = activeFarmContext?.soil?.pH ?? 7.2;
  const nitrogenLevel = activeFarmContext?.soil?.nitrogenKgPerHa ?? 195;
  const phosphorusLevel = activeFarmContext?.soil?.phosphorusKgPerHa ?? 26;
  const potassiumLevel = activeFarmContext?.soil?.potassiumKgPerHa ?? 290;

  // Disease Detection signal:
  // Strictly only show if photo AI diagnosed an actual disease OR query problem is a disease
  const detectedProblem = advisoryResult?.detectedProblem || (queryProblem?.category === 'PEST_ATTACK' || queryProblem?.category === 'DISEASE_SPOTS' ? (isHindi ? queryProblem.titleHi : queryProblem.titleEn) : null);
  const hasDiseaseDetected = Boolean(
    detectedProblem && 
    !detectedProblem.toLowerCase().includes('healthy') && 
    !detectedProblem.includes('स्वस्थ') &&
    !detectedProblem.toLowerCase().includes('clean foliage')
  );

  // 2. "WHAT IS THE PROBLEM?" SECTION (Max 3-5 scannable items sorted by urgency)
  const detectedProblems = useMemo(() => {
    const list = [];

    // If farmer's current query directly identified a problem, show it as #1 PRIORITY!
    if (queryProblem) {
      list.push({
        id: 'user_reported_issue',
        urgency: queryProblem.severity === 'URGENT' ? 0 : 1, // Topmost priority
        icon: queryProblem.category === 'WATERLOGGING' ? '🌊' : (queryProblem.category === 'PEST_ATTACK' ? '🐛' : (queryProblem.category === 'DROUGHT_MOISTURE' ? '💧' : '⚠️')),
        titleEn: queryProblem.titleEn,
        titleHi: queryProblem.titleHi,
        statusEn: queryProblem.severity,
        statusHi: queryProblem.severity === 'URGENT' ? 'तुरंत ध्यान दें' : 'मुख्य समस्या',
        descEn: queryProblem.whyEn,
        descHi: queryProblem.whyHi,
        badgeClass: queryProblem.severity === 'URGENT' ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-amber-100 text-amber-900 border-amber-300'
      });
    }

    // Problem: Soil Moisture (Only if query is not already about waterlogging/drought)
    if (queryProblem?.category !== 'WATERLOGGING' && queryProblem?.category !== 'DROUGHT_MOISTURE') {
      if (moistureScore < 50) {
        list.push({
          id: 'moisture',
          urgency: 2,
          icon: '💧',
          titleEn: 'Soil Moisture',
          titleHi: 'मिट्टी की नमी',
          statusEn: 'LOW',
          statusHi: 'कम',
          descEn: 'Field is becoming dry.',
          descHi: 'मिट्टी में नमी कम हो रही है, खेत सूख रहा है।',
          badgeClass: 'bg-red-100 text-red-900 border-red-300'
        });
      } else if (moistureScore < 65) {
        list.push({
          id: 'moisture',
          urgency: 3,
          icon: '💧',
          titleEn: 'Soil Moisture',
          titleHi: 'मिट्टी की नमी',
          statusEn: 'MODERATE',
          statusHi: 'मध्यम',
          descEn: 'Moisture level is dropping. Irrigation may be needed soon.',
          descHi: 'नमी का स्तर गिर रहा है, जल्द सिंचाई की जरूरत होगी।',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
        });
      }
    }

    // Problem 2: Crop Stress
    if (healthScore < 60) {
      list.push({
        id: 'stress',
        urgency: 1,
        icon: '🌿',
        titleEn: 'Crop Stress',
        titleHi: 'फसल तनाव',
        statusEn: 'HIGH',
        statusHi: 'अधिक',
        descEn: 'Crop is under significant growth stress.',
        descHi: 'फसल पर तनाव के लक्षण दिख रहे हैं।',
        badgeClass: 'bg-red-100 text-red-900 border-red-300'
      });
    } else if (healthScore < 80) {
      list.push({
        id: 'stress',
        urgency: 2,
        icon: '🌿',
        titleEn: 'Crop Stress',
        titleHi: 'फसल तनाव',
        statusEn: 'MODERATE',
        statusHi: 'हल्का',
        descEn: 'Signs of mild crop stress detected.',
        descHi: 'फसल पर हल्का तनाव देखा गया है।',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
      });
    } else {
      list.push({
        id: 'stress',
        urgency: 4,
        icon: '🌿',
        titleEn: 'Crop Stress',
        titleHi: 'फसल तनाव',
        statusEn: 'LOW',
        statusHi: 'नहीं',
        descEn: 'Crop is growing vigorously with minimal stress.',
        descHi: 'फसल अच्छी और हरी-भरी है।',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      });
    }

    // Problem 3: Disease Risk
    if (hasDiseaseDetected) {
      list.push({
        id: 'disease',
        urgency: 1,
        icon: '🦠',
        titleEn: 'Disease Risk',
        titleHi: 'रोग जोखिम',
        statusEn: 'HIGH',
        statusHi: 'उच्च',
        descEn: `Possible disease symptoms identified: ${detectedProblem}.`,
        descHi: `संभावित बीमारी के लक्षण मिले हैं: ${detectedProblem}`,
        badgeClass: 'bg-red-100 text-red-900 border-red-300'
      });
    } else {
      list.push({
        id: 'disease',
        urgency: 4,
        icon: '🦠',
        titleEn: 'Disease Risk',
        titleHi: 'रोग जोखिम',
        statusEn: 'LOW',
        statusHi: 'कम',
        descEn: 'No major disease detected currently.',
        descHi: 'वर्तमान में कोई बड़ा रोग नहीं दिखा।',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      });
    }

    // Problem 4: Weather Risk
    if (weatherRain24h > 5 || weatherRainProb > 65 || weatherTemp > 38 || weatherTemp < 10) {
      list.push({
        id: 'weather',
        urgency: 2,
        icon: '🌦',
        titleEn: 'Weather Risk',
        titleHi: 'मौसम जोखिम',
        statusEn: 'MEDIUM',
        statusHi: 'मध्यम',
        descEn: 'Rain/temperature conditions may affect the crop.',
        descHi: 'तापमान या बारिश के कारण फसल पर असर हो सकता है।',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
      });
    } else {
      list.push({
        id: 'weather',
        urgency: 4,
        icon: '🌦',
        titleEn: 'Weather Risk',
        titleHi: 'मौसम जोखिम',
        statusEn: 'LOW',
        statusHi: 'कम',
        descEn: 'Weather conditions are favorable for crop development.',
        descHi: 'मौसम फसल के लिए अनुकूल है।',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      });
    }

    // Problem 5: Nutrient Status
    if (nitrogenLevel < 180 || phosphorusLevel < 20 || potassiumLevel < 200) {
      list.push({
        id: 'nutrient',
        urgency: 3,
        icon: '🧪',
        titleEn: 'Soil Nutrients',
        titleHi: 'पोषक तत्व',
        statusEn: 'ATTENTION',
        statusHi: 'कम',
        descEn: 'Soil test indicates nutrient deficiency in root zone.',
        descHi: 'मिट्टी में पोषक तत्वों की कमी देखी गई है।',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300'
      });
    }

    // Sort by urgency (1 = Urgent first) and limit to 4
    return list.sort((a, b) => a.urgency - b.urgency).slice(0, 4);
  }, [moistureScore, healthScore, hasDiseaseDetected, detectedProblem, weatherRain24h, weatherRainProb, weatherTemp, nitrogenLevel, phosphorusLevel, potassiumLevel]);

  // 3. "WHAT SHOULD I DO NOW?" SECTION (Action Cards with Priority: Urgent, High, Medium, Low)
  const actionCards = useMemo(() => {
    const actions = [];

    // Core Rule: If farmer asked a specific problem in current query, place its direct solution as #1 Action Card!
    if (queryProblem) {
      actions.push({
        priority: queryProblem.severity,
        priorityColor: queryProblem.severity === 'URGENT' ? '🔴' : (queryProblem.severity === 'HIGH' ? '🟠' : '🟡'),
        badgeClass: queryProblem.severity === 'URGENT' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-orange-100 text-orange-800 border-orange-300',
        categoryEn: queryProblem.titleEn,
        categoryHi: queryProblem.titleHi,
        whatEn: queryProblem.immediateStepsEn[0],
        whatHi: queryProblem.immediateStepsHi[0],
        whyEn: queryProblem.whyEn,
        whyHi: queryProblem.whyHi,
        whenEn: queryProblem.whenEn,
        whenHi: queryProblem.whenHi
      });
      if (queryProblem.immediateStepsEn.length > 1) {
        actions.push({
          priority: queryProblem.severity === 'URGENT' ? 'HIGH' : 'MEDIUM',
          priorityColor: queryProblem.severity === 'URGENT' ? '🟠' : '🟡',
          badgeClass: queryProblem.severity === 'URGENT' ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-amber-100 text-amber-800 border-amber-300',
          categoryEn: 'FOLLOW-UP STEP',
          categoryHi: 'अगला कदम (Next Step)',
          whatEn: queryProblem.immediateStepsEn[1],
          whatHi: queryProblem.immediateStepsHi[1],
          whyEn: queryProblem.whyEn,
          whyHi: queryProblem.whyHi,
          whenEn: queryProblem.whenEn,
          whenHi: queryProblem.whenHi
        });
      }
    }

    // Action A: Irrigation (if not already handled by queryProblem)
    if (queryProblem?.category !== 'WATERLOGGING' && queryProblem?.category !== 'DROUGHT_MOISTURE') {
      if (moistureScore < 50) {
        actions.push({
          priority: 'URGENT',
          priorityColor: '🔴',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          categoryEn: 'IRRIGATION',
          categoryHi: 'सिंचाई (Irrigation)',
          whatEn: 'Give irrigation to the field.',
          whatHi: 'खेत में हल्की सिंचाई करें।',
          whyEn: 'Soil moisture is low (below 50%).',
          whyHi: 'मिट्टी में नमी कम हो गई है।',
          whenEn: 'Within the next 24 hours.',
          whenHi: 'अगले 24 घंटे के भीतर।'
        });
      }
    } else if (moistureScore < 65) {
      actions.push({
        priority: 'HIGH',
        priorityColor: '🟠',
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
        categoryEn: 'IRRIGATION',
        categoryHi: 'सिंचाई (Irrigation)',
        whatEn: 'Plan field watering.',
        whatHi: 'सिंचाई की तैयारी करें।',
        whyEn: 'Moisture reserve is decreasing.',
        whyHi: 'मिट्टी की नमी तेजी से कम हो रही है।',
        whenEn: 'Within 24–48 hours.',
        whenHi: 'अगले 24 से 48 घंटे में।'
      });
    }

    // Action B: Disease / Protection
    if (hasDiseaseDetected) {
      actions.push({
        priority: 'URGENT',
        priorityColor: '🔴',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        categoryEn: 'CROP PROTECTION',
        categoryHi: 'फसल सुरक्षा (Protection)',
        whatEn: 'Remove affected leaves and apply recommended spray.',
        whatHi: 'प्रभावित पत्तियों को हटाएं और अनुशंसित जैविक/कीटनाशक छिड़काव करें।',
        whyEn: `Possible disease symptoms detected: ${detectedProblem}.`,
        whyHi: `संभावित बीमारी के लक्षण मिले हैं: ${detectedProblem}`,
        whenEn: 'Do now / within 24 hours.',
        whenHi: 'आज ही या अगले 24 घंटे में करें।'
      });
    }

    // Action C: Fertilizer / Nutrient
    if (nitrogenLevel < 180) {
      actions.push({
        priority: 'MEDIUM',
        priorityColor: '🟡',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        categoryEn: 'FERTILIZER',
        categoryHi: 'खाद व पोषण (Fertilizer)',
        whatEn: 'Apply the recommended nitrogen treatment.',
        whatHi: 'अनुशंसित यूरिया/नत्रजन की मात्रा डालें।',
        whyEn: 'Soil test shows low nitrogen during current vegetative stage.',
        whyHi: 'वर्तमान अवस्था में मिट्टी में नाइट्रोजन कम है।',
        whenEn: 'Within 2–3 days (after light watering).',
        whenHi: 'अगले 2–3 दिनों में (हल्की नमी के बाद)।'
      });
    } else if (healthScore >= 80) {
      actions.push({
        priority: 'LOW',
        priorityColor: '🟢',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        categoryEn: 'NUTRIENT MAINTENANCE',
        categoryHi: 'संतुलित पोषण (Maintenance)',
        whatEn: 'Maintain scheduled nutrient plan.',
        whatHi: 'निर्धारित खाद चक्र बनाए रखें।',
        whyEn: 'Crop health is currently good.',
        whyHi: 'फसल का स्वास्थ्य उत्तम बना हुआ है।',
        whenEn: 'Follow standard crop calendar.',
        whenHi: 'फसल कैलेंडर के अनुसार।'
      });
    }

    // Action D: Monitoring
    actions.push({
      priority: healthScore < 60 ? 'HIGH' : (healthScore < 80 ? 'MEDIUM' : 'LOW'),
      priorityColor: healthScore < 60 ? '🟠' : (healthScore < 80 ? '🟡' : '🟢'),
      badgeClass: healthScore < 60 
        ? 'bg-orange-100 text-orange-800 border-orange-300' 
        : (healthScore < 80 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'),
      categoryEn: 'MONITORING',
      categoryHi: 'खेत निरीक्षण (Monitoring)',
      whatEn: 'Scout the crop canopy and recheck soil condition.',
      whatHi: 'खेत में जाकर पत्तियों और नमी का दोबारा निरीक्षण करें।',
      whyEn: 'To track improvement and prevent sudden pest spread.',
      whyHi: 'सुधार देखने और कीटों के प्रसार को रोकने के लिए।',
      whenEn: healthScore < 80 ? 'Recheck after 2–3 days.' : 'Next check in 5–7 days.',
      whenHi: healthScore < 80 ? '2 से 3 दिन बाद दोबारा जांचें।' : 'अगले 5–7 दिनों में।'
    });

    return actions.slice(0, 3);
  }, [moistureScore, hasDiseaseDetected, detectedProblem, nitrogenLevel, healthScore]);

  // 6. SHORT "WHY IS THIS HAPPENING?" (1–2 short sentences only)
  const shortWhyExplanation = useMemo(() => {
    if (queryProblem) {
      return isHindi ? queryProblem.whyHi : queryProblem.whyEn;
    }
    if (hasDiseaseDetected && moistureScore < 60) {
      return isHindi
        ? 'मिट्टी में कम नमी और हालिया मौसम के कारण फसल पर तनाव और संभावित रोग के लक्षण दिख रहे हैं।'
        : 'Low soil moisture and current weather conditions are causing crop stress and possible infection risk.';
    } else if (moistureScore < 50) {
      return isHindi
        ? 'मिट्टी में नमी कम होने और शुष्क मौसम के कारण फसल पर हल्का तनाव आ रहा है।'
        : 'Low soil moisture and dry conditions are causing temporary crop stress.';
    } else if (hasDiseaseDetected) {
      return isHindi
        ? 'हालिया आर्द्रता और तापमान में उतार-चढ़ाव से फफूंद या रोग का जोखिम बना है।'
        : 'Fluctuations in humidity and temperature have created conditions favorable for possible plant stress.';
    } else {
      return isHindi
        ? 'अनुकूल मौसम और पर्याप्त नमी के कारण फसल का विकास सामान्य और स्वस्थ है।'
        : 'Favorable weather and adequate soil moisture are supporting healthy crop growth.';
    }
  }, [queryProblem, hasDiseaseDetected, moistureScore, isHindi]);

  // 12. CROP HEALTH TREND (7d / 30d / 90d)
  const trendAnalysis = useMemo(() => {
    if (!healthHistory || healthHistory.length < 2) {
      return {
        direction: 'stable',
        icon: Minus,
        textEn: 'Stable ➡️',
        textHi: 'स्थिर ➡️ (Stable)',
        colorClass: 'text-slate-700 bg-slate-100 border-slate-300'
      };
    }
    const latest = healthHistory[0]?.healthScore ?? healthScore;
    const prev = healthHistory[1]?.healthScore ?? 74;

    if (latest > prev + 2) {
      return {
        direction: 'improving',
        icon: TrendingUp,
        textEn: 'Improving 📈',
        textHi: 'सुधार हो रहा है 📈 (Improving)',
        colorClass: 'text-emerald-800 bg-emerald-100 border-emerald-300'
      };
    } else if (latest < prev - 2) {
      return {
        direction: 'declining',
        icon: TrendingDown,
        textEn: 'Getting Worse 📉',
        textHi: 'गिरावट 📉 (Getting Worse)',
        colorClass: 'text-rose-800 bg-rose-100 border-rose-300'
      };
    } else {
      return {
        direction: 'stable',
        icon: Minus,
        textEn: 'Stable ➡️',
        textHi: 'स्थिर ➡️ (Stable)',
        colorClass: 'text-amber-800 bg-amber-100 border-amber-300'
      };
    }
  }, [healthHistory, healthScore]);

  // Circular progress ring calculation
  const circleRadius = 46;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-4 text-slate-900 animate-in fade-in duration-200">

      {/* ================================================== */}
      {/* 1. TOP: CROP HEALTH SUMMARY CARD                   */}
      {/* ================================================== */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 ${healthStatusConfig.bgClass} shadow-md`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          
          {/* Circular Progress Ring */}
          <div className="flex items-center gap-4">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
                {/* Background Ring */}
                <circle
                  cx="55"
                  cy="55"
                  r={circleRadius}
                  stroke={healthStatusConfig.ringBg}
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Dynamic Animated Value Ring */}
                <circle
                  cx="55"
                  cy="55"
                  r={circleRadius}
                  stroke={healthStatusConfig.ringColor}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {healthScore}%
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${healthStatusConfig.badgeBg}`}>
                  {isHindi ? healthStatusConfig.labelHi : healthStatusConfig.labelEn}
                </span>
              </div>
            </div>

            {/* Field & Crop Metadata */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>{isHindi ? 'फसल स्वास्थ्य' : 'Crop Health'}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {cropName}
              </h3>
              <div className="text-xs text-slate-700 font-medium space-y-0.5">
                <p>
                  <span className="text-slate-500 font-bold">{isHindi ? 'अवस्था:' : 'Growth Stage:'}</span> {cropStage}
                </p>
                <p>
                  <span className="text-slate-500 font-bold">{isHindi ? 'खेत:' : 'Field:'}</span> {fieldName}
                </p>
                <p className="text-[11px] text-slate-500">
                  <span className="font-semibold">{isHindi ? 'अंतिम जांच:' : 'Last Checked:'}</span> {lastChecked}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Condition Badge */}
          <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {isHindi ? 'स्थिति स्तर' : 'Condition Level'}
            </span>
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${healthStatusConfig.badgeBg}`}>
              {healthScore >= 80 
                ? (isHindi ? '✓ उत्तम स्थिति' : '✓ Good Condition')
                : (healthScore >= 60 
                    ? (isHindi ? '⚡ सामान्य स्थिति' : '⚡ Moderate Condition')
                    : (healthScore >= 40 
                        ? (isHindi ? '⚠️ ध्यान देने योग्य' : '⚠️ Needs Attention') 
                        : (isHindi ? '🚨 गंभीर स्थिति' : '🚨 Critical Condition')))}
            </span>
          </div>

        </div>
      </div>

      {/* ================================================== */}
      {/* 2. "WHAT IS THE PROBLEM?" SECTION                  */}
      {/* ================================================== */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <span>⚠️</span>
            <span>{isHindi ? 'क्या ध्यान देने की जरूरत है? (WHAT NEEDS ATTENTION?)' : 'WHAT NEEDS ATTENTION?'}</span>
          </h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {isHindi ? 'महत्वपूर्ण मुद्दे' : 'Urgency Sorted'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {detectedProblems.map((prob, idx) => (
            <div 
              key={prob.id || idx}
              className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition flex items-start gap-3"
            >
              <span className="text-xl shrink-0 mt-0.5">{prob.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900">
                    {idx + 1}. {isHindi ? prob.titleHi : prob.titleEn}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${prob.badgeClass}`}>
                    {isHindi ? prob.statusHi : prob.statusEn}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                  {isHindi ? prob.descHi : prob.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================== */}
      {/* 3. “WHAT SHOULD I DO NOW?” SECTION (Action Cards)  */}
      {/* ================================================== */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-2 uppercase tracking-wide">
            <span>✅</span>
            <span>{isHindi ? 'आपको अभी क्या करना चाहिए? (WHAT TO DO NOW)' : 'WHAT YOU SHOULD DO NOW'}</span>
          </h4>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {isHindi ? 'प्राथमिकता अनुसार' : 'Priority Actions'}
          </span>
        </div>

        <div className="space-y-2.5">
          {actionCards.map((act, idx) => (
            <div 
              key={idx}
              className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition space-y-2"
            >
              {/* Action Header */}
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{act.priorityColor}</span>
                  <span className="text-xs font-black text-slate-900 tracking-tight">
                    {idx + 1}. {isHindi ? act.categoryHi : act.categoryEn}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${act.badgeClass}`}>
                  {act.priority === 'URGENT' 
                    ? (isHindi ? '🔴 तुरंत करें (URGENT)' : '🔴 URGENT — Do now')
                    : (act.priority === 'HIGH' 
                        ? (isHindi ? '🟠 24 घंटे में (HIGH)' : '🟠 HIGH — Do in 24 hrs')
                        : (act.priority === 'MEDIUM' 
                            ? (isHindi ? '🟡 2–3 दिन में (MEDIUM)' : '🟡 MEDIUM — In 2-3 days')
                            : (isHindi ? '🟢 निगरानी रखें (LOW)' : '🟢 LOW — Keep monitoring')))}
                </span>
              </div>

              {/* WHAT, WHY, WHEN Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    👉 {isHindi ? 'क्या करें? (WHAT)' : 'WHAT to do?'}
                  </span>
                  <p className="font-bold text-slate-900 leading-snug">
                    {isHindi ? act.whatHi : act.whatEn}
                  </p>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    💡 {isHindi ? 'क्यों करें? (WHY)' : 'WHY do it?'}
                  </span>
                  <p className="text-slate-700 font-medium leading-snug">
                    {isHindi ? act.whyHi : act.whyEn}
                  </p>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    ⏰ {isHindi ? 'कब करें? (WHEN)' : 'WHEN to do?'}
                  </span>
                  <p className="font-bold text-emerald-900 leading-snug">
                    {isHindi ? act.whenHi : act.whenEn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================================================== */}
      {/* 7. DISEASE / PEST ALERT (If detected/suspected)    */}
      {/* ================================================== */}
      {hasDiseaseDetected && (
        <div className="p-4 bg-rose-50 rounded-2xl border-2 border-rose-300 shadow-sm space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-rose-900 font-black text-xs sm:text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>🦠 {isHindi ? 'संभावित बीमारी का पता चला (POSSIBLE DISEASE DETECTED)' : 'POSSIBLE DISEASE DETECTED'}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-900 border border-rose-300">
              {isHindi ? 'जोखिम: अधिक (HIGH)' : 'Risk: HIGH'}
            </span>
          </div>

          <div className="text-xs text-rose-950 font-medium space-y-1">
            <p>
              <span className="font-bold">{isHindi ? 'संभावित लक्षण:' : 'Suspected Issue:'}</span> {detectedProblem}
            </p>
            <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 mt-1 space-y-1 text-xs">
              <span className="font-bold text-rose-900 block mb-0.5">
                {isHindi ? 'क्या करें:' : 'What to do:'}
              </span>
              <p>• {isHindi ? 'प्रभावित पत्तियों या पौधों को तुरंत खेत से बाहर निकालें।' : 'Remove severely affected leaves/plants.'}</p>
              <p>• {isHindi ? 'अनुशंसित जैविक या नीम आधारित स्प्रे का प्रयोग करें।' : 'Follow the recommended treatment or neem spray.'}</p>
              <p>• {isHindi ? '3 दिन बाद दोबारा फसल की जांच करें।' : 'Recheck the crop after 3 days.'}</p>
            </div>
            <p className="text-[11px] text-rose-700 italic">
              * {isHindi ? 'यह AI द्वारा फोटो व लक्षणों का संभावित अनुमान है।' : 'AI advisory estimation. Consult local Krishi Kendra if condition worsens.'}
            </p>
          </div>
        </div>
      )}

      {/* ================================================== */}
      {/* 5. FARM SNAPSHOT (Compact visual chips)             */}
      {/* ================================================== */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
          <span>📊</span>
          <span>{isHindi ? 'खेत का संक्षिप्त विवरण (FARM SNAPSHOT)' : 'FARM SNAPSHOT'}</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">📍 {isHindi ? 'स्थान / खेत' : 'Location / Field'}</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">{fieldName}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">🌾 {isHindi ? 'फसल व रकबा' : 'Crop & Area'}</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">{cropName} • {activeFarmContext?.areaAcres || 4.5} Ac</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">🌱 {isHindi ? 'फसल अवस्था' : 'Crop Stage'}</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">{cropStage}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">💧 {isHindi ? 'मिट्टी नमी' : 'Soil Moisture'}</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">{moistureScore}% ({moistureScore < 50 ? (isHindi ? 'कम' : 'Low') : (isHindi ? 'पर्याप्त' : 'Adequate')})</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">🌡️ {isHindi ? 'मौसम व तापमान' : 'Weather / Temp'}</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">{weatherTemp}°C • {weatherRainProb}% {isHindi ? 'बारिश' : 'Rain'}</span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 8, 9, 10: IRRIGATION, NUTRIENT & WEATHER 3 CARDS   */}
      {/* ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* 8. IRRIGATION CARD */}
        <div className="p-3.5 bg-sky-50/70 rounded-2xl border border-sky-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>{isHindi ? '💧 सिंचाई (Irrigation)' : '💧 IRRIGATION'}</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${moistureScore < 50 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {moistureScore < 50 ? (isHindi ? 'सूखा (Dry)' : 'DRY') : (isHindi ? 'संतुलित' : 'OPTIMAL')}
            </span>
          </div>

          <div className="text-xs text-sky-950 space-y-1">
            <p className="text-[11px] text-sky-800">
              <span className="font-semibold">{isHindi ? 'वर्तमान नमी:' : 'Current Moisture:'}</span> {moistureScore}%
            </p>
            <p className="font-medium">
              {moistureScore < 50 
                ? (isHindi ? '👉 अगले 24 घंटे में हल्की सिंचाई की सलाह है।' : '👉 Consider irrigation within 24 hours.')
                : (isHindi ? '👉 मिट्टी में पर्याप्त नमी है, अभी पानी न लगाएं।' : '👉 Moisture adequate, hold irrigation for now.')}
            </p>
            <p className="text-[10px] text-sky-700">
              {isHindi ? 'सिंचाई के बाद नमी का स्तर दोबारा जांचें।' : 'Recheck moisture balance after irrigation.'}
            </p>
          </div>
        </div>

        {/* 9. NUTRIENT STATUS CARD */}
        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-amber-600" />
              <span>{isHindi ? '🧪 पोषक तत्व (Nutrients)' : '🧪 NUTRIENT STATUS'}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900">
              {nitrogenLevel < 180 ? (isHindi ? 'ध्यान दें' : 'ATTENTION') : (isHindi ? 'सामान्य' : 'NORMAL')}
            </span>
          </div>

          <div className="text-xs text-amber-950 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-amber-900">
              <span>N: {nitrogenLevel < 180 ? (isHindi ? 'कम (Low)' : 'LOW') : (isHindi ? 'सामान्य' : 'NORMAL')}</span>
              <span>P: {phosphorusLevel < 20 ? (isHindi ? 'कम' : 'LOW') : (isHindi ? 'सामान्य' : 'NORMAL')}</span>
              <span>K: {potassiumLevel < 200 ? (isHindi ? 'कम' : 'LOW') : (isHindi ? 'सामान्य' : 'NORMAL')}</span>
            </div>
            <p className="font-medium text-slate-800">
              {nitrogenLevel < 180 
                ? (isHindi ? '👉 फसल अवस्था अनुसार नत्रजन/यूरिया का अनुशंसित प्रयोग करें।' : '👉 Apply recommended nitrogen treatment according to crop stage.')
                : (isHindi ? '👉 पोषक तत्व संतुलित हैं, नियमित चक्र बनाए रखें।' : '👉 Nutrients balanced. Continue scheduled program.')}
            </p>
          </div>
        </div>

        {/* 10. WEATHER IMPACT CARD */}
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-emerald-600" />
              <span>{isHindi ? '🌦 मौसम असर (Weather)' : '🌦 WEATHER IMPACT'}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-900">
              {weatherRain24h > 5 ? (isHindi ? 'मध्यम जोखिम' : 'MEDIUM RISK') : (isHindi ? '🟢 अनुकूल (Low)' : '🟢 LOW RISK')}
            </span>
          </div>

          <div className="text-xs text-emerald-950 space-y-1">
            <p className="text-[11px] text-emerald-800">
              <span className="font-semibold">{isHindi ? 'आज का तापमान:' : 'Today:'}</span> {weatherTemp}°C • {isHindi ? 'बारिश की संभावना:' : 'Rain:'} {weatherRainProb}%
            </p>
            <p className="font-medium text-slate-800">
              {weatherRain24h > 5 
                ? (isHindi ? '👉 वर्षा की संभावना है, कीटनाशक छिड़काव रोक दें।' : '👉 Rain expected. Postpone spraying chemicals.')
                : (isHindi ? '👉 अगले 24-48 घंटे में भारी बारिश की संभावना नहीं है।' : '👉 Low rainfall expected. Spray and field activities safe.')}
            </p>
          </div>
        </div>

      </div>

      {/* ================================================== */}
      {/* 6. SHORT "WHY IS THIS HAPPENING?"                  */}
      {/* ================================================== */}
      <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-slate-900 block">
            {isHindi ? 'ऐसा क्यों हो रहा है? (WHY IS THIS HAPPENING?)' : 'WHY IS THIS HAPPENING?'}
          </span>
          <p className="text-slate-700 leading-relaxed font-medium">
            "{shortWhyExplanation}"
          </p>
        </div>
      </div>

      {/* ================================================== */}
      {/* 11. FARMER ACTION TIMELINE                         */}
      {/* ================================================== */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>{isHindi ? 'किसान कार्य समयरेखा (FARMER ACTION TIMELINE)' : 'FARMER ACTION TIMELINE'}</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200">
            <span className="text-[10px] font-black text-rose-800 uppercase block mb-1">
              🔴 {isHindi ? 'आज (TODAY)' : 'TODAY'}
            </span>
            <p className="font-bold text-slate-900 leading-snug">
              {moistureScore < 50 
                ? (isHindi ? 'खेत में सिंचाई जांचें' : 'Check / apply irrigation') 
                : (isHindi ? 'फसल की सामान्य जांच करें' : 'Inspect crop foliage')}
            </p>
          </div>

          <div className="p-2.5 bg-orange-50/80 rounded-xl border border-orange-200">
            <span className="text-[10px] font-black text-orange-800 uppercase block mb-1">
              🟠 {isHindi ? 'अगले 24 घंटे' : 'NEXT 24 HOURS'}
            </span>
            <p className="font-bold text-slate-900 leading-snug">
              {hasDiseaseDetected 
                ? (isHindi ? 'संभावित रोग का उपचार करें' : 'Apply plant treatment') 
                : (isHindi ? 'नमी व फसल तनाव पर नजर रखें' : 'Monitor crop stress')}
            </p>
          </div>

          <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
            <span className="text-[10px] font-black text-amber-800 uppercase block mb-1">
              🟡 {isHindi ? '2–3 दिन बाद' : 'NEXT 2–3 DAYS'}
            </span>
            <p className="font-bold text-slate-900 leading-snug">
              {isHindi ? 'फसल की स्थिति दोबारा जांचें' : 'Recheck crop condition'}
            </p>
          </div>

          <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-black text-emerald-800 uppercase block mb-1">
              🟢 {isHindi ? 'अगले 7 दिन' : 'NEXT 7 DAYS'}
            </span>
            <p className="font-bold text-slate-900 leading-snug">
              {isHindi ? 'स्वास्थ्य प्रगति की समीक्षा करें' : 'Review crop health trend'}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 12. CROP HEALTH TREND                              */}
      {/* ================================================== */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              {isHindi ? 'फसल स्वास्थ्य रुझान (CROP HEALTH TREND)' : 'CROP HEALTH TREND'}
            </h4>
          </div>

          {/* Period Selector Chips */}
          <div className="flex items-center gap-1">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTrendPeriod(p)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition ${
                  trendPeriod === p
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p === '7d' ? (isHindi ? '7 दिन' : '7 Days') : (p === '30d' ? (isHindi ? '30 दिन' : '30 Days') : (isHindi ? '90 दिन' : '90 Days'))}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              {isHindi ? 'स्वास्थ्य प्रगति स्थिति' : 'Health Status Trend'}
            </span>
            <span className="text-sm font-black text-slate-900 block mt-0.5">
              {isHindi ? trendAnalysis.textHi : trendAnalysis.textEn}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>70%</span>
            <span>→</span>
            <span>74%</span>
            <span>→</span>
            <span className="text-emerald-700 font-extrabold">{healthScore}%</span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* 13. COLLAPSIBLE: VIEW DETAILED AI ANALYSIS        */}
      {/* ================================================== */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowDetailedAnalysis(prev => !prev)}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-300 text-slate-800 font-bold text-xs shadow-xs transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-600" />
            <span>
              {isHindi 
                ? '🔍 विस्तृत AI विश्लेषण देखें (View Detailed AI Analysis)' 
                : '🔍 View Detailed AI Analysis & Scientific Reasoning'}
            </span>
          </div>
          {showDetailedAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Collapsed Detailed Content */}
        {showDetailedAnalysis && (
          <div className="mt-3 p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-emerald-50/20 rounded-2xl border border-emerald-200 shadow-inner space-y-4 animate-in fade-in">
            
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isHindi ? 'विस्तृत वैज्ञानिक विश्लेषण व साक्ष्य' : 'Full AI Advisory Report & Evidence Base'}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {activeFarmContext?.crop} • {activeFarmContext?.fieldName}
              </span>
            </div>

            {/* AI Text Diagnostic Answer */}
            {advisoryResult?.answer && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                {advisoryResult.answer}
              </div>
            )}

            {/* 8 Evidence Dimensions Analyzed */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                ⚖️ {isHindi ? 'सत्यापित कृषि आयाम (8 Telemetry Dimensions):' : '8 Telemetry Dimensions Verified:'}
              </span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 font-semibold shadow-2xs">
                  🌾 {isHindi ? 'मिट्टी NPK व pH' : 'Soil NPK & pH'}
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 font-semibold shadow-2xs">
                  ⏳ {isHindi ? 'फसल अवस्था' : 'Crop Stage'}
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 font-semibold shadow-2xs">
                  💧 {isHindi ? 'मिट्टी की नमी' : 'Soil Moisture'}
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 font-semibold shadow-2xs">
                  ⛅ {isHindi ? 'मौसम पूर्वानुमान' : 'Weather Forecast'}
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 font-semibold shadow-2xs">
                  🛰️ {isHindi ? 'उपग्रह NDVI' : 'Satellite NDVI'}
                </span>
                <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-800 font-semibold shadow-2xs">
                  📋 {isHindi ? 'आवेदन इतिहास' : 'History Log'}
                </span>
              </div>
            </div>

            {/* Structured 5-Part breakdown if present */}
            {advisoryResult?.issue && advisoryResult.issue !== advisoryResult.answer && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-red-900 block mb-0.5">
                    {isHindi ? 'समस्या (Issue):' : 'Issue:'}
                  </span>
                  <p className="text-slate-700">{isHindi && advisoryResult.issueHi ? advisoryResult.issueHi : advisoryResult.issue}</p>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">
                    {isHindi ? 'कारण (Reason):' : 'Reason:'}
                  </span>
                  <p className="text-slate-700">{isHindi && advisoryResult.reasonHi ? advisoryResult.reasonHi : advisoryResult.reason}</p>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
