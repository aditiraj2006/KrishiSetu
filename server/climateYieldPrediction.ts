import { z } from "zod";

// Climate and Yield Schemas
export const climateDataSchema = z.object({
  region: z.string().min(1, "Region is required"),
  crop: z.string().min(1, "Crop is required"),
  year: z.number().int().min(1900).max(2100),
  rainfall_mm: z.number().positive("Rainfall must be positive"),
  temperature_avg: z.number().min(-50).max(60, "Invalid temperature"),
  temperature_max: z.number().min(-50).max(60),
  temperature_min: z.number().min(-50).max(60),
  humidity_percent: z.number().min(0).max(100),
  sunlight_hours: z.number().min(0).max(24),
  soil_ph: z.number().min(3).max(10),
  soil_nitrogen: z.number().min(0),
  extreme_events: z.array(z.enum(["drought", "flood", "frost", "heatwave", "pest_outbreak"])).default([]),
});

export const yieldPredictionSchema = z.object({
  region: z.string(),
  crop: z.string(),
  predicted_yield_per_hectare: z.number().positive(),
  yield_unit: z.enum(["kg", "ton", "quintal"]),
  confidence_level: z.number().min(0).max(1),
  confidence_percentage: z.number().min(0).max(100),
  factors: z.object({
    rainfall_impact: z.number(),
    temperature_impact: z.number(),
    extreme_events_impact: z.number(),
    soil_quality_impact: z.number(),
    sunlight_impact: z.number(),
  }),
  trend: z.enum(["increasing", "decreasing", "stable"]),
  climate_resilience_score: z.number().min(0).max(100),
  recommended_varieties: z.array(z.string()),
  adaptation_strategies: z.array(z.string()),
  risk_level: z.enum(["low", "medium", "high"]),
  predicted_date: z.date().default(() => new Date()),
});

export type ClimateData = z.infer<typeof climateDataSchema>;
export type YieldPrediction = z.infer<typeof yieldPredictionSchema>;

// Climate-Aware Yield Prediction Service
class ClimateYieldPredictionService {
  private historicalData: Map<string, ClimateData[]> = new Map();
  private yieldRecords: Map<string, number[]> = new Map();

  /**
   * Analyze climate trends over 10 years
   */
  async analyzeClimateTrends(region: string, years: number = 10): Promise<{
    rainfall_trend: "increasing" | "decreasing" | "stable";
    temperature_trend: "warming" | "cooling" | "stable";
    extreme_events_frequency: number;
    climate_volatility: number;
  }> {
    const key = `climate-${region}`;
    const data = this.historicalData.get(key) || [];

    if (data.length < 2) {
      throw new Error("Insufficient historical data for trend analysis");
    }

    // Analyze rainfall trend
    const recentRainfall = data.slice(-Math.min(5, data.length)).map((d) => d.rainfall_mm);
    const oldRainfall = data.slice(0, Math.min(5, data.length)).map((d) => d.rainfall_mm);

    const recentRainfallAvg = recentRainfall.reduce((a, b) => a + b) / recentRainfall.length;
    const oldRainfallAvg = oldRainfall.reduce((a, b) => a + b) / oldRainfall.length;

    const rainfallTrend =
      recentRainfallAvg > oldRainfallAvg * 1.05
        ? "increasing"
        : recentRainfallAvg < oldRainfallAvg * 0.95
          ? "decreasing"
          : "stable";

    // Analyze temperature trend
    const recentTemp = data.slice(-Math.min(5, data.length)).map((d) => d.temperature_avg);
    const oldTemp = data.slice(0, Math.min(5, data.length)).map((d) => d.temperature_avg);

    const recentTempAvg = recentTemp.reduce((a, b) => a + b) / recentTemp.length;
    const oldTempAvg = oldTemp.reduce((a, b) => a + b) / oldTemp.length;

    const tempTrend =
      recentTempAvg > oldTempAvg + 0.5
        ? "warming"
        : recentTempAvg < oldTempAvg - 0.5
          ? "cooling"
          : "stable";

    // Count extreme events
    const extremeEventCount = data.reduce((sum, d) => sum + d.extreme_events.length, 0);
    const extremeEventsFrequency = extremeEventCount / data.length;

    // Calculate climate volatility
    const tempVariance = this.calculateVariance(data.map((d) => d.temperature_avg));
    const rainfallVariance = this.calculateVariance(data.map((d) => d.rainfall_mm));
    const volatility = Math.sqrt(tempVariance + rainfallVariance) / 100;

    return {
      rainfall_trend: rainfallTrend,
      temperature_trend: tempTrend,
      extreme_events_frequency: extremeEventsFrequency,
      climate_volatility: Math.min(volatility * 10, 100),
    };
  }

  /**
   * Predict yield considering climate change impacts
   */
  async predictYield(
    region: string,
    crop: string,
    baselineYield: number,
    currentClimate: Omit<ClimateData, "region" | "crop" | "year">,
  ): Promise<YieldPrediction> {
    const trends = await this.analyzeClimateTrends(region);

    // Calculate impact factors
    const rainfallImpact = this.calculateRainfallImpact(currentClimate.rainfall_mm, crop);
    const temperatureImpact = this.calculateTemperatureImpact(currentClimate.temperature_avg, crop);
    const extremeEventsImpact = this.calculateExtremeEventsImpact(currentClimate.extreme_events, crop);
    const soilQualityImpact = this.calculateSoilQualityImpact(currentClimate.soil_ph, currentClimate.soil_nitrogen);
    const sunlightImpact = this.calculateSunlightImpact(currentClimate.sunlight_hours, crop);

    // Combined impact calculation
    const totalImpact = (rainfallImpact + temperatureImpact + soilQualityImpact + sunlightImpact) / 4 - extremeEventsImpact;

    const predictedYield = baselineYield * (1 + totalImpact);

    // Determine confidence level based on data quality
    const confidenceLevel = Math.max(0.5, 1 - trends.climate_volatility / 100);

    // Assess risk level
    let riskLevel: "low" | "medium" | "high" = "low";
    if (trends.extreme_events_frequency > 0.3 || trends.climate_volatility > 50) {
      riskLevel = "high";
    } else if (trends.extreme_events_frequency > 0.15 || trends.climate_volatility > 25) {
      riskLevel = "medium";
    }

    // Recommend climate-resilient varieties
    const recommendedVarieties = this.recommendResilientVarieties(crop, trends);

    // Suggest adaptation strategies
    const adaptationStrategies = this.suggestAdaptationStrategies(crop, trends, currentClimate.extreme_events);

    return {
      region,
      crop,
      predicted_yield_per_hectare: Math.max(predictedYield, 0),
      yield_unit: "kg",
      confidence_level: confidenceLevel,
      confidence_percentage: Math.round(confidenceLevel * 100),
      factors: {
        rainfall_impact: rainfallImpact,
        temperature_impact: temperatureImpact,
        extreme_events_impact: extremeEventsImpact,
        soil_quality_impact: soilQualityImpact,
        sunlight_impact: sunlightImpact,
      },
      trend: trends.temperature_trend === "warming" ? "decreasing" : trends.temperature_trend === "cooling" ? "increasing" : "stable",
      climate_resilience_score: Math.max(0, Math.min(100, (1 - trends.climate_volatility / 100) * 100)),
      recommended_varieties: recommendedVarieties,
      adaptation_strategies: adaptationStrategies,
      risk_level: riskLevel,
    };
  }

  /**
   * Recommend climate-resilient crop varieties
   */
  private recommendResilientVarieties(crop: string, trends: any): string[] {
    const varietyMap: Record<string, string[]> = {
      rice: ["PR-121 (drought tolerant)", "Sahbhagi (flood tolerant)", "MTU-1001 (heat tolerant)"],
      wheat: ["HD-3256 (heat tolerant)", "WH-1025 (drought tolerant)", "K-9107 (cold tolerant)"],
      corn: ["DHM-117 (drought tolerant)", "HQPM-1 (heat tolerant)", "ZM-607 (pest resistant)"],
      sugarcane: ["CoP-92 (drought tolerant)", "COS-96436 (pest resistant)", "BO-96 (heat tolerant)"],
    };

    const baseVarieties = varietyMap[crop.toLowerCase()] || [];

    // Prioritize based on climate trends
    if (trends.rainfall_trend === "decreasing") {
      return baseVarieties.filter((v) => v.includes("drought"));
    } else if (trends.rainfall_trend === "increasing") {
      return baseVarieties.filter((v) => v.includes("flood") || v.includes("water"));
    } else if (trends.temperature_trend === "warming") {
      return baseVarieties.filter((v) => v.includes("heat"));
    }

    return baseVarieties;
  }

  /**
   * Suggest climate adaptation strategies
   */
  private suggestAdaptationStrategies(crop: string, trends: any, extremeEvents: string[]): string[] {
    const strategies: string[] = [];

    if (trends.rainfall_trend === "decreasing") {
      strategies.push("Implement drip irrigation for water conservation");
      strategies.push("Use mulching to retain soil moisture");
      strategies.push("Plant drought-tolerant crop varieties");
    }

    if (trends.rainfall_trend === "increasing") {
      strategies.push("Improve field drainage systems");
      strategies.push("Use raised bed farming for waterlogging management");
      strategies.push("Plant flood-tolerant crop varieties");
    }

    if (trends.temperature_trend === "warming") {
      strategies.push("Adjust sowing dates to cooler months");
      strategies.push("Increase irrigation frequency in summer");
      strategies.push("Use shade crops to reduce temperature stress");
    }

    if (extremeEvents.includes("heatwave")) {
      strategies.push("Apply heat-reflective mulches");
      strategies.push("Increase irrigation during heat stress");
    }

    if (extremeEvents.includes("frost")) {
      strategies.push("Use frost-protective covers for young plants");
      strategies.push("Select frost-tolerant varieties");
    }

    if (extremeEvents.includes("pest_outbreak")) {
      strategies.push("Implement integrated pest management");
      strategies.push("Use climate-resilient pest-resistant varieties");
    }

    return strategies;
  }

  /**
   * Calculate rainfall impact on yield
   */
  private calculateRainfallImpact(rainfall: number, crop: string): number {
    const optimalRainfall: Record<string, { min: number; max: number }> = {
      rice: { min: 800, max: 1200 },
      wheat: { min: 300, max: 600 },
      corn: { min: 400, max: 800 },
      sugarcane: { min: 1200, max: 2500 },
    };

    const optimal = optimalRainfall[crop.toLowerCase()] || { min: 500, max: 1000 };

    if (rainfall < optimal.min) {
      return -0.3; // 30% reduction
    } else if (rainfall > optimal.max) {
      return -0.15; // 15% reduction
    } else {
      return 0.2; // 20% improvement
    }
  }

  /**
   * Calculate temperature impact on yield
   */
  private calculateTemperatureImpact(temperature: number, crop: string): number {
    const optimalTemp: Record<string, { min: number; max: number }> = {
      rice: { min: 20, max: 30 },
      wheat: { min: 15, max: 25 },
      corn: { min: 18, max: 28 },
      sugarcane: { min: 21, max: 30 },
    };

    const optimal = optimalTemp[crop.toLowerCase()] || { min: 18, max: 28 };

    if (temperature < optimal.min || temperature > optimal.max) {
      return -Math.abs(temperature - (optimal.min + optimal.max) / 2) / 10;
    }

    return 0.15;
  }

  /**
   * Calculate extreme events impact
   */
  private calculateExtremeEventsImpact(events: string[], crop: string): number {
    let impact = 0;

    const eventImpactMap: Record<string, number> = {
      drought: 0.4,
      flood: 0.35,
      frost: 0.3,
      heatwave: 0.25,
      pest_outbreak: 0.2,
    };

    for (const event of events) {
      impact += eventImpactMap[event] || 0.15;
    }

    return Math.min(impact, 0.8); // Cap at 80% loss
  }

  /**
   * Calculate soil quality impact
   */
  private calculateSoilQualityImpact(ph: number, nitrogen: number): number {
    const phOptimal = 6.5;
    const phPenalty = Math.abs(ph - phOptimal) > 1 ? -0.1 : 0;

    const nitrogenBoost = nitrogen > 200 ? 0.15 : nitrogen > 100 ? 0.1 : 0;

    return phPenalty + nitrogenBoost;
  }

  /**
   * Calculate sunlight impact
   */
  private calculateSunlightImpact(hours: number, crop: string): number {
    const optimalHours: Record<string, number> = {
      rice: 8,
      wheat: 6,
      corn: 8,
      sugarcane: 8,
    };

    const optimal = optimalHours[crop.toLowerCase()] || 7;

    if (hours < optimal * 0.8) {
      return -0.15;
    } else if (hours > optimal * 1.2) {
      return -0.1;
    }

    return 0.1;
  }

  /**
   * Helper: Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    return values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  }
}

export const climateYieldPredictionService = new ClimateYieldPredictionService();
