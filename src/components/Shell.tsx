import { NavLink, Outlet } from 'react-router-dom'

const navCls = ({ isActive }: { isActive: boolean }) =>
  [
    'border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'border-gold text-ink' : 'text-mist hover:border-stone-400 hover:text-ink',
  ].join(' ')

export function Shell() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-50 border-b border-stone-400/40 bg-[#f5f3ef]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <NavLink
            to="/"
            className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl"
          >
            <span className="text-gold">Trust</span>
            <span className="text-ink">Field</span>
            <span className="ml-2 hidden text-xs font-normal text-mist sm:inline">穿戴式信任 · 演示</span>
          </NavLink>
          <nav className="flex flex-wrap items-center justify-end gap-0.5 md:gap-1" aria-label="主导航">
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
      <footer className="border-t border-stone-400/40 bg-[#ebe8e2] py-6 text-center text-xs text-mist">
        <p>无硬件线上演示 · 叙事与交互均为模拟 · 正式技术以论文与产品规格为准</p>
      </footer>
    </div>
  )
}
