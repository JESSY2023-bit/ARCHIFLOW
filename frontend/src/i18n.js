import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import tenant from "./config/tenant";

import fr from "./locales/fr.json";
import en from "./locales/en.json";

const savedLanguage = localStorage.getItem("archiflow_language");
const initialLanguage = savedLanguage || tenant.language || "fr";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng:         initialLanguage,
    fallbackLng: "fr",
    interpolation: { escapeValue: false },
  });

export default i18n;
