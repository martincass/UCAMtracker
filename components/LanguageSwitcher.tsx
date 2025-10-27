import React from 'react';
import { useTranslation } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  const handleLanguageChange = (lang: 'en' | 'es') => {
    setLocale(lang);
  };

  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-2 py-1 text-sm font-medium rounded ${locale === 'en' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('es')}
        className={`px-2 py-1 text-sm font-medium rounded ${locale === 'es' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;
