import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ja from "./locales/ja.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    fallbackLng: "ja",
    detection: {
      // ブラウザ設定(navigator.language)は検出対象から外す。
      // Googlebot等のクローラーがnavigatorをen-US扱いすることがあり、
      // 未選択のユーザーが常に日本語で表示されるべきこのサイトでは、
      // 明示的な選択(LangToggleでの切り替え → localStorage/cookieに保存)
      // がある場合のみ言語を切り替える。
      order: ["querystring", "cookie", "localStorage", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
