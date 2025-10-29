'use client'

import { motion } from 'framer-motion'

export default function SiteHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <a href="/" className="text-2xl font-bold gradient-text">
              Rizzify
            </a>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:flex items-center gap-8"
          >
            <a
              href="#compare"
              className="text-light/80 hover:text-light transition-colors"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('compare')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Examples
            </a>
            <a
              href="#styles"
              className="text-light/80 hover:text-light transition-colors"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('styles')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Styles
            </a>
            <a
              href="#pricing"
              className="text-light/80 hover:text-light transition-colors"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Pricing
            </a>
            <a href="/login?redirect=/start" className="btn-primary px-6 py-2">
              Get Started
            </a>
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:hidden text-light"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
        </nav>
      </div>
    </header>
  )
}
