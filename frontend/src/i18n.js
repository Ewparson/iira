import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";
import hi from "./locales/hi.json";
import ru from "./locales/ru.json";
import pt from "./locales/pt.json";
import es from "./locales/es.json";
import de from "./locales/de.json";

const brand = "IntellaCoin";
const withBrand = (base) => ({
  ...base,
  nav: {
    ...(base.nav || {}),
    IntellaCoin: brand, // replace everywhere
    echange: brand,   // alias some locales used
  },
});

const resources = {
  en: { translation: withBrand(en) },
  zh: { translation: withBrand(zh) },
  ja: { translation: withBrand(ja) },
  ko: { translation: withBrand(ko) },
  fr: { translation: withBrand(fr) },
  ar: { translation: withBrand(ar) },
  hi: { translation: withBrand(hi) },
  ru: { translation: withBrand(ru) },
  pt: { translation: withBrand(pt) },
  es: { translation: withBrand(es) },
  de: { translation: withBrand(de) },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en","zh","ja","ko","fr","ar","hi","ru","pt","es","de"],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    debug: false,
    detection: {
      order: ["querystring", "localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    returnNull: false,
    parseMissingKeyHandler: (key) => key,
    resources,
  });

export default i18n;
