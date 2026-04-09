import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LOCALE_STORAGE_KEY, type Locale, pickMessages, type Messages } from './messages'

type I18nValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (path: string) => string
  m: Messages
}

const I18nContext = createContext<I18nValue | null>(null)

function readLocale(): Locale {
  try {
    const s = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (s === 'en' || s === 'zh') return s
  } catch {
    /* ignore */
  }
  return 'zh'
}

function getLeaf(obj: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    typeof window !== 'undefined' ? readLocale() : 'zh',
  )

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  }, [locale])

  const m = useMemo(() => pickMessages(locale), [locale])

  const t = useCallback(
    (path: string) => {
      const v = getLeaf(m, path)
      if (v !== undefined) return v
      const vZh = getLeaf(pickMessages('zh'), path)
      return vZh ?? path
    },
    [m],
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      m,
    }),
    [locale, setLocale, t, m],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
