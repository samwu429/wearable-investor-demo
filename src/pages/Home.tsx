import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.45 },
}

export function Home() {
  const { t, m } = useI18n()

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-6 md:pt-16">
      <motion.section
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-mist">{t('home.eyebrow')}</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink md:text-5xl lg:text-6xl">
          {t('home.titleLine1')}
          <br />
          <span className="text-gold">{t('home.titleLine2')}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-mist md:text-xl">{t('home.lead')}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/watch"
            className="inline-flex min-w-[200px] items-center justify-center rounded-md border border-gold-dim bg-gold px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-gold-dim"
          >
            {t('home.ctaWatch')}
          </Link>
          <Link
            to="/glasses"
            className="metallic-surface inline-flex min-w-[200px] items-center justify-center rounded-md px-8 py-3.5 text-sm font-semibold text-ink transition hover:border-stone-500"
          >
            {t('home.ctaGlasses')}
          </Link>
        </div>
      </motion.section>

      <section className="mt-24 grid gap-6 md:grid-cols-3">
        {m.home.cards.map((c) => (
          <motion.article key={c.title} className="metallic-surface rounded-md p-6" {...fade}>
            <h2 className="font-display text-xl font-semibold text-gold">{c.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-mist">{c.body}</p>
          </motion.article>
        ))}
      </section>

      <motion.section className="metallic-surface mt-20 rounded-md p-8 md:p-12" {...fade}>
        <h2 className="font-display text-2xl font-bold text-ink md:text-3xl">{t('home.pitchTitle')}</h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-mist marker:font-semibold marker:text-gold">
          {m.home.pitchSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </motion.section>
    </div>
  )
}
