/**
 * useConditionAlerts
 * 
 * Monitors product/shipment condition data and returns:
 * - Active alerts list
 * - Whether any critical alerts exist
 * - Alert severity levels
 * 
 * Integrate with your existing useProducts hook.
 */

import { useMemo } from "react";
import type { AssistantProduct } from "@/components/AIAssistant";

export type AlertSeverity = "critical" | "warning" | "info";

export interface ConditionAlert {
  productId: string;
  productName: string;
  severity: AlertSeverity;
  message: string;
  messageHi: string;
  action: string;
  actionHi: string;
  timestamp: Date;
}

export function useConditionAlerts(products: AssistantProduct[]): {
  alerts: ConditionAlert[];
  hasCritical: boolean;
  hasWarnings: boolean;
  alertCount: number;
} {
  const alerts = useMemo<ConditionAlert[]>(() => {
    const result: ConditionAlert[] = [];

    for (const product of products) {
      // Temperature alerts
      if (product.currentTemperature !== undefined) {
        if (product.currentTemperature > 40) {
          result.push({
            productId: product.id,
            productName: product.name,
            severity: "critical",
            message: `${product.name} is at dangerously high temperature (${product.currentTemperature}°C). Risk of rapid spoilage.`,
            messageHi: `${product.name} का तापमान बहुत अधिक है (${product.currentTemperature}°C)। जल्दी खराब होने का खतरा।`,
            action: "Move to cold storage immediately or deliver within 2 hours.",
            actionHi: "तुरंत कोल्ड स्टोरेज में रखें या 2 घंटे में डिलीवरी करें।",
            timestamp: new Date(),
          });
        } else if (product.currentTemperature > 35) {
          result.push({
            productId: product.id,
            productName: product.name,
            severity: "warning",
            message: `${product.name} temperature is elevated (${product.currentTemperature}°C).`,
            messageHi: `${product.name} का तापमान बढ़ा हुआ है (${product.currentTemperature}°C)।`,
            action: "Consider expediting delivery or cooling the storage area.",
            actionHi: "डिलीवरी जल्दी करें या स्टोरेज को ठंडा करें।",
            timestamp: new Date(),
          });
        }
      }

      // Humidity alerts
      if (product.humidity !== undefined) {
        if (product.humidity > 90) {
          result.push({
            productId: product.id,
            productName: product.name,
            severity: "critical",
            message: `${product.name} humidity is critically high (${product.humidity}%). Mold risk is high.`,
            messageHi: `${product.name} की नमी बहुत अधिक है (${product.humidity}%)। फंगस का खतरा है।`,
            action: "Improve ventilation and reduce humidity immediately.",
            actionHi: "तुरंत वेंटिलेशन बढ़ाएं और नमी कम करें।",
            timestamp: new Date(),
          });
        } else if (product.humidity > 85) {
          result.push({
            productId: product.id,
            productName: product.name,
            severity: "warning",
            message: `${product.name} is stored at high humidity (${product.humidity}%).`,
            messageHi: `${product.name} अधिक नमी में रखी है (${product.humidity}%)।`,
            action: "Monitor closely. Consider better ventilated storage.",
            actionHi: "ध्यान से देखें। बेहतर वेंटिलेशन वाली जगह पर रखें।",
            timestamp: new Date(),
          });
        }
      }

      // Transit time alerts
      if (product.transitHours !== undefined) {
        const isPerishable =
          product.category?.toLowerCase().match(/vegetable|fruit|dairy|flower/) ||
          product.name?.toLowerCase().match(/tomato|onion|potato|milk|mango|grape|flower/);

        if (product.transitHours > 24) {
          result.push({
            productId: product.id,
            productName: product.name,
            severity: isPerishable ? "critical" : "warning",
            message: `${product.name} has been in transit for ${product.transitHours} hours.`,
            messageHi: `${product.name} ${product.transitHours} घंटे से ट्रांजिट में है।`,
            action: isPerishable
              ? "Expedite delivery urgently. Check for spoilage."
              : "Check shipment status and expected delivery.",
            actionHi: isPerishable
              ? "तुरंत डिलीवरी तेज़ करें। खराब होने की जांच करें।"
              : "शिपमेंट स्टेटस और डिलीवरी समय की जांच करें।",
            timestamp: new Date(),
          });
        } else if (product.transitHours > 12 && isPerishable) {
          result.push({
            productId: product.id,
            productName: product.name,
            severity: "warning",
            message: `${product.name} has been in transit for ${product.transitHours} hours — approaching the safe window for perishables.`,
            messageHi: `${product.name} ${product.transitHours} घंटे से ट्रांजिट में है — जल्दी खराब होने वाली वस्तु के लिए सुरक्षित समय सीमा करीब है।`,
            action: "Ensure cold chain is maintained and accelerate delivery.",
            actionHi: "कोल्ड चेन सुनिश्चित करें और डिलीवरी तेज़ करें।",
            timestamp: new Date(),
          });
        }
      }
    }

    // Sort: critical first, then by timestamp
    return result.sort((a, b) => {
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (b.severity === "critical" && a.severity !== "critical") return 1;
      return 0;
    });
  }, [products]);

  return {
    alerts,
    hasCritical: alerts.some((a) => a.severity === "critical"),
    hasWarnings: alerts.some((a) => a.severity === "warning"),
    alertCount: alerts.length,
  };
}