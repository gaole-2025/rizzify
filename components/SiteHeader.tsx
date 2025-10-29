'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const EXTRA_VH = 0.7

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, elementId: string, extra: number = 0) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    const el = document.getElementById(elementId)
    if (!el) return
    const header = document.querySelector('header') as HTMLElement | null
    const headerOffset = (header?.offsetHeight ?? 100) + 8
    const extraOffset = extra > 0 ? Math.round(window.innerHeight * extra) : 0
    const y = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - headerOffset - extraOffset)
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4 sm:py-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <a href="/" className="text-xl sm:text-2xl font-bold gradient-text">
              Rizzify
            </a>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:flex items-center gap-6 lg:gap-8"
          >
            <a
              href="#compare"
              className="text-sm lg:text-base text-light/80 hover:text-light transition-colors"
              onClick={(e) => handleNavClick(e, 'compare')}
            >
              Examples
            </a>
            <a
              href="#styles"
              className="text-sm lg:text-base text-light/80 hover:text-light transition-colors"
              onClick={(e) => handleNavClick(e, 'styles', EXTRA_VH)}
            >
              Gallery
            </a>
            <a
              href="#pricing"
              className="text-sm lg:text-base text-light/80 hover:text-light transition-colors"
              onClick={(e) => handleNavClick(e, 'pricing', EXTRA_VH)}
            >
              Pricing
            </a>
            <a href="/login?redirect=/start" className="btn-primary px-4 lg:px-6 py-2 text-sm lg:text-base">
              Start now
            </a>
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-light p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="bg-black/95 backdrop-blur-sm border-t border-white/10 py-4 space-y-2">
                <a
                  href="#compare"
                  className="block px-4 py-3 text-light/80 hover:text-light hover:bg-white/10 rounded-lg transition-colors"
                  onClick={(e) => handleNavClick(e, 'compare')}
                >
                  Examples
                </a>
                <a
                  href="#styles"
                  className="block px-4 py-3 text-light/80 hover:text-light hover:bg-white/10 rounded-lg transition-colors"
                  onClick={(e) => handleNavClick(e, 'styles', EXTRA_VH)}
                >
                  Gallery
                </a>
                <a
                  href="#pricing"
                  className="block px-4 py-3 text-light/80 hover:text-light hover:bg-white/10 rounded-lg transition-colors"
                  onClick={(e) => handleNavClick(e, 'pricing', EXTRA_VH)}
                >
                  Pricing
                </a>
                <a
                  href="/login?redirect=/start"
                  className="block px-4 py-3 text-light bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-center font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Start now
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
