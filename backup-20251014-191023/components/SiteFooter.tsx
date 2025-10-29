'use client'

import { motion } from 'framer-motion'

export default function SiteFooter() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold gradient-text mb-4">
              Rizzify
            </h3>
            <p className="text-light/70 leading-relaxed">
              AI-powered dating photos that get you 3x more matches on Tinder, Bumble, and Hinge.
            </p>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-light mb-4">Product</h4>
            <ul className="space-y-2 text-light/70">
              <li>
                <a href="#compare" className="hover:text-accent transition-colors">
                  Before & After
                </a>
              </li>
              <li>
                <a href="#styles" className="hover:text-accent transition-colors">
                  Style Packs
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-accent transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/login?redirect=/start" className="hover:text-accent transition-colors">
                  Get Started
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-light mb-4">Support</h4>
            <ul className="space-y-2 text-light/70">
              <li>
                <a href="#faq" className="hover:text-accent transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="mailto:support@rizzify.com" className="hover:text-accent transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/refund" className="hover:text-accent transition-colors">
                  Refund Policy
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-accent transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-light mb-4">Legal</h4>
            <ul className="space-y-2 text-light/70">
              <li>
                <a href="/privacy" className="hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-accent transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-accent transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-800 mt-12 pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-light/60 text-sm">
              © 2024 Rizzify. All rights reserved.
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              <span className="text-light/60 text-sm">Follow us:</span>
              <a
                href="https://twitter.com/rizzify"
                className="text-light/60 hover:text-accent transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com/rizzify"
                className="text-light/60 hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.328-1.297L6.569 14.24c.555.646 1.376 1.06 2.297 1.06 1.692 0 3.061-1.37 3.061-3.061s-1.37-3.061-3.061-3.061c-.921 0-1.742.414-2.297 1.06L4.121 8.787c.88-.808 2.031-1.297 3.328-1.297 2.726 0 4.938 2.211 4.938 4.937s-2.211 4.938-4.938 4.938z"/>
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
