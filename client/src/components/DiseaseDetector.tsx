import React, { useState } from "react";

export default function DiseaseDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = (f?: File) => {
    setFile(f || null);
    setResult(null);
    setError(null);
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!file) return setError("Please choose an image file");
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/detect-disease", { method: "POST", body: form });
      if (!res.ok) throw new Error("Detection failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Crop Disease Detector</h3>
      <form onSubmit={submit} className="space-y-3">
        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-3 py-2" onClick={submit} disabled={loading || !file}>Detect</button>
          <button type="button" className="px-3 py-2" onClick={() => onFile(undefined)}>Clear</button>
        </div>
      </form>

      {loading && <div className="mt-2">Detecting…</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}

      {result && (
        <div className="mt-4 border p-3">
          <div><strong>Disease:</strong> {result.disease}</div>
          <div><strong>Confidence:</strong> {result.confidence}</div>
          <div className="mt-2"><strong>Treatment suggestions:</strong>
            <ul className="list-disc ml-6">
              {(result.treatments || []).map((t: string, i: number) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
