import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { ar } from "./locales/ar";

export const translations = {
  en,
  fr,
  ar,
};

export type TranslationKey = keyof typeof en;