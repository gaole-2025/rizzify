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
    <section className="py-12 sm:py-16 md:py-20 bg-dark">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            One-time pricing. <span className="gradient-text">No subscription.</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-light/70 max-w-2xl mx-auto px-2">
            Upload one photo → get a ready-to-use set in minutes. Styles tailored for dating apps.
          </p>
        </motion.div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            viewport={{ once: true }}
            className="bg-gray-800/30 border border-gray-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-full flex flex-col"
          >
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-light mb-2">Free — try it</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-light">$0</span>
                <span className="text-xs sm:text-sm text-light/60">sign in with Google</span>
              </div>
            </div>

            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1 text-sm sm:text-base">
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">2 preview photos every 24h (watermarked)</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">Low-res previews (up to 1024px)</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">Sample mix from our styles</span>
              </li>
            </ul>

            <a href="/start?plan=free" className="btn-primary w-full text-center block text-sm sm:text-base md:text-lg py-2.5 sm:py-3 md:py-4 mt-auto">
              Start free
            </a>
          </motion.div>

          {/* Complete (Recommended) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-accent/10 to-blue/10 border-2 border-accent/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-full flex flex-col sm:scale-100 md:scale-100"
          >
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
              <span className="bg-accent text-dark px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold">
                RECOMMENDED
              </span>
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-light mb-2">Pro (HD) · Recommended</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold gradient-text">$19.99</span>
                <span className="text-xs sm:text-sm text-light/60">one-time</span>
              </div>
            </div>

            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1 text-sm sm:text-base">
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">50 HD photos (up to 2048px, long edge)</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">20+ styles & scenes</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">10-15 minutes</span>
              </li>
            </ul>

            <a href="/start?plan=complete" className="btn-primary w-full text-center block text-sm sm:text-base md:text-lg py-2.5 sm:py-3 md:py-4 mt-auto">
              Get 50 HD photos
            </a>
          </motion.div>

          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            viewport={{ once: true }}
            className="bg-gray-800/30 border border-gray-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-full flex flex-col"
          >
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-light mb-2">Starter (HD)</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-light">$9.99</span>
                <span className="text-xs sm:text-sm text-light/60">one-time</span>
              </div>
            </div>

            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1 text-sm sm:text-base">
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">20 HD photos (up to 2048px, long edge)</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">10+ styles & scenes</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <CheckIcon /><span className="text-light">10-15 minutes</span>
              </li>
            </ul>

            <a href="/start?plan=starter" className="btn-primary w-full text-center block text-sm sm:text-base md:text-lg py-2.5 sm:py-3 md:py-4 mt-auto">
              Get 20 HD photos
            </a>
          </motion.div>
        </div>

        {/* Footnote */}
        <div className="max-w-3xl mx-auto mt-8 text-center text-xs text-light/40 leading-relaxed">
          <p>Results vary by source photo. Rizzify isn’t affiliated with Tinder, Bumble, or Hinge.</p>
        </div>
      </div>
    </section>
  )
}
