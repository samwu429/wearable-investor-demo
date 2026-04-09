import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45 },
}

export function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-6 md:pt-16">
      <motion.section
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-mist">Investor walkthrough</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink md:text-5xl lg:text-6xl">
          分布式穿戴 + AIOS
          <br />
          <span className="text-gold">把「真实的人」锁进关键动作</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-mist md:text-xl">
          手表负责算力与安全域，眼镜负责视线与光刺激感知，戒指负责「最终确认」。下面两个演示页，可在没有样机的情况下，向投资人展示产品气质与核心流程。
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/watch"
            className="inline-flex min-w-[200px] items-center justify-center rounded-md border border-gold-dim bg-gold px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-gold-dim"
          >
            Part 1 · 手表中枢
          </Link>
          <Link
            to="/glasses"
            className="metallic-surface inline-flex min-w-[200px] items-center justify-center rounded-md px-8 py-3.5 text-sm font-semibold text-ink transition hover:border-stone-500"
          >
            Part 2 · 眼镜 AR
          </Link>
        </div>
      </motion.section>

      <section className="mt-24 grid gap-6 md:grid-cols-3">
        {[
          {
            t: '去 App 化',
            d: '能力拆成「服务原子」，由 AIOS 按任务即时编排，而不是让用户在孤岛应用里迷路。',
          },
          {
            t: '时间之盾',
            d: '利用生理响应与生成链路在时序上的差异，辅助判断「是否像当场真人」——配合多模态与硬件根。',
          },
          {
            t: '99% / 1%',
            d: '琐事静默自动化；支付、签约等高风险动作，必须由戒指给出带阻尼的物理确认。',
          },
        ].map((c) => (
          <motion.article key={c.t} className="metallic-surface rounded-md p-6" {...fade}>
            <h2 className="font-display text-xl font-semibold text-gold">{c.t}</h2>
            <p className="mt-3 text-sm leading-relaxed text-mist">{c.d}</p>
          </motion.article>
        ))}
      </section>

      <motion.section className="metallic-surface mt-20 rounded-md p-8 md:p-12" {...fade}>
        <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">演示怎么讲（30 秒版）</h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-mist marker:font-semibold marker:text-gold">
          <li>先打开「手表演示」，走一遍 PEH 握手：光刺激 → 瞳孔 → 心血管相位 → SE 签名。</li>
          <li>再打开「眼镜演示」：时间与对话在同一片视野里；用一句话生成草稿或问条款。</li>
          <li>强调：这是无硬件的交互样机，用于对齐叙事；工程实现与威胁模型另附材料。</li>
        </ol>
      </motion.section>
    </div>
  )
}
