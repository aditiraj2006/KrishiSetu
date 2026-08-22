import React, { useEffect, useState } from "react";

export default function WeatherWidget() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setCoords(null),
    );
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!coords) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`);
        if (!res.ok) throw new Error("Failed to fetch weather");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [coords]);

  return (
    <div className="p-4 border">
      <h3 className="text-lg font-semibold mb-2">Local Weather Forecast</h3>
      {!coords && <div>Location not available. Enter coordinates below.</div>}
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {data && (
        <div>
          <div className="text-sm">City: {data.city?.name || "—"}</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Array.isArray(data.list) && data.list.slice(0, 6).map((item: any, i: number) => (
              <div key={i} className="border p-2 text-xs">
                <div>{new Date(item.dt * 1000).toLocaleString()}</div>
                <div>Temp: {item.main?.temp} °C</div>
                <div>Humidity: {item.main?.humidity}%</div>
                <div>{item.weather?.[0]?.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
