import "i18next";

import type { Translations } from "./locales/id";

// Make `t()` keys type-checked against the Indonesian source of truth.
// Any missing/renamed key (in en.ts or a call site) becomes a compile error.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: Translations;
    };
    returnNull: false;
  }
}
