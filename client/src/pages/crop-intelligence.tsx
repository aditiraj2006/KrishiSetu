import React, { useState } from 'react';

export default function CropIntelligence() {
  const [formData, setFormData] = useState({ location: '', soilType: '', season: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setRecommendations([]);

    // Simulate API/AI Processing Delay
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Mock Intelligence Logic based on inputs
    const mockResults = [
      {
        crop: "Wheat",
        match: "94%",
        reason: "Optimal match for chosen soil type and current historical weather patterns.",
        trend: "High Demand (↑ 12% price increase this month)",
        water: "Moderate"
      },
      {
        crop: "Mustard",
        match: "88%",
        reason: "Excellent drought resistance; suitable for current seasonal forecast.",
        trend: "Stable Demand",
        water: "Low"
      },
      {
        crop: "Chickpeas (Chana)",
        match: "82%",
        reason: "Good nitrogen-fixing properties to restore your selected soil type.",
        trend: "Rising Demand",
        water: "Low"
      }
    ];

    setRecommendations(mockResults);
    setIsAnalyzing(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2D8C4E] mb-2">Crop Decision Intelligence</h1>
        <p className="text-gray-600">Enter your field parameters to get data-driven crop recommendations for maximum yield and profitability.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
          <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location / Region</label>
              <input 
                type="text" name="location" value={formData.location} onChange={handleChange} required
                placeholder="e.g., Punjab, Maharashtra" 
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#2D8C4E] focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
              <select name="soilType" value={formData.soilType} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#2D8C4E] focus:outline-none">
                <option value="">Select Soil...</option>
                <option value="loamy">Loamy</option>
                <option value="clay">Clay</option>
                <option value="sandy">Sandy</option>
                <option value="black">Black Soil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
              <select name="season" value={formData.season} onChange={handleChange} required className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#2D8C4E] focus:outline-none">
                <option value="">Select Season...</option>
                <option value="kharif">Kharif (Monsoon)</option>
                <option value="rabi">Rabi (Winter)</option>
                <option value="zaid">Zaid (Summer)</option>
              </select>
            </div>

            <button 
              type="submit" disabled={isAnalyzing}
              className={`w-full p-3 mt-2 rounded text-white font-bold transition-colors ${isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2D8C4E] hover:bg-green-700'}`}
            >
              {isAnalyzing ? 'Analyzing Data...' : 'Generate Recommendations'}
            </button>
          </form>
        </div>

        {/* Results Dashboard */}
        <div className="md:col-span-2">
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D8C4E] mb-4"></div>
              <p>Cross-referencing soil data with market trends...</p>
            </div>
          )}

          {!isAnalyzing && recommendations.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg flex items-center justify-center h-full min-h-[300px] text-gray-500 text-center p-6">
              Fill out the parameters on the left to generate intelligent crop recommendations.
            </div>
          )}

          {!isAnalyzing && recommendations.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Recommended Crops</h2>
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-[#2D8C4E]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{rec.crop}</h3>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Match: {rec.match}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3"><span className="font-semibold text-gray-800">Reason:</span> {rec.reason}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                      💧 Water Req: {rec.water}
                    </span>
                    <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
                      📈 {rec.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
