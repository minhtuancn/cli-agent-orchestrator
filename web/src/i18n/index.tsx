import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { en, Dict } from './en'
import { vi } from './vi'

export type Lang = 'en' | 'vi'

const DICTS: Record<Lang, Dict> = { en, vi }

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
]

const STORAGE_KEY = 'cao_lang'

interface LangCtx {
  lang: Lang
  t: Dict
  setLang: (l: Lang) => void
  langs: typeof LANGS
}

const Ctx = createContext<LangCtx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof localStorage === 'undefined') return 'en'
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'en' || saved === 'vi' ? saved : 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const value: LangCtx = { lang, t: DICTS[lang], setLang, langs: LANGS }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): LangCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useI18n must be used within LanguageProvider')
  return c
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, langs, t } = useI18n()
  return (
    <div className="flex items-center gap-1" title={t.language} aria-label={t.language}>
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 text-xs rounded-md transition-colors ${
            lang === l.code
              ? 'bg-emerald-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
