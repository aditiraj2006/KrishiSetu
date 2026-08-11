import React, { useState } from "react";

type RecordItem = Record<string, any>;

export default function MandiPriceTracker() {
  const [state, setState] = useState("");
  const [commodity, setCommodity] = useState("");
  const [results, setResults] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (state) params.set("state", state);
      if (commodity) params.set("commodity", commodity);
      const res = await fetch(`/api/mandi-prices?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch mandi prices");
      const data = await res.json();
      setResults(data || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Mandi Price Tracker</h3>
      <form onSubmit={search} className="flex gap-2 mb-4">
        <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className="border p-2" />
        <input placeholder="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} className="border p-2" />
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-2">Search</button>
      </form>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Mandi</th>
                <th className="text-left">District</th>
                <th className="text-left">Min</th>
                <th className="text-left">Max</th>
                <th className="text-left">Modal</th>
                <th className="text-left">Arrival</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-t">
                  <td>{r.center || r.mandi || r.market || "-"}</td>
                  <td>{r.district || r.District || r.state || "-"}</td>
                  <td>{r.min_price ?? r.minimum_price ?? "-"}</td>
                  <td>{r.max_price ?? r.maximum_price ?? "-"}</td>
                  <td>{r.modal_price ?? r.modal ?? "-"}</td>
                  <td>{r.arrival_date || r.date || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
