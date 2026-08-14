export interface AdvisoryItem {
  id: string;
  category: string;
  severity: "danger" | "warning" | "info" | "success";
  title: string;
  description: string;
  action: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  rainfallMm: number;
  description: string;
  icon: string;
  mainCondition: string;
  locationName: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  rainfallMm: number;
  mainCondition: string;
  description: string;
  icon: string;
  advisories: AdvisoryItem[];
}

export interface WeatherResponse {
  location: {
    district: string;
    state?: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: CurrentWeather;
  forecast: DailyForecast[];
  advisories: AdvisoryItem[];
  provider: "OpenWeatherMap" | "Location-Aware Engine";
}

// Evaluate farming advisory rules against weather metrics
export function evaluateCropAdvisories(
  tempMax: number,
  tempMin: number,
  humidity: number,
  windSpeed: number,
  rainfallMm: number
): AdvisoryItem[] {
  const advisories: AdvisoryItem[] = [];

  // Rule 1: Heavy Rainfall Alert (> 20mm forecast)
  if (rainfallMm > 20) {
    advisories.push({
      id: "heavy-rain",
      category: "Pesticide & Spraying",
      severity: "warning",
      title: "Avoid Pesticide & Fertilizer Application",
      description: `Forecast predicts heavy rainfall (${rainfallMm}mm). Applied chemicals will wash off, wasting inputs and polluting runoff.`,
      action: "Postpone spraying or top-dressing fertilizer until rain subsides.",
    });
  } else if (rainfallMm > 5) {
    advisories.push({
      id: "moderate-rain",
      category: "Irrigation Management",
      severity: "info",
      title: "Moderate Rain Expected",
      description: `Light to moderate rainfall (${rainfallMm}mm) expected. You can pause scheduled irrigation.`,
      action: "Monitor soil moisture levels before watering.",
    });
  }

  // Rule 2: Frost Warning (Min temp < 5°C)
  if (tempMin < 5) {
    advisories.push({
      id: "frost-warning",
      category: "Frost & Seedling Care",
      severity: "danger",
      title: "Protect Seedlings from Frost Night",
      description: `Low temperatures drop to ${tempMin}°C. High risk of frost damaging young nursery seedlings and sensitive flowers.`,
      action: "Cover nursery beds with plastic mulch/straw netting and irrigate lightly in the evening.",
    });
  }

  // Rule 3: Fungal Disease Risk (Humidity > 85%)
  if (humidity > 85) {
    advisories.push({
      id: "fungal-risk",
      category: "Crop Health & Protection",
      severity: "warning",
      title: "High Risk of Fungal Disease",
      description: `High relative humidity (${humidity}%) promotes rapid spore germination of blight, rust, and downy mildew.`,
      action: "Inspect crop leaves closely for leaf spots and ensure adequate field drainage.",
    });
  }

  // Rule 4: Extreme Heatwave (Max temp > 38°C)
  if (tempMax > 38) {
    advisories.push({
      id: "heatwave-warning",
      category: "Heatwave Alert",
      severity: "danger",
      title: "Extreme Heat Warning for Crops",
      description: `Maximum temperatures will exceed ${tempMax}°C. High crop evapotranspiration and risk of heat stress.`,
      action: "Irrigate in early morning or late evening. Maintain soil moisture using mulching.",
    });
  }

  // Rule 5: High Wind Advisory (Wind speed > 25 km/h)
  if (windSpeed > 25) {
    advisories.push({
      id: "high-wind",
      category: "Field Operations",
      severity: "info",
      title: "High Wind Speed Advisory",
      description: `Strong winds (${windSpeed} km/h) will cause spray drift and potential lodging in tall crops.`,
      action: "Avoid foliar spraying and secure greenhouse structures and shade netting.",
    });
  }

  // Rule 6: Optimal Weather Condition
  if (advisories.length === 0) {
    advisories.push({
      id: "optimal-weather",
      category: "Harvest & Maintenance",
      severity: "success",
      title: "Optimal Weather for Farming Activities",
      description: `Favorable conditions (Temp: ${tempMin}°C - ${tempMax}°C, Humidity: ${humidity}%). Ideal for field operations.`,
      action: "Great conditions for harvesting, weeding, and crop inspection.",
    });
  }

  return advisories;
}

// Preset locations mapping for common agricultural hubs in India
const KNOWN_DISTRICTS: Record<string, { lat: number; lon: number; state: string }> = {
  pune: { lat: 18.5204, lon: 73.8567, state: "Maharashtra" },
  nashik: { lat: 19.9975, lon: 73.7898, state: "Maharashtra" },
  nagpur: { lat: 21.1458, lon: 79.0882, state: "Maharashtra" },
  ludhiana: { lat: 30.901, lon: 75.8573, state: "Punjab" },
  karnal: { lat: 29.6857, lon: 76.9905, state: "Haryana" },
  guntur: { lat: 16.3067, lon: 80.4365, state: "Andhra Pradesh" },
  patna: { lat: 25.5941, lon: 85.1376, state: "Bihar" },
  jaipur: { lat: 26.9124, lon: 75.7873, state: "Rajasthan" },
  bengaluru: { lat: 12.9716, lon: 77.5946, state: "Karnataka" },
  indore: { lat: 22.7196, lon: 75.8577, state: "Madhya Pradesh" },
  shimla: { lat: 31.1048, lon: 77.1734, state: "Himachal Pradesh" },
  varanasi: { lat: 25.3176, lon: 82.9739, state: "Uttar Pradesh" },
};

// Generates a realistic mock weather forecast when API keys are absent or requests fail
export function generateFallbackWeather(
  districtName: string,
  lat?: number,
  lon?: number
): WeatherResponse {
  const normKey = districtName.trim().toLowerCase();
  const districtInfo = KNOWN_DISTRICTS[normKey] || {
    lat: lat || 18.5204,
    lon: lon || 73.8567,
    state: "India",
  };

  const formattedDistrict =
    districtName.charAt(0).toUpperCase() + districtName.slice(1);

  const baseLat = lat || districtInfo.lat;
  const baseLon = lon || districtInfo.lon;

  // Use district string to deterministically vary weather values slightly
  const seed = normKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseTemp = 24 + (seed % 10);
  const baseHumidity = 55 + (seed % 35);
  const baseWind = 10 + (seed % 18);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  const forecast: DailyForecast[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dayName = i === 0 ? "Today" : dayNames[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];

    // Introduce realistic weather variation
    const daySeed = (seed + i * 13) % 100;
    const tempMax = Math.round(baseTemp + (daySeed % 7) - 2);
    const tempMin = Math.max(4, Math.round(tempMax - 8 - (daySeed % 4)));
    const humidity = Math.min(95, Math.max(35, baseHumidity + (daySeed % 20) - 10));
    const windSpeed = Math.round(baseWind + (daySeed % 12) - 5);

    let rainfallMm = 0;
    let mainCondition = "Clear";
    let description = "Clear sky";
    let icon = "01d";

    if (daySeed > 75) {
      rainfallMm = Math.round(15 + (daySeed % 18));
      mainCondition = "Rain";
      description = "Heavy rainfall";
      icon = "10d";
    } else if (daySeed > 55) {
      rainfallMm = Math.round(3 + (daySeed % 8));
      mainCondition = "Rain";
      description = "Light rain shower";
      icon = "09d";
    } else if (daySeed > 35) {
      mainCondition = "Clouds";
      description = "Scattered clouds";
      icon = "03d";
    }

    const dayAdvisories = evaluateCropAdvisories(
      tempMax,
      tempMin,
      humidity,
      windSpeed,
      rainfallMm
    );

    forecast.push({
      date: dateStr,
      dayName,
      tempMin,
      tempMax,
      humidity,
      windSpeed,
      rainProbability: rainfallMm > 0 ? Math.min(95, 40 + rainfallMm * 3) : 10,
      rainfallMm,
      mainCondition,
      description,
      icon,
      advisories: dayAdvisories,
    });
  }

  const todayForecast = forecast[0];
  const overallAdvisories = forecast.flatMap((f) => f.advisories);

  const uniqueAdvisories = Array.from(
    new Map(overallAdvisories.map((item) => [item.title, item])).values()
  );

  return {
    location: {
      district: formattedDistrict,
      state: districtInfo.state,
      country: "IN",
      lat: baseLat,
      lon: baseLon,
    },
    current: {
      temp: Math.round((todayForecast.tempMax + todayForecast.tempMin) / 2),
      feelsLike: Math.round((todayForecast.tempMax + todayForecast.tempMin) / 2 + 1),
      tempMin: todayForecast.tempMin,
      tempMax: todayForecast.tempMax,
      humidity: todayForecast.humidity,
      pressure: 1012,
      windSpeed: todayForecast.windSpeed,
      rainfallMm: todayForecast.rainfallMm,
      description: todayForecast.description,
      icon: todayForecast.icon,
      mainCondition: todayForecast.mainCondition,
      locationName: formattedDistrict,
    },
    forecast,
    advisories: uniqueAdvisories,
    provider: "Location-Aware Engine",
  };
}

export async function fetchWeatherFromOpenWeather(
  lat: number,
  lon: number,
  apiKey: string,
  districtOverride?: string
): Promise<WeatherResponse> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`OpenWeatherMap API error: ${res.statusText}`);
  }

  const data = (await res.json()) as any;
  const cityName = districtOverride || data.city?.name || "Local District";

  const dailyMap: Record<string, any[]> = {};

  for (const item of data.list || []) {
    const dateStr = item.dt_txt ? item.dt_txt.split(" ")[0] : new Date(item.dt * 1000).toISOString().split("T")[0];
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = [];
    }
    dailyMap[dateStr].push(item);
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const forecast: DailyForecast[] = [];
  const todayStr = new Date().toISOString().split("T")[0];

  Object.entries(dailyMap).slice(0, 7).forEach(([dateStr, blocks], idx) => {
    let tempMin = 100;
    let tempMax = -100;
    let humiditySum = 0;
    let windSpeedSum = 0;
    let rainfallMm = 0;

    for (const b of blocks) {
      if (b.main?.temp_min < tempMin) tempMin = b.main.temp_min;
      if (b.main?.temp_max > tempMax) tempMax = b.main.temp_max;
      humiditySum += b.main?.humidity || 50;
      windSpeedSum += b.wind?.speed || 2;
      if (b.rain && b.rain["3h"]) {
        rainfallMm += b.rain["3h"];
      }
    }

    const avgHumidity = Math.round(humiditySum / blocks.length);
    const avgWindSpeed = Math.round((windSpeedSum / blocks.length) * 3.6);
    const roundedMin = Math.round(tempMin);
    const roundedMax = Math.round(tempMax);
    const roundedRain = Math.round(rainfallMm);

    const dateObj = new Date(dateStr);
    const dayName = dateStr === todayStr ? "Today" : dayNames[dateObj.getDay()];

    const advisories = evaluateCropAdvisories(
      roundedMax,
      roundedMin,
      avgHumidity,
      avgWindSpeed,
      roundedRain
    );

    forecast.push({
      date: dateStr,
      dayName,
      tempMin: roundedMin,
      tempMax: roundedMax,
      humidity: avgHumidity,
      windSpeed: avgWindSpeed,
      rainProbability: roundedRain > 0 ? 80 : 15,
      rainfallMm: roundedRain,
      mainCondition: blocks[0]?.weather?.[0]?.main || "Clear",
      description: blocks[0]?.weather?.[0]?.description || "Clear sky",
      icon: blocks[0]?.weather?.[0]?.icon || "01d",
      advisories,
    });
  });

  const currentBlock = data.list?.[0] || {};
  const currentTemp = Math.round(currentBlock.main?.temp || 25);
  const feelsLike = Math.round(currentBlock.main?.feels_like || currentTemp);

  const overallAdvisories = forecast.flatMap((f) => f.advisories);
  const uniqueAdvisories = Array.from(
    new Map(overallAdvisories.map((item) => [item.title, item])).values()
  );

  return {
    location: {
      district: cityName,
      country: data.city?.country || "IN",
      lat,
      lon,
    },
    current: {
      temp: currentTemp,
      feelsLike,
      tempMin: forecast[0]?.tempMin || currentTemp - 4,
      tempMax: forecast[0]?.tempMax || currentTemp + 4,
      humidity: currentBlock.main?.humidity || 60,
      pressure: currentBlock.main?.pressure || 1013,
      windSpeed: Math.round((currentBlock.wind?.speed || 3) * 3.6),
      rainfallMm: forecast[0]?.rainfallMm || 0,
      description: currentBlock.weather?.[0]?.description || "Clear sky",
      icon: currentBlock.weather?.[0]?.icon || "01d",
      mainCondition: currentBlock.weather?.[0]?.main || "Clear",
      locationName: cityName,
    },
    forecast,
    advisories: uniqueAdvisories,
    provider: "OpenWeatherMap",
  };
}

export async function getWeatherForLocation(
  district?: string,
  lat?: number,
  lon?: number
): Promise<WeatherResponse> {
  const apiKey = process.env.OPENWEATHER_API_KEY || process.env.VITE_OPENWEATHER_API_KEY;

  let targetLat = lat;
  let targetLon = lon;
  let targetDistrict = district || "Pune";

  if (district && (!targetLat || !targetLon)) {
    const normKey = district.trim().toLowerCase();
    if (KNOWN_DISTRICTS[normKey]) {
      targetLat = KNOWN_DISTRICTS[normKey].lat;
      targetLon = KNOWN_DISTRICTS[normKey].lon;
    }
  }

  if (apiKey && targetLat !== undefined && targetLon !== undefined) {
    try {
      return await fetchWeatherFromOpenWeather(targetLat, targetLon, apiKey, targetDistrict);
    } catch (err) {
      console.warn("OpenWeatherMap fetch failed, falling back to location-aware weather engine:", err);
    }
  }

  return generateFallbackWeather(targetDistrict, targetLat, targetLon);
}
