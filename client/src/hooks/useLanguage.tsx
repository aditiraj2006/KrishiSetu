import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getLanguageMeta,
  languages,
  normalizeLanguage,
  type LanguageId,
} from "@/lib/languages";
import { apiRequest } from "@/lib/queryClient";

type SetLanguageOptions = {
  syncBackend?: boolean;
};

type LanguageContextValue = {
  language: LanguageId;
  languageMeta: ReturnType<typeof getLanguageMeta>;
  languages: typeof languages;
  setLanguage: (nextLanguage: string, options?: SetLanguageOptions) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) return normalizeLanguage(stored);
  // Fall back to the browser's preferred language
  const browserLang = navigator.language?.split("-")[0] ?? DEFAULT_LANGUAGE;
  return normalizeLanguage(browserLang);
}

function persistLanguage(language: LanguageId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, firebaseUser, refreshUser } = useAuth();
  const [language, setLanguageState] = useState<LanguageId>(getStoredLanguage);

  useEffect(() => {
    persistLanguage(language);
  }, [language]);

  useEffect(() => {
    if (!user?.language) return;
    const backendLanguage = normalizeLanguage(user.language);
    setLanguageState((currentLanguage) =>
      currentLanguage === backendLanguage ? currentLanguage : backendLanguage,
    );
  }, [user?.language]);

  const setLanguage = useCallback(
    async (nextLanguage: string, options: SetLanguageOptions = {}) => {
      const normalizedLanguage = normalizeLanguage(nextLanguage);
      const shouldSyncBackend = options.syncBackend !== false;

      setLanguageState(normalizedLanguage);
      persistLanguage(normalizedLanguage);

      if (!shouldSyncBackend ||!user || !firebaseUser) return;

      try {
        await apiRequest("PUT", "/api/user/profile", { language: normalizedLanguage });
        await refreshUser();
      } catch (error) {
        console.error("Failed to sync language preference:", error);
      }
    },
    [firebaseUser, refreshUser, user],
  );

  const value = useMemo(
    () => ({
      language,
      languageMeta: getLanguageMeta(language),
      languages,
      setLanguage,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
