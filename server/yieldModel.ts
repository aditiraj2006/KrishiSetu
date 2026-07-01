import { z } from "zod";

/**
 * Climate-aware yield prediction.
 *
 * The previous approach applied static historical averages, so a region
 * whose rainfall has been declining for a decade was still scored as if
 * the 20 year old baseline held. This module fits linear trends over
 * the supplied yearly climate records, measures how the frequency of
 * extreme weather years has changed, and adjusts the baseline yield
 * accordingly. It also produces scenario projections and suggests
 * climate resilient crops when the trend is unfavourable.
 */

export const climateRecordSchema = z.object({
  year: z.number().int().min(1900).max(2200),
  /** Total seasonal rainfall in millimetres. */
  rainfallMm: z.number().min(0),
  /** Mean growing season temperature in degrees Celsius. */
  avgTempC: z.number().min(-20).max(60),
  /** True if the year saw drought, flood or another extreme event. */
  extremeEvent: z.boolean().default(false),
});
export type ClimateRecord = z.infer<typeof climateRecordSchema>;

export const yieldPredictionRequestSchema = z.object({
  crop: z.string().trim().min(1),
  /** Expected yield under baseline climate, e.g. quintals per acre. */
  baselineYield: z.number().positive(),
  records: z.array(climateRecordSchema).min(5, {
    message: "At least 5 years of climate records are required for trend analysis",
  }),
});
export type YieldPredictionRequest = z.infer<typeof yieldPredictionRequestSchema>;

export interface ClimateTrend {
  /** Rainfall change per year in mm (negative means drying). */
  rainfallSlopeMm: number;
  /** Temperature change per year in degrees Celsius. */
  tempSlopeC: number;
  /** Share of years with an extreme event in the older half of the data. */
  extremeRateEarly: number;
  /** Share of years with an extreme event in the recent half of the data. */
  extremeRateRecent: number;
}

export interface YieldScenario {
  scenario: "optimistic" | "baseline" | "pessimistic";
  predictedYield: number;
  /** Multiplier applied to the caller's baseline yield. */
  adjustment: number;
}

export interface YieldPrediction {
  crop: string;
  trend: ClimateTrend;
  scenarios: YieldScenario[];
  resilientCrops: string[];
  adaptations: string[];
}

/** Ordinary least squares slope of y over x. */
export function linearSlope(points: { x: number; y: number }[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const xMean = points.reduce((s, p) => s + p.x, 0) / n;
  const yMean = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - xMean) * (p.y - yMean);
    den += (p.x - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function analyzeClimateTrend(records: ClimateRecord[]): ClimateTrend {
  const sorted = [...records].sort((a, b) => a.year - b.year);
  const rainfallSlopeMm = linearSlope(
    sorted.map((r) => ({ x: r.year, y: r.rainfallMm })),
  );
  const tempSlopeC = linearSlope(
    sorted.map((r) => ({ x: r.year, y: r.avgTempC })),
  );

  const mid = Math.floor(sorted.length / 2);
  const early = sorted.slice(0, mid);
  const recent = sorted.slice(mid);
  const rate = (rs: ClimateRecord[]) =>
    rs.length === 0 ? 0 : rs.filter((r) => r.extremeEvent).length / rs.length;

  return {
    rainfallSlopeMm,
    tempSlopeC,
    extremeRateEarly: rate(early),
    extremeRateRecent: rate(recent),
  };
}

/**
 * Convert the observed trend into a yield multiplier for a 5 year
 * planning horizon. The factors are deliberately conservative: each
 * degree of projected warming costs roughly 6% of yield (consistent
 * with published wheat and rice sensitivity estimates), each 100mm of
 * lost seasonal rainfall costs 5%, and a rising extreme event rate
 * subtracts up to 15%.
 */
export function trendAdjustment(trend: ClimateTrend, horizonYears = 5): number {
  const projectedWarming = trend.tempSlopeC * horizonYears;
  const projectedRainChange = trend.rainfallSlopeMm * horizonYears;
  const extremeIncrease = Math.max(
    0,
    trend.extremeRateRecent - trend.extremeRateEarly,
  );

  let adjustment = 1;
  adjustment -= Math.max(0, projectedWarming) * 0.06;
  adjustment -= Math.max(0, -projectedRainChange / 100) * 0.05;
  adjustment -= Math.min(0.15, extremeIncrease * 0.3);

  return Math.max(0.4, Math.min(1.1, adjustment));
}

const RESILIENT_CROPS: Record<string, string[]> = {
  drying: ["Pearl millet (bajra)", "Sorghum (jowar)", "Chickpea", "Moth bean"],
  warming: ["Heat tolerant wheat (HD 3226)", "Maize", "Pigeon pea", "Sesame"],
  flooding: ["Deepwater rice (Swarna Sub1)", "Jute", "Water chestnut", "Taro"],
};

export function recommendResilientCrops(trend: ClimateTrend): string[] {
  const suggestions = new Set<string>();
  if (trend.rainfallSlopeMm < -2) {
    for (const c of RESILIENT_CROPS.drying) suggestions.add(c);
  }
  if (trend.tempSlopeC > 0.02) {
    for (const c of RESILIENT_CROPS.warming) suggestions.add(c);
  }
  if (trend.rainfallSlopeMm > 5 || trend.extremeRateRecent > 0.4) {
    for (const c of RESILIENT_CROPS.flooding) suggestions.add(c);
  }
  return Array.from(suggestions);
}

export function recommendAdaptations(trend: ClimateTrend): string[] {
  const out: string[] = [];
  if (trend.rainfallSlopeMm < -2) {
    out.push(
      "Adopt drip or sprinkler irrigation to compensate for the declining rainfall trend",
      "Build farm ponds or recharge structures to capture monsoon runoff",
    );
  }
  if (trend.tempSlopeC > 0.02) {
    out.push(
      "Shift sowing dates earlier to avoid peak heat during grain filling",
      "Use mulching to reduce soil temperature and evaporation losses",
    );
  }
  if (trend.extremeRateRecent > trend.extremeRateEarly) {
    out.push(
      "Split the holding across two sowing windows to hedge extreme weather risk",
      "Enroll in PMFBY crop insurance before the sowing cutoff",
    );
  }
  return out;
}

export function predictYield(request: YieldPredictionRequest): YieldPrediction {
  const trend = analyzeClimateTrend(request.records);
  const baselineAdj = trendAdjustment(trend);

  // Optimistic assumes half the projected climate penalty materialises;
  // pessimistic assumes the penalty overshoots by half again.
  const optimisticAdj = Math.min(1.1, 1 - (1 - baselineAdj) * 0.5);
  const pessimisticAdj = Math.max(0.3, 1 - (1 - baselineAdj) * 1.5);

  const toScenario = (
    scenario: YieldScenario["scenario"],
    adjustment: number,
  ): YieldScenario => ({
    scenario,
    adjustment: Number(adjustment.toFixed(3)),
    predictedYield: Number((request.baselineYield * adjustment).toFixed(2)),
  });

  return {
    crop: request.crop,
    trend,
    scenarios: [
      toScenario("optimistic", optimisticAdj),
      toScenario("baseline", baselineAdj),
      toScenario("pessimistic", pessimisticAdj),
    ],
    resilientCrops: recommendResilientCrops(trend),
    adaptations: recommendAdaptations(trend),
  };
}
