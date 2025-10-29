'use client'

import { motion } from 'framer-motion'
import OptimizedImage from './OptimizedImage'
import { testimonials } from '@/lib/data'

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-dark">
      <div className="container mx-auto px-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">10,000+</span> generations — real stories
          </h2>
          <p className="text-lg md:text-xl text-light/70 max-w-2xl mx-auto">
            What recent users say after using Rizzify. Experiences vary for each person.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
            >
              {/* Rating */}
              <div className="mb-4">
                <StarRating rating={t.rating} />
              </div>

              {/* Quote */}
              <blockquote className="text-light/90 mb-6 leading-relaxed">
                “{t.text}”
              </blockquote>

              {/* User info */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <OptimizedImage
                    src={t.avatar}
                    alt={`${t.name}'s avatar`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-light">
                    {t.name}{t.age ? `, ${t.age}` : ''}
                  </div>
                  <div className="text-sm text-light/60">
                    {t.location}
                  </div>
                </div>
              </div>

              {/* Platform tag (replaces \"matches this month\") */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center text-sm text-light/60">
                  Used on: <span className="text-light/80 font-medium">{t.platform ?? 'Tinder / Bumble / Hinge'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Product facts (no outcome claims) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-4 gap-8 mt-16 max-w-5xl mx-auto"
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
              1
            </div>
            <div className="text-light/60">photo to upload</div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
              40–50
            </div>
            <div className="text-light/60">photos per run</div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
              15–30m
            </div>
            <div className="text-light/60">typical generation time</div>
          </div>

          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
              HD
            </div>
            <div className="text-light/60">JPG / PNG export</div>
          </div>
        </motion.div>

        {/* Social proof badges (neutral wording) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          <div className="flex items-center gap-2 bg-gray-800/30 px-4 py-2 rounded-full">
            <span className="text-green-400">✓</span>
            <span className="text-sm text-light/70">Used on Tinder</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/30 px-4 py-2 rounded-full">
            <span className="text-green-400">✓</span>
            <span className="text-sm text-light/70">Used on Bumble</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/30 px-4 py-2 rounded-full">
            <span className="text-green-400">✓</span>
            <span className="text-sm text-light/70">Used on Hinge</span>
          </div>
        </motion.div>

        {/* Footnotes (compliance) */}
        <div className="max-w-3xl mx-auto mt-8 text-center text-xs text-light/40 leading-relaxed">
          <p>Statements reflect personal experiences and may vary. Generation speed depends on queue and network conditions.</p>
          <p>Rizzify is not affiliated with Tinder, Bumble, or Hinge. Platform names are for compatibility description only.</p>
        </div>
      </div>
    </section>
  )
}
