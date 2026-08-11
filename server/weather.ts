const OPENWEATHER_API = "https://api.openweathermap.org/data/2.5/forecast";

export async function fetchWeatherForecast(lat: string | number, lon: string | number) {
  try {
    const key = process.env.OPENWEATHER_API_KEY || "";
    if (!key) throw new Error("OPENWEATHER_API_KEY not configured");

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      appid: key,
      units: "metric",
    });

    const url = `${OPENWEATHER_API}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenWeather API error ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("Error fetching weather:", err?.message || err);
    throw err;
  }
}
