'use client'

import { motion } from 'framer-motion'

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function Pricing() {
  return (
    <section className="py-20 bg-dark">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, one-time <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-xl text-light/70 max-w-2xl mx-auto">
            Upload one photo → get a set in minutes. Random mix from our 45 styles.
          </p>
        </motion.div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-gray-800/30 border border-gray-700 rounded-3xl p-8"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-light mb-2">Free — try it</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-light">$0</span>
                <span className="text-light/60">sign in with Google</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">2 preview photos (watermarked, ≤1024px)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">Random mix from our 45 styles</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">1 time / 24h per account</span>
              </li>
            </ul>

            <a href="/start?plan=free" className="btn-primary w-full text-center block text-lg py-4">
              Start free
            </a>
          </motion.div>

          {/* Complete (Recommended) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-accent/10 to-blue/10 border-2 border-accent/30 rounded-3xl p-8"
          >
            <div className="absolute top-4 right-4">
              <span className="bg-accent text-dark px-3 py-1 rounded-full text-sm font-bold">
                RECOMMENDED
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-light mb-2">Complete (HD)</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold gradient-text">$19.99</span>
                <span className="text-light/60">one-time</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">50 HD photos (≤2048px)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">Random mix from 45 styles</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">Replace disliked: up to 12 within 24h (one batch)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">Typical delivery: 30–40 min (depends on queue)</span>
              </li>
            </ul>

            <a href="/start?plan=complete" className="btn-primary w-full text-center block text-lg py-4">
              Get 50 HD photos
            </a>
          </motion.div>

          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-gray-800/30 border border-gray-700 rounded-3xl p-8"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-light mb-2">Starter (HD)</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-light">$9.99</span>
                <span className="text-light/60">one-time</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">20 HD photos (≤2048px)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">Random mix from 45 styles</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">Replace disliked: up to 6 within 24h (one batch)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon /><span className="text-light">Typical delivery: 30–40 min (depends on queue)</span>
              </li>
            </ul>

            <a href="/start?plan=starter" className="btn-primary w-full text-center block text-lg py-4">
              Get 20 HD photos
            </a>
          </motion.div>
        </div>

        {/* Add-on: Priority Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900/50 border border-gray-700 rounded-2xl p-5">
            <div className="text-center md:text-left">
              <div className="text-lg font-semibold text-light">Priority Queue</div>
              <div className="text-light/70 text-sm">
                Typically <span className="text-light/90 font-medium">10–15 min</span>; standard is 30–40 min (depends on queue).
              </div>
            </div>
            <a href="/start?addon=priority" className="btn-primary px-6 py-3 text-base">
              Add for $2.99
            </a>
          </div>
        </motion.div>

        {/* Footnote */}
        <div className="max-w-3xl mx-auto mt-8 text-center text-xs text-light/40 leading-relaxed">
          <p>Results vary by source photo. Styles are randomly assigned for diversity. Rizzify isn’t affiliated with Tinder, Bumble, or Hinge.</p>
        </div>
      </div>
    </section>
  )
}
