/**
 * ProfitOptimizer
 * 
 * Standalone AI-powered profit optimization panel.
 * Uses Claude to analyze produce + market context and give sell timing advice.
 * 
 * Can be used as a page section or modal content.
 * 
 * Usage:
 *   <ProfitOptimizer
 *     produce={{ name: "Tomato", quantity: 500, unit: "kg" }}
 *     region="Jaipur"
 *     language="en"
 *   />
 */

import { useState } from "react";
import { TrendingUp, MapPin, Calendar, IndianRupee, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const GREEN = "#2D8C4E";

interface ProduceInput {
  name: string;
  quantity?: number;
  unit?: string;
}

interface OptimizationResult {
  recommendation: string;
  bestDay: string;
  bestMarket: string;
  estimatedPrice: string;
  improvement: string;
  risks: string[];
}

interface ProfitOptimizerProps {
  produce?: ProduceInput;
  region?: string;
  language?: "en" | "hi";
}

const CROP_OPTIONS = [
  "Tomato", "Onion", "Potato", "Wheat", "Rice", "Maize",
  "Mustard", "Soybean", "Cotton", "Garlic", "Ginger",
  "Cauliflower", "Cabbage", "Brinjal", "Okra", "Chilli",
  "Mango", "Grapes", "Pomegranate", "Banana",
];

const REGION_OPTIONS = [
  "Jaipur", "Delhi", "Mumbai", "Pune", "Nashik",
  "Ahmedabad", "Lucknow", "Patna", "Bhopal", "Hyderabad",
  "Bangalore", "Chennai", "Kolkata", "Chandigarh",
];

export default function ProfitOptimizer({
  produce: initialProduce,
  region: initialRegion = "Jaipur",
  language = "en",
}: ProfitOptimizerProps) {
  const [cropName, setCropName] = useState(initialProduce?.name ?? "Tomato");
  const [quantity, setQuantity] = useState(String(initialProduce?.quantity ?? 500));
  const [unit, setUnit] = useState(initialProduce?.unit ?? "kg");
  const [region, setRegion] = useState(initialRegion);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHi = language === "hi";

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const prompt = isHi
      ? `मेरे पास ${quantity} ${unit} ${cropName} हैं, जो ${region} के पास हैं। मुझे बताएं:
1. इस हफ्ते बेचने का सबसे अच्छा दिन और मंडी कौन सी है?
2. अनुमानित मंडी मूल्य क्या है?
3. आज की तुलना में कितना अधिक लाभ हो सकता है?
4. क्या जोखिम हैं?
JSON में जवाब दें: { "recommendation": "...", "bestDay": "...", "bestMarket": "...", "estimatedPrice": "...", "improvement": "...", "risks": ["..."] }`
      : `I have ${quantity} ${unit} of ${cropName} near ${region}. Analyze and tell me:
1. Best day this week and best mandi to sell at?
2. Estimated mandi price range?
3. How much more % profit vs selling today?
4. What are the key risks?
Respond ONLY with JSON (no markdown): { "recommendation": "...", "bestDay": "...", "bestMarket": "...", "estimatedPrice": "...", "improvement": "...", "risks": ["..."] }`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a market intelligence assistant for Indian agricultural markets. You have deep knowledge of seasonal price patterns, mandi behavior, and supply-demand dynamics for all major Indian crops. Always provide realistic, specific, actionable advice grounded in actual Indian mandi patterns. Use real mandis: Azadpur (Delhi), Vashi (Mumbai), Gultekdi (Pune), Lasalgaon (Nashik), etc. Always respond ONLY with valid JSON, no other text.`,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const text = data.content
        ?.filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("");

      // Strip any markdown fences if present
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed: OptimizationResult = JSON.parse(clean);
      setResult(parsed);
    } catch {
      setError(
        isHi
          ? "विश्लेषण में समस्या हुई। कृपया फिर से कोशिश करें।"
          : "Analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: GREEN }}>
          <TrendingUp className="w-5 h-5" />
          {isHi ? "AI लाभ अनुकूलक" : "AI Profit Optimizer"}
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          {isHi
            ? "अपनी फसल की जानकारी डालें, AI बताएगा कब और कहाँ बेचें"
            : "Enter your produce details — AI will suggest when and where to sell"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input form */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs text-gray-600 mb-1 block">
              {isHi ? "फसल का नाम" : "Crop Name"}
            </Label>
            <Select value={cropName} onValueChange={setCropName}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CROP_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-1 block">
              {isHi ? "मात्रा" : "Quantity"}
            </Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-9 text-sm"
              placeholder="500"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-600 mb-1 block">
              {isHi ? "इकाई" : "Unit"}
            </Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["kg", "quintal", "tonne", "crate"].map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label className="text-xs text-gray-600 mb-1 block">
              {isHi ? "आपका क्षेत्र" : "Your Region"}
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={analyze}
          disabled={loading}
          className="w-full h-9 text-sm font-medium"
          style={{ backgroundColor: GREEN }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isHi ? "विश्लेषण हो रहा है..." : "Analyzing..."}
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              {isHi ? "सर्वोत्तम समय खोजें" : "Find Best Time to Sell"}
            </>
          )}
        </Button>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3 pt-1">
            <div className="h-px bg-gray-100" />

            {/* Main recommendation */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm text-green-800 font-medium">
                {isHi ? "💡 सुझाव" : "💡 Recommendation"}
              </p>
              <p className="text-sm text-green-700 mt-1">{result.recommendation}</p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <Calendar className="w-4 h-4 mx-auto mb-1" style={{ color: GREEN }} />
                <p className="text-[10px] text-gray-500">{isHi ? "सर्वोत्तम दिन" : "Best Day"}</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{result.bestDay}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <MapPin className="w-4 h-4 mx-auto mb-1" style={{ color: GREEN }} />
                <p className="text-[10px] text-gray-500">{isHi ? "बाजार" : "Market"}</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5 leading-tight">{result.bestMarket}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <IndianRupee className="w-4 h-4 mx-auto mb-1" style={{ color: GREEN }} />
                <p className="text-[10px] text-gray-500">{isHi ? "अनुमानित भाव" : "Est. Price"}</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">{result.estimatedPrice}</p>
              </div>
            </div>

            {/* Improvement badge */}
            <div className="flex items-center gap-2">
              <Badge
                className="text-xs font-semibold px-2.5 py-0.5"
                style={{ backgroundColor: "#d1fae5", color: "#065f46", border: "none" }}
              >
                📈 {result.improvement}
              </Badge>
              <span className="text-xs text-gray-500">
                {isHi ? "आज की तुलना में" : "vs selling today"}
              </span>
            </div>

            {/* Risks */}
            {result.risks?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">
                  {isHi ? "⚠️ ध्यान रखें:" : "⚠️ Watch out for:"}
                </p>
                <ul className="space-y-1">
                  {result.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-amber-500 flex-shrink-0">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={analyze}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              {isHi ? "दोबारा विश्लेषण करें" : "Re-analyze"}
            </button>

            <p className="text-[10px] text-gray-400">
              {isHi
                ? "* ये अनुमानित भाव हैं। वास्तविक भाव भिन्न हो सकते हैं।"
                : "* Estimated prices. Actual mandi prices may vary."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}