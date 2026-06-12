import { z } from "zod";

// Market Price Schema
export const marketPriceSchema = z.object({
  crop: z.string().min(1, "Crop name is required"),
  variety: z.string().optional(),
  market: z.string().min(1, "Market name is required"),
  market_city: z.string().optional(),
  market_state: z.string().optional(),
  price_per_unit: z.number().positive("Price must be positive"),
  unit: z.enum(["kg", "quintal", "ton"], {
    errorMap: () => ({ message: "Unit must be kg, quintal, or ton" }),
  }),
  min_price: z.number().positive("Minimum price must be positive"),
  max_price: z.number().positive("Maximum price must be positive"),
  modal_price: z.number().positive("Modal price must be positive"),
  last_updated: z.date(),
  timestamp: z.date().default(() => new Date()),
});

export type MarketPrice = z.infer<typeof marketPriceSchema>;

// Market data cache with update tracking
class MarketPricingService {
  private cache: Map<string, MarketPrice[]> = new Map();
  private lastUpdated: Map<string, Date> = new Map();
  private updateInterval: number = 4 * 60 * 60 * 1000; // 4 hours

  /**
   * Fetch real-time market prices from AGMARKNET API
   * This integrates with India's Agricultural Market Network
   */
  async fetchRealtimePrices(crop: string, market?: string): Promise<MarketPrice[]> {
    try {
      const cacheKey = `${crop}:${market || "all"}`;
      const cached = this.cache.get(cacheKey);
      const lastUpdate = this.lastUpdated.get(cacheKey);

      // Return cached data if fresh (less than 4 hours old)
      if (cached && lastUpdate && Date.now() - lastUpdate.getTime() < this.updateInterval) {
        return cached;
      }

      // Fetch fresh data from AGMARKNET API
      const prices = await this.queryAGMARKNETAPI(crop, market);

      // Cache the results
      this.cache.set(cacheKey, prices);
      this.lastUpdated.set(cacheKey, new Date());

      return prices;
    } catch (error) {
      console.error("Error fetching market prices:", error);
      throw new Error("Failed to fetch market prices");
    }
  }

  /**
   * Query AGMARKNET API for market prices
   */
  private async queryAGMARKNETAPI(crop: string, market?: string): Promise<MarketPrice[]> {
    // This would integrate with actual AGMARKNET API
    // For now, returning structured response format
    const agmarknetBaseUrl = process.env.AGMARKNET_API_URL || "https://agmarknet.gov.in/api/v1";

    try {
      const queryParams = new URLSearchParams({
        commodity: crop,
        ...(market && { market: market }),
      });

      const response = await fetch(`${agmarknetBaseUrl}/prices?${queryParams}`, {
        headers: {
          "Authorization": `Bearer ${process.env.AGMARKNET_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`AGMARKNET API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAGMARKNETResponse(data);
    } catch (error) {
      console.error("AGMARKNET API request failed:", error);
      throw error;
    }
  }

  /**
   * Parse AGMARKNET API response to standard format
   */
  private parseAGMARKNETResponse(data: any): MarketPrice[] {
    return data.records?.map((record: any) => ({
      crop: record.commodity,
      variety: record.variety,
      market: record.market_name,
      market_city: record.market_city,
      market_state: record.market_state,
      price_per_unit: record.price,
      unit: "quintal",
      min_price: record.min_price,
      max_price: record.max_price,
      modal_price: record.modal_price,
      last_updated: new Date(record.arrival_date),
      timestamp: new Date(),
    })) || [];
  }

  /**
   * Get price trend data (7-day history)
   */
  async getPriceTrend(crop: string, market: string, days: number = 7): Promise<MarketPrice[]> {
    // This would query historical data from database
    // Returns time series of prices for trend analysis
    try {
      const trend = await this.fetchPriceTrendFromDB(crop, market, days);
      return trend;
    } catch (error) {
      console.error("Error fetching price trend:", error);
      throw error;
    }
  }

  private async fetchPriceTrendFromDB(crop: string, market: string, days: number): Promise<MarketPrice[]> {
    // Implementation for fetching historical price data
    const now = new Date();
    const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // This would be implemented with actual database query
    return [];
  }

  /**
   * Get prices from nearby markets for comparison
   */
  async getNearbyMarketPrices(
    crop: string,
    userLocation: { latitude: number; longitude: number },
    radiusKm: number = 50,
  ): Promise<MarketPrice[]> {
    try {
      const nearbyMarkets = await this.findNearbyMarkets(userLocation, radiusKm);
      const allPrices: MarketPrice[] = [];

      for (const market of nearbyMarkets) {
        const prices = await this.fetchRealtimePrices(crop, market.name);
        allPrices.push(...prices);
      }

      // Sort by price (ascending) to show best options first
      return allPrices.sort((a, b) => a.price_per_unit - b.price_per_unit);
    } catch (error) {
      console.error("Error fetching nearby market prices:", error);
      throw error;
    }
  }

  private async findNearbyMarkets(
    location: { latitude: number; longitude: number },
    radiusKm: number,
  ): Promise<Array<{ name: string; location: { lat: number; lng: number } }>> {
    // This would integrate with market location database
    // Using geospatial queries to find nearby markets
    return [];
  }

  /**
   * Subscribe to price alerts
   */
  async subscribePriceAlert(
    userId: string,
    crop: string,
    targetPrice: number,
    alertType: "above" | "below",
  ): Promise<string> {
    // Implementation for setting up price alerts
    // Farmers get notified when prices cross target threshold
    try {
      const alertId = `${userId}-${crop}-${Date.now()}`;
      // Store alert in database
      return alertId;
    } catch (error) {
      console.error("Error setting up price alert:", error);
      throw error;
    }
  }

  /**
   * Predict next day's price based on trends
   */
  async predictNextDayPrice(crop: string, market: string): Promise<{
    predicted_price: number;
    trend: "up" | "down" | "stable";
    confidence: number;
  }> {
    try {
      const trend = await this.getPriceTrend(crop, market, 7);

      if (trend.length === 0) {
        throw new Error("Insufficient data for price prediction");
      }

      // Simple trend analysis (in production, use ML models)
      const prices = trend.map((t) => t.price_per_unit);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const lastPrice = prices[prices.length - 1];

      let trendDirection: "up" | "down" | "stable" = "stable";
      if (lastPrice > avgPrice * 1.02) {
        trendDirection = "up";
      } else if (lastPrice < avgPrice * 0.98) {
        trendDirection = "down";
      }

      // Simple prediction: assume trend continues with 70% confidence
      const predictedPrice = lastPrice * (trendDirection === "up" ? 1.02 : trendDirection === "down" ? 0.98 : 1);

      return {
        predicted_price: Math.round(predictedPrice * 100) / 100,
        trend: trendDirection,
        confidence: 0.7,
      };
    } catch (error) {
      console.error("Error predicting price:", error);
      throw error;
    }
  }

  /**
   * Clear stale cache entries
   */
  clearStaleCache(): void {
    const now = new Date();
    for (const [key, lastUpdate] of this.lastUpdated.entries()) {
      if (now.getTime() - lastUpdate.getTime() > this.updateInterval) {
        this.cache.delete(key);
        this.lastUpdated.delete(key);
      }
    }
  }
}

export const marketPricingService = new MarketPricingService();
