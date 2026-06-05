'use client'
import { useLanguage } from '@/components/providers/LanguageProvider'
export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          language === 'en'
            ? 'bg-brand-pink text-white shadow'
            : 'text-white/60 hover:text-white'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('pt')}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          language === 'pt'
            ? 'bg-brand-pink text-white shadow'
            : 'text-white/60 hover:text-white'
        }`}
        aria-label="Mudar para Português"
      >
        PT
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
          language === 'es'
            ? 'bg-brand-pink text-white shadow'
            : 'text-white/60 hover:text-white'
        }`}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
    </div>
  )
}
