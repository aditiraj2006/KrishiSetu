import { describe, expect, it } from "vitest";
import {
  analyzeClimateTrend,
  linearSlope,
  predictYield,
  recommendResilientCrops,
  trendAdjustment,
  yieldPredictionRequestSchema,
  type ClimateRecord,
} from "../yieldModel";

function record(
  year: number,
  rainfallMm: number,
  avgTempC: number,
  extremeEvent = false,
): ClimateRecord {
  return { year, rainfallMm, avgTempC, extremeEvent };
}

/** Ten years of steadily drying and warming climate with rising extremes. */
const dryingClimate: ClimateRecord[] = Array.from({ length: 10 }, (_, i) =>
  record(2016 + i, 900 - i * 10, 26 + i * 0.05, i >= 7),
);

/** Ten years of stable climate. */
const stableClimate: ClimateRecord[] = Array.from({ length: 10 }, (_, i) =>
  record(2016 + i, 900, 26, false),
);

describe("linearSlope", () => {
  it("recovers the slope of a perfect line", () => {
    const points = [0, 1, 2, 3, 4].map((x) => ({ x, y: 3 * x + 7 }));
    expect(linearSlope(points)).toBeCloseTo(3);
  });

  it("returns 0 for constant or degenerate input", () => {
    expect(linearSlope([{ x: 1, y: 5 }])).toBe(0);
    expect(
      linearSlope([
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 5 },
      ]),
    ).toBeCloseTo(0);
  });
});

describe("analyzeClimateTrend", () => {
  it("detects a drying and warming trend", () => {
    const trend = analyzeClimateTrend(dryingClimate);
    expect(trend.rainfallSlopeMm).toBeCloseTo(-10);
    expect(trend.tempSlopeC).toBeCloseTo(0.05);
  });

  it("measures the rise in extreme event frequency", () => {
    const trend = analyzeClimateTrend(dryingClimate);
    expect(trend.extremeRateEarly).toBe(0);
    expect(trend.extremeRateRecent).toBeCloseTo(3 / 5);
  });

  it("is insensitive to record ordering", () => {
    const shuffled = [...dryingClimate].reverse();
    expect(analyzeClimateTrend(shuffled)).toEqual(
      analyzeClimateTrend(dryingClimate),
    );
  });
});

describe("trendAdjustment", () => {
  it("leaves a stable climate essentially unpenalised", () => {
    const adj = trendAdjustment(analyzeClimateTrend(stableClimate));
    expect(adj).toBeCloseTo(1);
  });

  it("penalises warming, drying and rising extremes", () => {
    const adj = trendAdjustment(analyzeClimateTrend(dryingClimate));
    expect(adj).toBeLessThan(1);
    expect(adj).toBeGreaterThanOrEqual(0.4);
  });

  it("never drops below the 0.4 floor", () => {
    const catastrophic = analyzeClimateTrend(
      Array.from({ length: 10 }, (_, i) =>
        record(2016 + i, 1000 - i * 100, 26 + i, i >= 3),
      ),
    );
    expect(trendAdjustment(catastrophic)).toBe(0.4);
  });
});

describe("predictYield", () => {
  const request = {
    crop: "Wheat",
    baselineYield: 20,
    records: dryingClimate,
  };

  it("orders scenarios optimistic >= baseline >= pessimistic", () => {
    const result = predictYield(request);
    const byName = Object.fromEntries(
      result.scenarios.map((s) => [s.scenario, s.predictedYield]),
    );
    expect(byName.optimistic).toBeGreaterThanOrEqual(byName.baseline);
    expect(byName.baseline).toBeGreaterThanOrEqual(byName.pessimistic);
  });

  it("scales predictions from the caller's baseline yield", () => {
    const result = predictYield(request);
    for (const s of result.scenarios) {
      expect(s.predictedYield).toBeCloseTo(20 * s.adjustment, 1);
    }
  });

  it("suggests drought and heat resilient crops for a drying trend", () => {
    const result = predictYield(request);
    expect(result.resilientCrops).toContain("Pearl millet (bajra)");
    expect(result.adaptations.length).toBeGreaterThan(0);
  });

  it("suggests nothing special for a stable climate", () => {
    const result = predictYield({ ...request, records: stableClimate });
    expect(result.resilientCrops).toHaveLength(0);
    expect(result.adaptations).toHaveLength(0);
  });
});

describe("recommendResilientCrops", () => {
  it("recommends flood tolerant crops when rainfall is rising sharply", () => {
    const wettening = analyzeClimateTrend(
      Array.from({ length: 10 }, (_, i) => record(2016 + i, 800 + i * 20, 26)),
    );
    expect(recommendResilientCrops(wettening)).toContain(
      "Deepwater rice (Swarna Sub1)",
    );
  });
});

describe("yieldPredictionRequestSchema", () => {
  it("rejects fewer than five years of records", () => {
    const parsed = yieldPredictionRequestSchema.safeParse({
      crop: "Wheat",
      baselineYield: 20,
      records: dryingClimate.slice(0, 4),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non positive baseline yield", () => {
    const parsed = yieldPredictionRequestSchema.safeParse({
      crop: "Wheat",
      baselineYield: 0,
      records: dryingClimate,
    });
    expect(parsed.success).toBe(false);
  });
});
