export const LANGUAGE_STORAGE_KEY = "krishisetu_language";

export const DEFAULT_LANGUAGE = "en";

export type Language = {
  id: string;
  name: string;
  nativeName: string;
  shortName: string;
};

export const languages: Language[] = [
  {
    id: "en",
    name: "English",
    nativeName: "English",
    shortName: "EN",
  },
  {
    id: "es",
    name: "Spanish",
    nativeName: "Español",
    shortName: "ES",
  },
  {
    id: "fr",
    name: "French",
    nativeName: "Français",
    shortName: "FR",
  },
  {
    id: "de",
    name: "German",
    nativeName: "Deutsch",
    shortName: "DE",
  },
  {
    id: "zh",
    name: "Chinese",
    nativeName: "中文",
    shortName: "ZH",
  },
  {
    id: "hi",
    name: "Hindi",
    nativeName: "हिंदी",
    shortName: "HI",
  },
  {
    id: "pt",
    name: "Portuguese",
    nativeName: "Português",
    shortName: "PT",
  },
];

export type LanguageId = Language["id"];

export function isSupportedLanguage(
  language: string | null | undefined,
): language is LanguageId {
  return languages.some((item) => item.id === language);
}

export function normalizeLanguage(
  language: string | null | undefined,
): LanguageId {
  return isSupportedLanguage(language)
    ? language
    : DEFAULT_LANGUAGE;
}

export function getLanguageMeta(
  language: string | null | undefined,
): Language {
  const normalized = normalizeLanguage(language);

  return (
    languages.find((item) => item.id === normalized) ??
    languages[0]
  );
}