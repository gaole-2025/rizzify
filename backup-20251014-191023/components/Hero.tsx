"use client"

import { motion } from "framer-motion"
import OptimizedImage from "./OptimizedImage"
import useHeroProgress from "@/hooks/useHeroProgress"

const TRUST_POINTS = [
  { icon: "+", text: "Typically 10-15 min" },
  { icon: "+", text: "Looks like you" },
  { icon: "+", text: "One free rerun" },
]

export default function Hero() {
  const { frameRef, titleRef, bottomRef, crosshairRef, scrollIndicatorRef, dynamicHeight } = useHeroProgress({ tau: 0.3 })

  return (
    <section className="relative overflow-hidden bg-black" style={{ height: `${dynamicHeight}vh` }}>
      <div ref={frameRef} className="absolute inset-0 will-change-transform">
        <OptimizedImage
          src="https://slowroads.wiki/uploads/generated/2025/09/13/56fb29c7-ae2b-4486-a3dc-e45549affaed-Picsart-AiImageEnhancer.webp"
          alt="Hero background"
          fill
          priority
          className="object-cover object-top scale-105 transition-transform duration-[10s] ease-out hover:scale-100"
          sizes="100vw"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/50" />

        <div
          ref={crosshairRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="relative h-24 w-24"
          >
            <span className="absolute left-1/2 top-1/2 block h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-white/40" />
            <span className="absolute left-1/2 top-1/2 block h-16 w-px -translate-x-1/2 -translate-y-1/2 bg-white/40" />
            <span className="absolute left-1/2 top-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
          </motion.div>
        </div>

        <div ref={titleRef} className="absolute left-6 bottom-48 z-20 max-w-2xl text-right md:left-12 md:bottom-56">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <h1 className="hero-title text-right text-5xl leading-tight text-white md:text-7xl">
              Make your dating<br />photos artful<br />in minutes.
            </h1>
          </motion.div>
        </div>

        <div ref={bottomRef} className="absolute left-6 bottom-10 z-20 max-w-xl space-y-6 md:left-12 md:bottom-14">
          <motion.ul
            className="flex flex-wrap items-center gap-4 text-sm text-white/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {TRUST_POINTS.map((item) => (
              <li key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
            <a
              href="/login?redirect=/start"
              className="inline-block rounded-full bg-white px-8 py-4 text-base font-semibold text-dark transition-transform duration-300 hover:scale-105 hover:bg-white/90"
            >
              Start now →
            </a>
          </motion.div>
        </div>

        <div className="absolute right-8 top-24 z-20 max-w-sm md:right-16 md:top-32">
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hero-accent text-right text-sm text-white/80 md:text-base"
          >
            Upload one photo and get 20-80 magazine-style portraits tuned for Tinder, Bumble, and Hinge.
          </motion.p>
        </div>

        <div
          ref={scrollIndicatorRef}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-center text-white/40"
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.6 }}>
            <div className="hero-accent mb-2 text-xs">scroll</div>
            <div className="mx-auto h-6 w-px animate-pulse bg-white/40" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}


