'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import OptimizedImage from './OptimizedImage'
import { stylePacks } from '@/lib/data'

export default function StylePacks() {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for preloading next screen
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('img')
          if (img && img.dataset.src) {
            img.src = img.dataset.src
          }
        }
      })
    }, { rootMargin: '100px' })

    const cards = scrollRef.current?.querySelectorAll('.style-card')
    cards?.forEach(card => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <section id="styles" className="py-12 md:py-20 bg-dark">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            <span className="gradient-text">Style Gallery</span>
          </h2>
          <p className="text-lg md:text-xl text-light/70 max-w-2xl mx-auto">
            Professional styles that showcase your best self across different scenarios.
          </p>
        </motion.div>

        {/* Scrollable gallery */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Navigation buttons - hidden on mobile */}
          <button
            onClick={scrollLeft}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg"
            aria-label="Scroll left"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={scrollRight}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg"
            aria-label="Scroll right"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scroll-snap-x no-scrollbar pb-4 px-4 md:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {stylePacks.map((pack, index) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true, margin: '-50px' }}
                className="flex-shrink-0 w-64 md:w-80 scroll-snap-start style-card group cursor-pointer"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 shadow-lg">
                  <OptimizedImage
                    src={pack.image}
                    alt={pack.alt}
                    fill
                    sizes="(max-width: 768px) 256px, 320px"
                    className="group-hover:scale-105 transition-transform duration-500 object-cover"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-semibold mb-1 text-lg">
                        {pack.name}
                      </h3>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {pack.description}
                      </p>
                    </div>
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                      {pack.category}
                    </span>
                  </div>
                </div>

                {/* Title (always visible on mobile) */}
                <div className="text-center md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-lg md:text-xl font-semibold text-light mb-1">
                    {pack.name}
                  </h3>
                  <p className="text-light/60 text-sm hidden md:block">
                    {pack.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile scroll indicator */}
          <div className="flex md:hidden justify-center mt-6 gap-2">
            <div className="text-light/60 text-sm">
              ← Swipe to explore →
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <a href="/start" className="btn-primary text-lg px-8 py-4">
            Get Your Photos
          </a>
        </motion.div>
      </div>
    </section>
  )
}