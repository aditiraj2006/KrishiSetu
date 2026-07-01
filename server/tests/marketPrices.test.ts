import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CACHE_TTL_MS,
  clearMarketPriceState,
  forecastNextDay,
  getHistory,
  getMarketPrices,
  isStale,
  recordHistory,
  type MarketPrice,
} from "../marketPrices";

function makePrice(overrides: Partial<MarketPrice> = {}): MarketPrice {
  return {
    commodity: "Wheat",
    market: "Azadpur",
    state: "Delhi",
    modalPrice: 2200,
    minPrice: 2100,
    maxPrice: 2350,
    reportedAt: "2026-07-01",
    source: "agmarknet",
    stale: false,
    ...overrides,
  };
}

function agmarknetResponse(records: Record<string, string>[]) {
  return {
    ok: true,
    json: async () => ({ records }),
  } as Response;
}

const sampleRecord = {
  commodity: "Wheat",
  market: "Azadpur",
  state: "Delhi",
  modal_price: "2200",
  min_price: "2100",
  max_price: "2350",
  arrival_date: "01/07/2026",
};

describe("market price service", () => {
  beforeEach(() => {
    clearMarketPriceState();
    process.env.DATA_GOV_IN_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.DATA_GOV_IN_API_KEY;
    vi.restoreAllMocks();
  });

  it("fetches from the feed on a cold cache and serves the cache afterwards", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(agmarknetResponse([sampleRecord]));

    const first = await getMarketPrices("Wheat", "Delhi", 0);
    expect(first?.cached).toBe(false);
    expect(first?.prices[0].modalPrice).toBe(2200);
    expect(first?.prices[0].reportedAt).toBe("2026-07-01");

    const second = await getMarketPrices("Wheat", "Delhi", CACHE_TTL_MS - 1);
    expect(second?.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once the 4 hour cache window has elapsed", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(agmarknetResponse([sampleRecord]));

    await getMarketPrices("Wheat", "Delhi", 0);
    await getMarketPrices("Wheat", "Delhi", CACHE_TTL_MS + 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("serves the last cached prices marked stale when the feed goes down", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      agmarknetResponse([sampleRecord]),
    );
    await getMarketPrices("Wheat", "Delhi", 0);

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("feed down"));
    const result = await getMarketPrices("Wheat", "Delhi", CACHE_TTL_MS + 1);

    expect(result).not.toBeNull();
    expect(result?.cached).toBe(true);
    expect(result?.prices[0].stale).toBe(true);
  });

  it("returns null when the feed is down and nothing is cached", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("feed down"));
    const result = await getMarketPrices("Wheat", "Delhi", 0);
    expect(result).toBeNull();
  });

  it("keeps at most seven days of history per commodity and market", () => {
    for (let day = 1; day <= 10; day++) {
      recordHistory(
        makePrice({
          reportedAt: `2026-06-${String(day).padStart(2, "0")}`,
          modalPrice: 2000 + day,
        }),
      );
    }
    const history = getHistory("Wheat", "Azadpur");
    expect(history).toHaveLength(7);
    expect(history[0].date).toBe("2026-06-04");
    expect(history[6].date).toBe("2026-06-10");
  });

  it("overwrites the same-day entry instead of duplicating it", () => {
    recordHistory(makePrice({ modalPrice: 2200 }));
    recordHistory(makePrice({ modalPrice: 2250 }));
    const history = getHistory("Wheat", "Azadpur");
    expect(history).toHaveLength(1);
    expect(history[0].modalPrice).toBe(2250);
  });

  it("projects a rising trend one day ahead", () => {
    const history = [
      { date: "2026-06-28", modalPrice: 2000 },
      { date: "2026-06-29", modalPrice: 2100 },
      { date: "2026-06-30", modalPrice: 2200 },
      { date: "2026-07-01", modalPrice: 2300 },
    ];
    expect(forecastNextDay(history)).toBe(2400);
  });

  it("declines to forecast with fewer than three observations", () => {
    expect(forecastNextDay([])).toBeNull();
    expect(
      forecastNextDay([
        { date: "2026-06-30", modalPrice: 2000 },
        { date: "2026-07-01", modalPrice: 2500 },
      ]),
    ).toBeNull();
  });

  it("flags reports older than the freshness window as stale", () => {
    const now = new Date("2026-07-02T12:00:00Z").getTime();
    expect(isStale("2026-07-02", now)).toBe(false);
    expect(isStale("2026-06-28", now)).toBe(true);
    expect(isStale("not-a-date", now)).toBe(true);
  });
});
