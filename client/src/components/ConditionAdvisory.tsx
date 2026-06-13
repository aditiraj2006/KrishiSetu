/**
 * ConditionAdvisory
 * 
 * Displays proactive condition alerts from supply chain/condition log data.
 * Shows as a dismissible banner on the dashboard.
 * 
 * Usage:
 *   <ConditionAdvisory products={products} language="en" />
 */

import { useState } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp, Thermometer, Droplets, Clock } from "lucide-react";
import { useConditionAlerts } from "@/hooks/useConditionAlerts";
import type { AssistantProduct } from "@/components/AIAssistant";

const GREEN = "#2D8C4E";

interface ConditionAdvisoryProps {
  products: AssistantProduct[];
  language?: "en" | "hi";
  onAskAssistant?: (question: string) => void;
}

export default function ConditionAdvisory({
  products,
  language = "en",
  onAskAssistant,
}: ConditionAdvisoryProps) {
  const { alerts, hasCritical, alertCount } = useConditionAlerts(products);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);
  const isHi = language === "hi";

  const visible = alerts.filter((a) => !dismissed.has(a.productId + a.severity));
  if (visible.length === 0) return null;

  return (
    <div
      className={`rounded-xl border mb-4 overflow-hidden ${
        hasCritical ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="w-4 h-4 flex-shrink-0"
            style={{ color: hasCritical ? "#dc2626" : "#d97706" }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: hasCritical ? "#dc2626" : "#92400e" }}
          >
            {isHi
              ? `${alertCount} कंडीशन अलर्ट`
              : `${alertCount} Condition Alert${alertCount > 1 ? "s" : ""}`}
          </span>
          {hasCritical && (
            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {isHi ? "गंभीर" : "Critical"}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {/* Alert list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-2.5">
          {visible.map((alert) => (
            <div
              key={alert.productId + alert.severity}
              className={`rounded-lg p-3 relative ${
                alert.severity === "critical"
                  ? "bg-red-100 border border-red-200"
                  : "bg-amber-100 border border-amber-200"
              }`}
            >
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                onClick={() =>
                  setDismissed(
                    (d) => new Set([...d, alert.productId + alert.severity])
                  )
                }
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-start gap-2 pr-5">
                {/* Icon based on issue type */}
                {alert.message.includes("temperature") || alert.message.includes("तापमान") ? (
                  <Thermometer className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                ) : alert.message.includes("humidity") || alert.message.includes("नमी") ? (
                  <Droplets className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                ) : (
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-600" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">
                    {isHi ? alert.messageHi : alert.message}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {isHi
                      ? `✅ सुझाव: ${alert.actionHi}`
                      : `✅ Action: ${alert.action}`}
                  </p>

                  {onAskAssistant && (
                    <button
                      onClick={() =>
                        onAskAssistant(
                          isHi
                            ? `${alert.productName} के बारे में क्या करना चाहिए?`
                            : `What should I do about ${alert.productName}?`
                        )
                      }
                      className="text-[11px] font-medium mt-1.5 underline"
                      style={{ color: GREEN }}
                    >
                      {isHi ? "AI से पूछें →" : "Ask AI assistant →"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}