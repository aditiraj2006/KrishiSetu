import { z } from "zod";

/**
 * Market price service backed by the data.gov.in AGMARKNET dataset.
 *
 * Prices used to be sourced from batch dumps that lagged the mandi by
 * 2-3 days. This module fetches the current daily mandi report, caches
 * it for a bounded window (4 hours) and keeps a rolling 7-day history
 * per commodity/market pair so the client can show trends and a simple
 * next-day forecast.
 */

const AGMARKNET_RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
const AGMARKNET_URL = `https://api.data.gov.in/resource/${AGMARKNET_RESOURCE}`;

export const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // refresh at least every 4 hours
const HISTORY_DAYS = 7;

export interface MarketPrice {
  commodity: string;
  market: string;
  state: string;
  /** Modal price in INR per quintal as reported by the mandi. */
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  reportedAt: string; // ISO date of the mandi report
  source: "agmarknet" | "fallback";
  /** True when the report is older than the freshness window. */
  stale: boolean;
}

interface CacheEntry {
  fetchedAt: number;
  prices: MarketPrice[];
}

const priceCache = new Map<string, CacheEntry>();
const priceHistory = new Map<string, { date: string; modalPrice: number }[]>();

const agmarknetRecord = z.object({
  commodity: z.string(),
  market: z.string(),
  state: z.string(),
  modal_price: z.coerce.number(),
  min_price: z.coerce.number(),
  max_price: z.coerce.number(),
  arrival_date: z.string(),
});

function cacheKey(commodity: string, state?: string): string {
  return `${commodity.toLowerCase()}|${(state ?? "").toLowerCase()}`;
}

function historyKey(commodity: string, market: string): string {
  return `${commodity.toLowerCase()}|${market.toLowerCase()}`;
}

/** Parse AGMARKNET's DD/MM/YYYY arrival dates into ISO format. */
function toIsoDate(arrivalDate: string): string {
  const m = arrivalDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return arrivalDate;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function isStale(reportedAt: string, now = Date.now()): boolean {
  const reported = new Date(reportedAt).getTime();
  if (Number.isNaN(reported)) return true;
  return now - reported > CACHE_TTL_MS + 24 * 60 * 60 * 1000;
}

export function recordHistory(price: MarketPrice): void {
  const key = historyKey(price.commodity, price.market);
  const entries = priceHistory.get(key) ?? [];
  const date = price.reportedAt.slice(0, 10);
  const existing = entries.find((e) => e.date === date);
  if (existing) {
    existing.modalPrice = price.modalPrice;
  } else {
    entries.push({ date, modalPrice: price.modalPrice });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    while (entries.length > HISTORY_DAYS) entries.shift();
  }
  priceHistory.set(key, entries);
}

export function getHistory(
  commodity: string,
  market: string,
): { date: string; modalPrice: number }[] {
  return priceHistory.get(historyKey(commodity, market)) ?? [];
}

/**
 * Least-squares linear fit over the recorded history, projected one day
 * ahead. Returns null when there are fewer than three observations,
 * since a two-point "trend" is indistinguishable from noise.
 */
export function forecastNextDay(
  history: { date: string; modalPrice: number }[],
): number | null {
  if (history.length < 3) return null;
  const n = history.length;
  const xs = history.map((_, i) => i);
  const ys = history.map((h) => h.modalPrice);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return Math.round(intercept + slope * n);
}

async function fetchFromAgmarknet(
  commodity: string,
  state?: string,
): Promise<MarketPrice[] | null> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    "api-key": apiKey,
    format: "json",
    limit: "50",
    "filters[commodity]": commodity,
  });
  if (state) params.set("filters[state]", state);

  const response = await fetch(`${AGMARKNET_URL}?${params.toString()}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as { records?: unknown[] };
  if (!Array.isArray(payload.records)) return null;

  const prices: MarketPrice[] = [];
  for (const raw of payload.records) {
    const parsed = agmarknetRecord.safeParse(raw);
    if (!parsed.success) continue;
    const reportedAt = toIsoDate(parsed.data.arrival_date);
    prices.push({
      commodity: parsed.data.commodity,
      market: parsed.data.market,
      state: parsed.data.state,
      modalPrice: parsed.data.modal_price,
      minPrice: parsed.data.min_price,
      maxPrice: parsed.data.max_price,
      reportedAt,
      source: "agmarknet",
      stale: isStale(reportedAt),
    });
  }
  return prices.length > 0 ? prices : null;
}

/**
 * Return current prices for a commodity, hitting AGMARKNET at most once
 * per cache window. When the upstream feed is unavailable the last
 * cached result is served (marked stale once past the TTL) rather than
 * failing the request outright.
 */
export async function getMarketPrices(
  commodity: string,
  state?: string,
  now = Date.now(),
): Promise<{ prices: MarketPrice[]; cached: boolean } | null> {
  const key = cacheKey(commodity, state);
  const entry = priceCache.get(key);

  if (entry && now - entry.fetchedAt < CACHE_TTL_MS) {
    return { prices: entry.prices, cached: true };
  }

  let fresh: MarketPrice[] | null = null;
  try {
    fresh = await fetchFromAgmarknet(commodity, state);
  } catch {
    fresh = null; // network failure falls through to the cached copy
  }

  if (fresh) {
    priceCache.set(key, { fetchedAt: now, prices: fresh });
    for (const price of fresh) recordHistory(price);
    return { prices: fresh, cached: false };
  }

  if (entry) {
    const stalePrices = entry.prices.map((p) => ({ ...p, stale: true }));
    return { prices: stalePrices, cached: true };
  }

  return null;
}

/** Test hook: reset module state between test cases. */
export function clearMarketPriceState(): void {
  priceCache.clear();
  priceHistory.clear();
}
