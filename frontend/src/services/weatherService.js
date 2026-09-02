/**
 * Open-Meteo Free Weather Service for Krishi Drishti
 * Direct client-side integration with no API key required.
 * Endpoint: https://api.open-meteo.com/v1/forecast
 */
import axios from 'axios';

// WMO Weather Interpretation Codes (WW)
const WMO_CODES = {
  0: { en: 'Clear Sky', hi: 'साफ़ आसमान', icon: 'Sun' },
  1: { en: 'Mainly Clear', hi: 'मुख्यतः साफ़', icon: 'Sun' },
  2: { en: 'Partly Cloudy', hi: 'आंशिक बादल', icon: 'CloudSun' },
  3: { en: 'Overcast', hi: 'घने बादल', icon: 'Cloud' },
  45: { en: 'Foggy', hi: 'कोहरा', icon: 'CloudFog' },
  48: { en: 'Depositing Rime Fog', hi: 'सफेद कोहरा', icon: 'CloudFog' },
  51: { en: 'Light Drizzle', hi: 'हल्की बूंदाबांदी', icon: 'CloudDrizzle' },
  53: { en: 'Moderate Drizzle', hi: 'मध्यम बूंदाबांदी', icon: 'CloudDrizzle' },
  55: { en: 'Dense Drizzle', hi: 'तेज़ बूंदाबांदी', icon: 'CloudDrizzle' },
  61: { en: 'Slight Rain', hi: 'हल्की बारिश', icon: 'CloudRain' },
  63: { en: 'Moderate Rain', hi: 'मध्यम बारिश', icon: 'CloudRain' },
  65: { en: 'Heavy Rain', hi: 'भारी बारिश', icon: 'CloudRain' },
  71: { en: 'Slight Snow', hi: 'हल्की बर्फबारी', icon: 'CloudSnow' },
  73: { en: 'Moderate Snow', hi: 'मध्यम बर्फबारी', icon: 'CloudSnow' },
  75: { en: 'Heavy Snow', hi: 'भारी बर्फबारी', icon: 'CloudSnow' },
  80: { en: 'Rain Showers', hi: 'बारिश की बौछारें', icon: 'CloudRain' },
  81: { en: 'Moderate Showers', hi: 'मध्यम बौछारें', icon: 'CloudRain' },
  82: { en: 'Violent Showers', hi: 'तूफानी बौछारें', icon: 'CloudRain' },
  95: { en: 'Thunderstorm', hi: 'गरज के साथ आंधी', icon: 'CloudLightning' },
  96: { en: 'Thunderstorm with Hail', hi: 'ओलावृष्टि के साथ तूफान', icon: 'CloudLightning' },
  99: { en: 'Severe Thunderstorm', hi: 'भीषण ओलावृष्टि', icon: 'CloudLightning' },
};

export function decodeWmoCode(code) {
  return WMO_CODES[code] || { en: 'Partly Cloudy', hi: 'आंशिक बादल', icon: 'CloudSun' };
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_OF_WEEK_HI = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

/**
 * Fetch live weather from Open-Meteo
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} locationName - Name of village/city
 */
export async function fetchOpenMeteoWeather(
  lat = 20.00, 
  lon = 73.78, 
  locationName = 'Nashik, Maharashtra'
) {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast';
    const params = {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      timezone: 'auto',
    };

    const res = await axios.get(url, { params, timeout: 8000 });
    const { current, daily } = res.data;

    const currentCondition = decodeWmoCode(current.weather_code);
    const rainProb = daily.precipitation_probability_max?.[0] ?? Math.round((current.precipitation || 0) > 0 ? 80 : 15);

    // Build 5-day agro-forecast
    const forecast = [];
    const dates = daily.time || [];
    const today = new Date();

    for (let i = 0; i < Math.min(dates.length, 5); i++) {
      const d = new Date(dates[i]);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS_OF_WEEK[d.getDay()];
      const dayNameHi = i === 0 ? 'आज' : i === 1 ? 'कल' : DAYS_OF_WEEK_HI[d.getDay()];
      const cond = decodeWmoCode(daily.weather_code?.[i]);

      forecast.push({
        day: dayName,
        dayHi: dayNameHi,
        date: dates[i],
        maxTemp: Math.round(daily.temperature_2m_max?.[i] ?? (current.temperature_2m + 2)),
        minTemp: Math.round(daily.temperature_2m_min?.[i] ?? (current.temperature_2m - 6)),
        condition: cond.en,
        conditionHi: cond.hi,
        rainChance: daily.precipitation_probability_max?.[i] ?? (i % 2 === 0 ? 30 : 10),
        windSpeed: Math.round(daily.wind_speed_10m_max?.[i] ?? current.wind_speed_10m),
        humidity: current.relative_humidity_2m,
        icon: cond.icon,
      });
    }

    // Build real-time smart farming alerts based on live meteorological data
    const smartAlerts = [];
    const tomorrowRain = forecast[1]?.rainChance || 0;
    const currentTemp = Math.round(current.temperature_2m);
    const windSpeed = Math.round(current.wind_speed_10m);

    if (tomorrowRain >= 50 || rainProb >= 60) {
      smartAlerts.push({
        title: `Rain Forecast (${tomorrowRain}% Probability)`,
        titleHi: `बारिश का पूर्वानुमान (${tomorrowRain}% संभावना)`,
        message: `High chance of precipitation in the next 24-48 hours. Postpone foliar chemical spraying to prevent wash-off and pause scheduled drip irrigation.`,
        messageHi: `अगले 24-48 घंटों में बारिश की संभावना है। कीटनाशक व फफूंदनाशक छिड़काव टालें और सिंचाई रोकें।`,
        priority: 'high',
        category: 'weather',
      });
    }

    if (currentTemp >= 35) {
      smartAlerts.push({
        title: `High Temperature Advisory (${currentTemp}°C)`,
        titleHi: `उच्च तापमान चेतावनी (${currentTemp}°C)`,
        message: `Thermal heat stress detected. Provide light morning irrigation or mulch beds to protect flower retention and root zone moisture.`,
        messageHi: `गर्मी का तनाव। फूलों को झड़ने से बचाने के लिए सुबह हल्की सिंचाई करें।`,
        priority: 'medium',
        category: 'irrigation',
      });
    } else if (windSpeed <= 14 && rainProb < 35) {
      smartAlerts.push({
        title: 'Ideal Spraying Window Open',
        titleHi: 'कीटनाशक व खाद छिड़काव हेतु अनुकूल समय',
        message: `Calm winds (${windSpeed} km/h) and optimal humidity (${current.relative_humidity_2m}%). Excellent window for foliar fertilizer and bio-protectant application.`,
        messageHi: `हवा की गति शांत (${windSpeed} km/h) और नमी अनुकूल है। पत्तों पर खाद व दवा छिड़काव का उत्तम समय।`,
        priority: 'low',
        category: 'fertilizer',
      });
    }

    const payload = {
      location: locationName,
      latitude: lat,
      longitude: lon,
      isLive: true,
      provider: 'Open-Meteo Free API',
      current: {
        temp: currentTemp,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        rainProbability: rainProb,
        windSpeed: windSpeed,
        condition: currentCondition.en,
        conditionHi: currentCondition.hi,
        weatherCode: current.weather_code,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      forecast,
      smartAlerts,
    };

    // Cache locally for instant loading
    try {
      localStorage.setItem('krishi_cached_weather', JSON.stringify(payload));
    } catch (_) {}

    return payload;
  } catch (error) {
    console.warn('Open-Meteo fetch failed, falling back to cached/safe weather:', error.message);
    const cached = localStorage.getItem('krishi_cached_weather');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }
    throw error;
  }
}
