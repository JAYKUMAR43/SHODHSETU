import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';

const savedLanguage = localStorage.getItem('bharatpanchyt_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      hi: { translation: hiTranslation }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React handles XSS
    }
  });

// Automatically persist language change in localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('bharatpanchyt_lang', lng);
});

export default i18n;
