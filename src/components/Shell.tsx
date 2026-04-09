import { NavLink, Outlet } from 'react-router-dom'

const navCls = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-4 py-2 text-sm font-medium transition-all',
    isActive
      ? 'bg-gradient-to-b from-blue-500/95 to-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_14px_rgba(37,99,235,0.35)] ring-1 ring-blue-400/50'
      : 'text-mist hover:bg-white/80 hover:text-ink hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(15,23,42,0.06)] hover:ring-1 hover:ring-slate-200/80',
  ].join(' ')

export function Shell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="metallic-surface sticky top-0 z-50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <NavLink
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl"
          >
            <span className="bg-gradient-to-r from-blue-600 to-mint bg-clip-text text-transparent">Trust</span>
            <span className="text-ink">Field</span>
            <span className="ml-2 hidden text-xs font-normal text-mist sm:inline">穿戴式信任 · 演示</span>
          </NavLink>
          <nav className="flex flex-wrap items-center justify-end gap-1 md:gap-2" aria-label="主导航">
            <NavLink to="/" className={navCls} end>
              概览
            </NavLink>
            <NavLink to="/watch" className={navCls}>
              手表演示
            </NavLink>
            <NavLink to="/glasses" className={navCls}>
              眼镜演示
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200/90 bg-white/40 py-6 text-center text-xs text-mist backdrop-blur-sm">
        <p>无硬件线上演示 · 叙事与交互均为模拟 · 正式技术以论文与产品规格为准</p>
      </footer>
    </div>
  )
}
