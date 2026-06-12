import { z } from "zod";

// Schema for weather data
export const weatherDataSchema = z.object({
  location: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  temperature: z.number(),
  humidity: z.number().min(0).max(100),
  rainfall: z.number().min(0),
  windSpeed: z.number().min(0),
  condition: z.string(),
  forecast: z.array(
    z.object({
      date: z.string(),
      maxTemp: z.number(),
      minTemp: z.number(),
      rainfall: z.number(),
      condition: z.string(),
    })
  ),
  lastUpdated: z.date(),
  isMonsoonSeason: z.boolean().optional(),
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

// Regional weather standards
const REGIONAL_STANDARDS: Record<
  string,
  {
    temperatureRange: [number, number];
    humidityRange: [number, number];
    rainfallRange: [number, number];
  }
> = {
  NORTH: {
    temperatureRange: [5, 42],
    humidityRange: [30, 90],
    rainfallRange: [0, 150],
  },
  SOUTH: {
    temperatureRange: [18, 38],
    humidityRange: [40, 95],
    rainfallRange: [0, 200],
  },
  EAST: {
    temperatureRange: [10, 40],
    humidityRange: [50, 95],
    rainfallRange: [0, 250],
  },
  WEST: {
    temperatureRange: [15, 40],
    humidityRange: [40, 90],
    rainfallRange: [0, 180],
  },
};

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

export class WeatherService {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheDuration = 30 * 60 * 1000; // 30 minutes
  private primaryApiUrl = "https://api.open-meteo.com/v1/forecast";
  private backupApiUrl = "https://api.weatherapi.com/v1/forecast.json";

  async getWeather(
    location: string,
    latitude: number,
    longitude: number,
    region: string = "NORTH"
  ): Promise<WeatherData | null> {
    const cacheKey = `${latitude},${longitude}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      // Try primary API first
      let weatherData = await this.fetchFromPrimaryApi(
        latitude,
        longitude,
        location
      );

      if (!weatherData) {
        // Fallback to backup API
        weatherData = await this.fetchFromBackupApi(
          latitude,
          longitude,
          location
        );
      }

      if (weatherData) {
        // Validate weather data against regional standards
        const isValid = this.validateWeatherData(
          weatherData,
          region
        );

        if (isValid) {
          // Cache the data
          this.cache.set(cacheKey, {
            data: weatherData,
            timestamp: Date.now(),
          });
          return weatherData;
        }
      }

      return null;
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  }

  private async fetchFromPrimaryApi(
    latitude: number,
    longitude: number,
    location: string
  ): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${this.primaryApiUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return this.parsePrimaryApiResponse(data, location);
    } catch (error) {
      console.error("Primary API error:", error);
      return null;
    }
  }

  private async fetchFromBackupApi(
    latitude: number,
    longitude: number,
    location: string
  ): Promise<WeatherData | null> {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      console.warn(
        "Weather API key not configured for backup service"
      );
      return null;
    }

    try {
      const response = await fetch(
        `${this.backupApiUrl}?key=${apiKey}&q=${latitude},${longitude}&aqi=no`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return this.parseBackupApiResponse(data, location);
    } catch (error) {
      console.error("Backup API error:", error);
      return null;
    }
  }

  private parsePrimaryApiResponse(
    data: Record<string, unknown>,
    location: string
  ): WeatherData | null {
    try {
      const current = data.current as Record<string, unknown>;
      const daily = data.daily as Record<string, unknown[]>;

      const forecast = (daily.time as string[]).slice(0, 7).map(
        (date: string, index: number) => ({
          date,
          maxTemp: (daily.temperature_2m_max as number[])[index],
          minTemp: (daily.temperature_2m_min as number[])[index],
          rainfall: (daily.precipitation_sum as number[])[index],
          condition: this.weatherCodeToCondition(
            (daily.weather_code as number[])[index]
          ),
        })
      );

      const isMonsoonSeason = this.isMonsoonSeason(new Date());

      return weatherDataSchema.parse({
        location,
        latitude: data.latitude,
        longitude: data.longitude,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        rainfall: 0,
        windSpeed: current.wind_speed_10m,
        condition: this.weatherCodeToCondition(
          current.weather_code as number
        ),
        forecast,
        lastUpdated: new Date(),
        isMonsoonSeason,
      });
    } catch (error) {
      console.error("Error parsing primary API response:", error);
      return null;
    }
  }

  private parseBackupApiResponse(
    data: Record<string, unknown>,
    location: string
  ): WeatherData | null {
    try {
      const current = (data.current as Record<string, unknown>) || {};
      const forecast_obj = (data.forecast as Record<string, unknown>) || {};
      const forecastday = (forecast_obj.forecastday as Record<string, unknown>[]) || [];

      const forecast = forecastday.slice(0, 7).map(
        (day: Record<string, unknown>) => ({
          date: day.date as string,
          maxTemp: ((day.day as Record<string, unknown>)
            .maxtemp_c as number) || 0,
          minTemp: ((day.day as Record<string, unknown>)
            .mintemp_c as number) || 0,
          rainfall: ((day.day as Record<string, unknown>)
            .totalprecip_mm as number) || 0,
          condition: ((day.day as Record<string, unknown>)
            .condition as Record<string, unknown>)?.text as string || "Unknown",
        })
      );

      const isMonsoonSeason = this.isMonsoonSeason(new Date());

      return weatherDataSchema.parse({
        location,
        latitude: (data.location as Record<string, unknown>)
          .lat as number,
        longitude: (data.location as Record<string, unknown>)
          .lon as number,
        temperature: (current.temp_c as number) || 0,
        humidity: (current.humidity as number) || 0,
        rainfall: 0,
        windSpeed: (current.wind_kph as number) || 0,
        condition: ((current.condition as Record<string, unknown>)
          .text as string) || "Unknown",
        forecast,
        lastUpdated: new Date(),
        isMonsoonSeason,
      });
    } catch (error) {
      console.error("Error parsing backup API response:", error);
      return null;
    }
  }

  private validateWeatherData(
    weather: WeatherData,
    region: string
  ): boolean {
    const standards =
      REGIONAL_STANDARDS[region] || REGIONAL_STANDARDS.NORTH;

    // Check if temperature is within regional range
    if (
      weather.temperature < standards.temperatureRange[0] ||
      weather.temperature > standards.temperatureRange[1]
    ) {
      console.warn(
        `Temperature ${weather.temperature} outside regional range for ${region}`
      );
      return false;
    }

    // Check if humidity is within regional range
    if (
      weather.humidity < standards.humidityRange[0] ||
      weather.humidity > standards.humidityRange[1]
    ) {
      console.warn(
        `Humidity ${weather.humidity} outside regional range for ${region}`
      );
      return false;
    }

    return true;
  }

  private weatherCodeToCondition(code: number): string {
    const conditions: Record<number, string> = {
      0: "Clear",
      1: "Partly Cloudy",
      2: "Cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Foggy",
      51: "Light Drizzle",
      53: "Moderate Drizzle",
      55: "Heavy Drizzle",
      61: "Slight Rain",
      63: "Moderate Rain",
      65: "Heavy Rain",
      71: "Slight Snow",
      73: "Moderate Snow",
      75: "Heavy Snow",
      77: "Snow Grains",
      80: "Slight Rain Showers",
      81: "Moderate Rain Showers",
      82: "Violent Rain Showers",
      85: "Slight Snow Showers",
      86: "Heavy Snow Showers",
      95: "Thunderstorm",
      96: "Thunderstorm with Slight Hail",
      99: "Thunderstorm with Heavy Hail",
    };

    return conditions[code] || "Unknown";
  }

  private isMonsoonSeason(date: Date): boolean {
    const month = date.getMonth();
    // Monsoon in India typically June to September
    return month >= 5 && month <= 8;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const weatherService = new WeatherService();
