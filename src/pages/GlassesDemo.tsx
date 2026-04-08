import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Person = { id: string; name: string; verified: boolean; x: string; y: string }

const PEOPLE: Person[] = [
  { id: '1', name: '已通过认证', verified: true, x: '18%', y: '42%' },
  { id: '2', name: '同事 · 已认证', verified: true, x: '72%', y: '38%' },
  { id: '3', name: '未知账号', verified: false, x: '52%', y: '62%' },
]

export function GlassesDemo() {
  const [jitVisible, setJitVisible] = useState(true)
  const [highlight, setHighlight] = useState(false)
  const [signed, setSigned] = useState(false)

  const pupilPath = useMemo(() => {
    const pts: string[] = []
    for (let x = 0; x <= 280; x += 4) {
      const y = 28 + Math.sin(x / 18) * 10 + Math.sin(x / 7) * 4
      pts.push(`${x},${y}`)
    }
    return `M${pts.map((p) => p).join(' L')}`
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Part 2 · 眼镜 AR 演示</h1>
        <p className="mt-4 text-mist">
          模拟第一人称视野：即时（JIT）合同浮窗、风险条款高亮、以及「信任圈」里不同人的标识强度。下方波形示意瞳孔动态采样（仅视觉隐喻）。
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* AR Viewport */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2030] via-[#0f141c] to-[#0a0e14] shadow-2xl shadow-black/50">
          {/* Simulated world blur */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 30% 20%, rgba(52,211,191,0.15), transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(212,168,83,0.12), transparent 45%)',
            }}
          />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />

          {/* Corner brackets */}
          {[
            'left-4 top-4 border-l-2 border-t-2',
            'right-4 top-4 border-r-2 border-t-2',
            'left-4 bottom-4 border-l-2 border-b-2',
            'right-4 bottom-4 border-r-2 border-b-2',
          ].map((c) => (
            <div key={c} className={`pointer-events-none absolute h-8 w-8 border-gold/50 ${c}`} aria-hidden />
          ))}

          {/* People markers */}
          {PEOPLE.map((p) => (
            <div
              key={p.id}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
              style={{ left: p.x, top: p.y }}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-night/80 text-xs font-medium backdrop-blur ${
                  p.verified ? 'border-mint text-mint shadow-[0_0_20px_rgba(52,211,191,0.35)]' : 'border-mist/50 text-mist'
                }`}
              >
                {p.verified ? '真人' : '?'}
              </div>
              <span className="max-w-[100px] text-center text-[10px] text-mist">{p.name}</span>
            </div>
          ))}

          {/* Gaze dot */}
          <motion.div
            className="pointer-events-none absolute h-3 w-3 rounded-full bg-rose/90 shadow-lg shadow-rose/50 ring-2 ring-white/30"
            initial={{ left: '50%', top: '50%' }}
            animate={{ left: ['48%', '55%', '50%'], top: ['48%', '44%', '50%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />

          {/* JIT Panel */}
          <AnimatePresence>
            {jitVisible && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12 }}
                className="absolute left-1/2 top-[12%] w-[min(92%,420px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-night/90 p-5 shadow-2xl backdrop-blur-md"
                role="dialog"
                aria-label="即时合同浮窗"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gold">JIT · 跨境合同</p>
                    <h2 className="mt-1 font-display text-lg font-semibold text-white">风险条款摘要</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJitVisible(false)}
                    className="rounded-lg px-2 py-1 text-xs text-mist hover:bg-white/10"
                    aria-label="关闭浮窗"
                  >
                    关闭
                  </button>
                </div>
                <p className={`mt-3 text-sm leading-relaxed text-mist ${highlight ? 'rounded-lg bg-gold/10 p-2 text-white ring-1 ring-gold/30' : ''}`}>
                  第 7.2 条：若乙方延迟交付超过 <strong className="text-gold">14</strong> 个自然日，甲方有权终止协议并要求
                  按日计违约金。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHighlight((h) => !h)}
                    className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15"
                  >
                    {highlight ? '取消高亮' : '高亮风险句'}
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white ring-1 ring-white/15 hover:bg-white/15"
                  >
                    语音解释
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigned(true)}
                    disabled={signed}
                    className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-night hover:bg-gold-dim disabled:cursor-default disabled:opacity-60"
                  >
                    {signed ? '已请求戒指确认' : '发起签署'}
                  </button>
                </div>
                {signed && (
                  <p className="mt-3 text-xs text-mint">已推送至 Signet · 请在戒指上完成阻尼确认（演示）</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!jitVisible && (
            <button
              type="button"
              onClick={() => {
                setJitVisible(true)
                setSigned(false)
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gold/90 px-5 py-2 text-xs font-semibold text-night"
            >
              再次打开 JIT 浮窗
            </button>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-night/70 p-4">
            <p className="text-xs font-semibold text-gold">瞳孔采样示意</p>
            <svg viewBox="0 0 280 56" className="mt-2 h-16 w-full" aria-hidden>
              <path d={pupilPath} fill="none" stroke="rgba(52,211,191,0.85)" strokeWidth="2" />
              <line x1="0" y1="28" x2="280" y2="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </svg>
            <p className="mt-1 text-[11px] text-mist">与光刺激同步采集 · 演示波形非医学数据</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-night/70 p-4 text-sm text-mist">
            <p className="font-medium text-white">信任圈</p>
            <p className="mt-2">
              绿色描边与柔光：已通过人源认证链路的联系人。灰色问号：未验证身份，信息展示克制，减少冒充与机器人干扰。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
