import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n, { type LanguageDetectorAsyncModule } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import id from "./locales/id";

// AsyncStorage key that holds the user's explicit language choice ("en" | "id").
export const STORAGE_KEY = "app_language";

export type LangCode = "en" | "id";
export type BackendLang = "Indonesia" | "English";

// Single source of truth for mapping between i18next codes and the backend enum.
// Never compare raw language strings elsewhere — go through these helpers.
export function toLangCode(lang: BackendLang): LangCode {
  return lang === "English" ? "en" : "id";
}

export function toBackendLang(code: LangCode): BackendLang {
  return code === "en" ? "English" : "Indonesia";
}

// Read the locally stored choice, if any. Used by the login effect to decide
// whether the backend language should be adopted (a stored choice always wins).
export async function getStoredLanguage(): Promise<LangCode | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "id" ? stored : null;
  } catch {
    return null;
  }
}

// Idiomatic RN setup: a custom async detector resolves the language once
// (stored choice -> device locale -> fallback id) and `cacheUserLanguage`
// auto-persists on every `changeLanguage`, so there's a single source of truth
// and no manual bootstrap/flicker on cold start.
const languageDetector: LanguageDetectorAsyncModule = {
  type: "languageDetector",
  async: true,
  detect: async () => {
    const stored = await getStoredLanguage();
    if (stored) return stored;
    const device = getLocales()[0]?.languageCode;
    return device === "en" ? "en" : "id";
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch {
      // Ignore persistence failures — the in-memory choice still applies.
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      id: { translation: id },
    },
    fallbackLng: "id",
    returnNull: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

// Switch the active language. Persistence is automatic via `cacheUserLanguage`.
export function setLanguage(code: LangCode): Promise<unknown> {
  return i18n.changeLanguage(code);
}

export default i18n;
