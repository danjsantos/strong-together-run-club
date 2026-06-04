'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, type Language, type Translations } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = localStorage.getItem('strc-lang') as Language
    if (saved === 'en' || saved === 'pt') {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('strc-lang', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
