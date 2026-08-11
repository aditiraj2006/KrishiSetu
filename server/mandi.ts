import { URLSearchParams } from "url";

const MANDI_API = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

export async function fetchMandiPrices(state?: string, commodity?: string, limit = 20) {
  try {
    const key = process.env.MANDI_API_KEY || "";
    const params: Record<string, string> = {
      "format": "json",
      "limit": String(limit),
    };
    if (state) params["filters[State]"] = state;
    if (commodity) params["filters[Commodity]"] = commodity;
    if (key) params["api-key"] = key;

    const url = `${MANDI_API}?${new URLSearchParams(params).toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Agmarknet API responded with ${res.status}: ${text}`);
    }
    const data = await res.json();
    // The API returns an object with 'records' array
    return data.records || [];
  } catch (err: any) {
    console.error("Error fetching mandi prices:", err?.message || err);
    throw err;
  }
}
