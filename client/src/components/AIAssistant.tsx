
/**
 * KrishiSetu AI Assistant Widget
 * 
 * A persistent, floating AI chat assistant that:
 * - Answers agricultural & platform queries in English/Hindi
 * - Provides profit optimization suggestions
 * - Surfaces condition log warnings proactively
 * - Guides new users through onboarding
 * 
 * Drop-in usage: <AIAssistant user={currentUser} products={products} />
 */
 
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Sprout,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Mic,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
 
// ─── Types ───────────────────────────────────────────────────────────────────
 
export interface AssistantProduct {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  currentTemperature?: number;
  humidity?: number;
  transitHours?: number;
  storageType?: string;
}
 
export interface AssistantUser {
  uid: string;
  displayName?: string | null;
  role?: "farmer" | "distributor" | "retailer" | "admin";
  region?: string;
  isNewUser?: boolean;
}
 
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "alert" | "tip" | "onboarding";
  quickReplies?: string[];
}
 
interface AIAssistantProps {
  user?: AssistantUser | null;
  products?: AssistantProduct[];
  /** Override language; defaults to "en" */
  language?: "en" | "hi";
  /** Fired when a platform navigation action is requested */
  onNavigate?: (route: string) => void;
}
 
// ─── Constants ───────────────────────────────────────────────────────────────
 
const GREEN = "#2D8C4E";
 
const WELCOME_MESSAGES: Record<string, string> = {
  en: "Namaste! 🌾 I'm your KrishiSetu assistant. I can help you:\n• Find the best time & market to sell your produce\n• Interpret supply chain & condition data\n• Answer platform questions\n• Get real-time mandi prices\n\nHow can I help you today?",
  hi: "नमस्ते! 🌾 मैं आपका KrishiSetu सहायक हूँ। मैं आपकी मदद कर सकता हूँ:\n• अपनी फसल बेचने का सबसे अच्छा समय और बाजार खोजें\n• सप्लाई चेन और कंडीशन डेटा समझें\n• प्लेटफॉर्म से जुड़े सवालों के जवाब पाएं\n• रियल-टाइम मंडी भाव जानें\n\nआज मैं आपकी कैसे मदद कर सकता हूँ?",
};
 
const ONBOARDING_MESSAGE: Record<string, string> = {
  en: "👋 Welcome to KrishiSetu! It looks like this is your first time here. Would you like me to give you a quick tour?\n\nI can show you how to:\n📦 Track your first shipment\n📱 Generate a QR code for your produce\n💰 Check today's mandi prices\n🗺️ View your supply chain map",
  hi: "👋 KrishiSetu में आपका स्वागत है! लगता है यह आपकी पहली बार है। क्या आप चाहते हैं कि मैं आपको एक त्वरित परिचय दूं?\n\nमैं आपको दिखा सकता हूँ:\n📦 अपनी पहली शिपमेंट कैसे ट्रैक करें\n📱 अपनी फसल के लिए QR कोड कैसे बनाएं\n💰 आज के मंडी भाव कैसे देखें\n🗺️ अपनी सप्लाई चेन मैप कैसे देखें",
};
 
const QUICK_REPLY_SETS: Record<string, string[]> = {
  initial_en: [
    "Best time to sell tomatoes?",
    "Check mandi prices",
    "How to add shipment?",
    "Condition log warning?",
  ],
  initial_hi: [
    "टमाटर बेचने का सही समय?",
    "मंडी भाव देखें",
    "शिपमेंट कैसे जोड़ें?",
    "कंडीशन लॉग वार्निंग?",
  ],
};
 
// ─── Build system prompt from user context ───────────────────────────────────
 
function buildSystemPrompt(
  user: AssistantUser | null | undefined,
  products: AssistantProduct[],
  language: "en" | "hi"
): string {
  const role = user?.role ?? "farmer";
  const region = user?.region ?? "Rajasthan";
  const lang = language === "hi" ? "Hindi" : "English";
 
  const productContext =
    products.length > 0
      ? `\nUser's current products/shipments:\n${products
          .map(
            (p) =>
              `- ${p.name} (${p.quantity ?? "?"} ${p.unit ?? "kg"}), ` +
              `temp: ${p.currentTemperature ?? "N/A"}°C, ` +
              `humidity: ${p.humidity ?? "N/A"}%, ` +
              `in transit: ${p.transitHours ?? 0}h`
          )
          .join("\n")}`
      : "\nNo active shipments.";
 
  const conditionAlerts = products
    .filter(
      (p) =>
        (p.currentTemperature && p.currentTemperature > 35) ||
        (p.humidity && p.humidity > 85) ||
        (p.transitHours && p.transitHours > 12)
    )
    .map((p) => {
      const issues = [];
      if (p.currentTemperature && p.currentTemperature > 35)
        issues.push(`high temperature (${p.currentTemperature}°C)`);
      if (p.humidity && p.humidity > 85)
        issues.push(`high humidity (${p.humidity}%)`);
      if (p.transitHours && p.transitHours > 12)
        issues.push(`long transit (${p.transitHours}h)`);
      return `ALERT: ${p.name} has ${issues.join(", ")}`;
    });
 
  return `You are KrishiSetu Saathi (साथी), an AI assistant embedded in KrishiSetu — an agricultural supply chain platform for Indian farmers, distributors, and retailers.
 
LANGUAGE: Always respond in ${lang}. If user writes in Hindi, respond in Hindi. If in English, respond in English.
 
USER CONTEXT:
- Role: ${role}
- Region: ${region}
- Name: ${user?.displayName ?? "Farmer"}
${productContext}
${conditionAlerts.length > 0 ? "\nACTIVE CONDITION ALERTS:\n" + conditionAlerts.join("\n") : ""}
 
YOUR CAPABILITIES:
1. PROFIT OPTIMIZER: Analyze produce type, quantity, and market trends to suggest optimal selling time/market. Use realistic Indian mandi price patterns. Reference platforms like eNAM and local mandis.
2. CONDITION ADVISORY: Flag risks from temperature (>35°C bad for most produce), humidity (>85% risks mold), transit time (>12h for perishables needs action). Give specific advice.
3. PLATFORM GUIDE: Explain how to use KrishiSetu features — adding shipments, generating QR codes, reading supply chain maps, managing profiles, payment proofs.
4. MARKET INTELLIGENCE: Provide realistic mandi price insights for Indian crops. Reference Jaipur, Delhi, Mumbai, Nashik, Azadpur mandis where relevant.
5. AGRICULTURAL ADVICE: Crop storage, post-harvest handling, cold chain requirements.
 
TONE RULES:
- Simple, friendly, farmer-accessible language. No jargon.
- Short paragraphs. Use emojis sparingly but helpfully (🌾 💰 🌡️ 📦 ✅ ⚠️).
- For condition alerts, be direct and urgent.
- For pricing, give specific numbers (e.g., "₹18-22/kg in Jaipur mandi this week").
- Always end with a follow-up question or offer to help further.
 
PLATFORM NAVIGATION HINTS:
- To add shipment: Dashboard → "Add New Shipment" button
- To generate QR: Registered Products → select product → "Generate QR"  
- To view supply chain map: Dashboard → "Supply Chain" tab
- Condition logs: Dashboard → select shipment → "Condition Log"
- Mandi prices: Currently integrated via eNAM API in the platform
 
Do NOT make up regulatory or legal advice. Do NOT promise specific prices as guaranteed. Always note market prices are estimates.`;
}
 
// ─── Main Component ───────────────────────────────────────────────────────────
 
export default function AIAssistant({
  user,
  products = [],
  language = "en",
  onNavigate,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState<"en" | "hi">(language);
  const [hasUnread, setHasUnread] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
 
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
 
  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);
 
  // ── Initialize chat on open ───────────────────────────────────────────────
  const initSession = useCallback(() => {
    if (sessionStarted) return;
    setSessionStarted(true);
 
    const initialMsg: Message = {
      id: "welcome",
      role: "assistant",
      content: user?.isNewUser
        ? ONBOARDING_MESSAGE[currentLang]
        : WELCOME_MESSAGES[currentLang],
      timestamp: new Date(),
      type: user?.isNewUser ? "onboarding" : "text",
      quickReplies:
        QUICK_REPLY_SETS[`initial_${currentLang}`] ??
        QUICK_REPLY_SETS.initial_en,
    };
 
    // Check for condition alerts to surface proactively
    const alertProducts = products.filter(
      (p) =>
        (p.currentTemperature && p.currentTemperature > 35) ||
        (p.humidity && p.humidity > 85) ||
        (p.transitHours && p.transitHours > 12)
    );
 
    const msgs: Message[] = [initialMsg];
 
    if (alertProducts.length > 0) {
      const alertContent =
        currentLang === "hi"
          ? `⚠️ **ध्यान दें!** आपके ${alertProducts.length} शिपमेंट में कंडीशन अलर्ट हैं:\n` +
            alertProducts
              .map((p) => {
                const issues = [];
                if (p.currentTemperature && p.currentTemperature > 35)
                  issues.push(`तापमान ${p.currentTemperature}°C (बहुत अधिक)`);
                if (p.humidity && p.humidity > 85)
                  issues.push(`नमी ${p.humidity}% (बहुत अधिक)`);
                if (p.transitHours && p.transitHours > 12)
                  issues.push(`${p.transitHours} घंटे से ट्रांजिट में`);
                return `• **${p.name}**: ${issues.join(", ")}`;
              })
              .join("\n") +
            "\n\nमुझसे पूछें कि क्या करना चाहिए!"
          : `⚠️ **Heads up!** I noticed ${alertProducts.length} shipment(s) with condition alerts:\n` +
            alertProducts
              .map((p) => {
                const issues = [];
                if (p.currentTemperature && p.currentTemperature > 35)
                  issues.push(`temp at ${p.currentTemperature}°C`);
                if (p.humidity && p.humidity > 85)
                  issues.push(`humidity at ${p.humidity}%`);
                if (p.transitHours && p.transitHours > 12)
                  issues.push(`${p.transitHours}h in transit`);
                return `• **${p.name}**: ${issues.join(", ")}`;
              })
              .join("\n") +
            "\n\nAsk me what to do!";
 
      msgs.push({
        id: "alert-" + Date.now(),
        role: "assistant",
        content: alertContent,
        timestamp: new Date(),
        type: "alert",
        quickReplies:
          currentLang === "hi"
            ? alertProducts.map((p) => `${p.name} के बारे में क्या करें?`)
            : alertProducts.map((p) => `What to do about ${p.name}?`),
      });
    }
 
    setMessages(msgs);
  }, [sessionStarted, user, products, currentLang]);
 
  useEffect(() => {
    if (isOpen) {
      initSession();
      setHasUnread(false);
    }
  }, [isOpen, initSession]);
 
  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
 
      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();
 
      const userMsg: Message = {
        id: "u-" + Date.now(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
 
      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsLoading(true);
 
      // Build conversation history for API
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      history.push({ role: "user", content: trimmed });
 
      try {
        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: buildSystemPrompt(user, products, currentLang),
            messages: history,
          }),
        });
 
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
 
        const data = await response.json();
        const content = data.content
          ?.filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n");
 
        const assistantMsg: Message = {
          id: "a-" + Date.now(),
          role: "assistant",
          content: content || (currentLang === "hi" ? "माफ़ कीजिए, कुछ समस्या हुई।" : "Sorry, something went wrong."),
          timestamp: new Date(),
          type: "text",
        };
 
        setMessages((prev) => [...prev, assistantMsg]);
 
        if (!isOpen) setHasUnread(true);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) => [
          ...prev,
          {
            id: "err-" + Date.now(),
            role: "assistant",
            content:
              currentLang === "hi"
                ? "⚠️ नेटवर्क समस्या। कृपया फिर से कोशिश करें।"
                : "⚠️ Network issue. Please try again.",
            timestamp: new Date(),
            type: "text",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, user, products, currentLang, isOpen]
  );
 
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };
 
  const resetChat = () => {
    setMessages([]);
    setSessionStarted(false);
    initSession();
  };
 
  // ─── Render ────────────────────────────────────────────────────────────────
 
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open KrishiSetu AI Assistant"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl text-white font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-95 group"
        style={{ backgroundColor: GREEN }}
      >
        <Sprout className="w-5 h-5 flex-shrink-0" />
        <span className="hidden sm:inline">Saathi</span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}
        <span
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
          style={{ display: hasUnread ? "block" : "none" }}
        />
      </button>
    );
  }
 
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl bg-white border border-gray-100 transition-all duration-300 ${
        isMinimized ? "h-14 w-72" : "w-[360px] sm:w-[400px] h-[580px] sm:h-[620px]"
      }`}
      style={{ maxHeight: "calc(100dvh - 3rem)", maxWidth: "calc(100vw - 1.5rem)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-2xl text-white flex-shrink-0"
        style={{ backgroundColor: GREEN }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">KrishiSetu Saathi</p>
            <p className="text-[11px] text-green-100 mt-0.5">
              {isLoading
                ? currentLang === "hi"
                  ? "सोच रहा हूँ..."
                  : "Thinking..."
                : currentLang === "hi"
                ? "ऑनलाइन"
                : "Online"}
            </p>
          </div>
        </div>
 
        <div className="flex items-center gap-1">
          {/* Language toggle */}
          <button
            onClick={() => setCurrentLang((l) => (l === "en" ? "hi" : "en"))}
            className="text-[11px] font-bold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors"
            title="Toggle language"
          >
            {currentLang === "en" ? "हिं" : "EN"}
          </button>
 
          <button
            onClick={resetChat}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title="Reset chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
 
          <button
            onClick={() => setIsMinimized((m) => !m)}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minimize2 className="w-3.5 h-3.5" />
            )}
          </button>
 
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
 
      {!isMinimized && (
        <>
          {/* ── Suggestion chips ── */}
          <div className="flex gap-1.5 px-3 py-2 flex-shrink-0 overflow-x-auto scrollbar-hide border-b border-gray-50">
            {[
              {
                icon: <TrendingUp className="w-3 h-3" />,
                label: currentLang === "hi" ? "मंडी भाव" : "Mandi Prices",
                msg:
                  currentLang === "hi"
                    ? "आज के मंडी भाव क्या हैं?"
                    : "What are today's mandi prices?",
              },
              {
                icon: <AlertTriangle className="w-3 h-3" />,
                label: currentLang === "hi" ? "चेतावनी" : "Alerts",
                msg:
                  currentLang === "hi"
                    ? "मेरे शिपमेंट में क्या अलर्ट हैं?"
                    : "Any condition alerts on my shipments?",
              },
              {
                icon: <HelpCircle className="w-3 h-3" />,
                label: currentLang === "hi" ? "मदद" : "Help",
                msg:
                  currentLang === "hi"
                    ? "शिपमेंट कैसे जोड़ें?"
                    : "How do I add a shipment?",
              },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => sendMessage(chip.msg)}
                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-gray-200 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all whitespace-nowrap flex-shrink-0"
                style={{ color: "#555" }}
              >
                {chip.icon}
                {chip.label}
              </button>
            ))}
          </div>
 
          {/* ── Messages ── */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5"
                      style={{ backgroundColor: GREEN }}
                    >
                      <Sprout className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : msg.type === "alert"
                        ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm"
                        : msg.type === "onboarding"
                        ? "bg-green-50 border border-green-200 text-gray-800 rounded-tl-sm"
                        : "bg-gray-50 text-gray-800 rounded-tl-sm"
                    }`}
                    style={
                      msg.role === "user"
                        ? { backgroundColor: GREEN }
                        : undefined
                    }
                  >
                    <FormattedMessage content={msg.content} />
                  </div>
                </div>
 
                {/* Quick replies */}
                {msg.quickReplies && msg.role === "assistant" && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => sendMessage(qr)}
                        className="text-[11px] px-2.5 py-1 rounded-full border text-green-700 border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
 
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: GREEN }}
                >
                  <Sprout className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
 
          {/* ── Input ── */}
          <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  currentLang === "hi"
                    ? "कुछ भी पूछें... (Enter दबाएं)"
                    : "Ask anything... (Enter to send)"
                }
                className="min-h-[40px] max-h-[100px] resize-none text-sm border-gray-200 focus:border-green-400 focus:ring-green-400 rounded-xl"
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="flex-shrink-0 h-10 w-10 rounded-xl"
                style={{ backgroundColor: GREEN }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              KrishiSetu Saathi · AI-powered · Prices are estimates
            </p>
          </div>
        </>
      )}
    </div>
  );
}
 
// ─── Helper: render markdown-like bold/bullets ────────────────────────────────
 
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
 
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold">
              {part}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        );
 
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="mt-0.5 flex-shrink-0">•</span>
              <span>{rendered}</span>
            </div>
          );
        }
 
        return (
          <p key={i} className={line === "" ? "h-1" : ""}>
            {rendered}
          </p>
        );
      })}
    </div>
  );
}