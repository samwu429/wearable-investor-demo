import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

const navCls = ({ isActive }: { isActive: boolean }) =>
  [
    'border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'border-gold text-ink' : 'text-mist hover:border-stone-400 hover:text-ink',
  ].join(' ')

export function Shell() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b border-stone-400/40 bg-[#f5f3ef]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:gap-4 md:px-6">
          <NavLink
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl"
          >
            <span className="text-gold">Trust</span>
            <span className="text-ink">Field</span>
            <span className="ml-2 hidden text-xs font-normal text-mist sm:inline">{t('shell.tagline')}</span>
          </NavLink>
          <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
            <div
              className="flex items-center rounded-md border border-stone-400/60 bg-white/90 p-0.5 shadow-sm"
              role="group"
              aria-label={t('shell.langToggleAria')}
            >
              <button
                type="button"
                onClick={() => setLocale('zh')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  locale === 'zh'
                    ? 'bg-gold text-white shadow-sm'
                    : 'text-mist hover:bg-stone-100 hover:text-ink'
                }`}
              >
                {t('shell.langZh')}
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  locale === 'en'
                    ? 'bg-gold text-white shadow-sm'
                    : 'text-mist hover:bg-stone-100 hover:text-ink'
                }`}
              >
                {t('shell.langEn')}
              </button>
            </div>
            <nav className="flex flex-wrap items-center justify-end gap-0.5 md:gap-1" aria-label={t('shell.navAria')}>
              <NavLink to="/" className={navCls} end>
                {t('shell.navOverview')}
              </NavLink>
              <NavLink to="/watch" className={navCls}>
                {t('shell.navWatch')}
              </NavLink>
              <NavLink to="/glasses" className={navCls}>
                {t('shell.navGlasses')}
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      <footer className="border-t border-stone-400/40 bg-[#ebe8e2] py-6 text-center text-xs text-mist">
        <p>{t('shell.footer')}</p>
      </footer>
    </div>
  )
}
