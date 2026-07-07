
import React from 'react';
import { useTranslation } from '../LanguageContext';
import { Globe } from 'lucide-react';
import { Language } from '../translations';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: t('spanish'), flag: '🇪🇸' },
    { code: 'en', label: t('english'), flag: '🇺🇸' },
    { code: 'fr', label: t('french'), flag: '🇫🇷' },
    { code: 'ar', label: t('arabic'), flag: '🇲🇦' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-400" />
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
              language === lang.code
                ? 'bg-slate-900 text-white'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
            title={lang.label}
          >
            {lang.code === 'ar' ? 'العربية' : lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
