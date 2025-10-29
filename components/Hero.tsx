"use client"

import { motion } from "framer-motion"
import OptimizedImage from "./OptimizedImage"
import useHeroProgress from "@/hooks/useHeroProgress"

const TRUST_POINTS = [
  { icon: "", text: "Priority: 10–15 min" },
  { icon: "", text: "Still you no “swap” look" },
  { icon: "", text: "45+ different styles" },
]

export default function Hero() {
  const { frameRef, titleRef, bottomRef, crosshairRef, scrollIndicatorRef, trustPointsRef, dynamicHeight } =
    useHeroProgress({ tau: 0.3 })

  return (
    <section className="relative overflow-hidden bg-black" style={{ height: `${dynamicHeight}vh` }}>
      <div ref={frameRef} className="absolute inset-0 will-change-transform">
        <OptimizedImage
          src="https://slowroads.wiki/uploads/generated/2025/09/13/56fb29c7-ae2b-4486-a3dc-e45549affaed-Picsart-AiImageEnhancer.webp"
          alt="Hero background"
          fill
          priority
          className="object-cover object-top scale-105 transition-transform duration-10000 ease-out hover:scale-100"
          sizes="100vw"
          quality={90}
        />

        {/* 左侧渐变：保障文字对比 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />

        {/* 中心准星（隐藏在移动端） */}
        <div ref={crosshairRef} className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="relative h-24 w-24"
          >
            <span className="absolute left-1/2 top-1/2 block h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-white/30" />
            <span className="absolute left-1/2 top-1/2 block h-16 w-px -translate-x-1/2 -translate-y-1/2 bg-white/30" />
            <span className="absolute left-1/2 top-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55" />
          </motion.div>
        </div>

        {/* 左侧主文案块：Kicker + H1 + Subheadline + CTA */}
        <div
          ref={titleRef}
          className="absolute left-4 sm:left-6 md:left-8 lg:left-16 z-20 bottom-[clamp(1.5rem,6vh,5rem)] sm:bottom-[clamp(2rem,7vh,6rem)] md:bottom-[clamp(2.5rem,8vh,7rem)] lg:bottom-[clamp(3rem,9vh,8rem)]"
        >
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <p className="mb-3 hidden text-xs font-medium uppercase tracking-[0.18em] text-white/70 md:block">
              Dating photos, ready in minutes
            </p>

        <h1
        className="
          font-serif
          leading-[0.96] sm:leading-[0.95] md:leading-[0.94] 
           pb-[0.08em] 
          text-3xl sm:text-4xl md:text-5xl lg:text-7xl text-balance max-w-[18ch]
          bg-gradient-to-r from-[#F5F3EE] via-[#DAD3CA] to-[#96A7C2]
          bg-clip-text text-transparent
          drop-shadow-[0_1px_1px_rgba(0,0,0,0.40)]
          drop-shadow-[0_3px_28px_rgba(0,0,0,0.36)]
        "
      >
        Get Your Best<br className="hidden sm:block" />
        Dating Photos
      </h1>

            <p className="mt-4 sm:mt-6 text-white/88 text-pretty max-w-[40ch] text-sm sm:text-base md:text-lg leading-relaxed">
              Upload one clear selfie and get your best photos
              for Tinder, Bumble, and Hinge in minutes.
            </p>

            <a
              href="/login?redirect=/start"
              className="mt-4 sm:mt-6 inline-flex items-center justify-center rounded-2xl bg-white px-4 sm:px-6 py-2.5 sm:py-3
                         text-xs sm:text-sm font-semibold text-gray-900 shadow-lg shadow-black/10
                         hover:scale-[1.03] hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              Start your transformation →
            </a>
          </motion.div>
        </div>

        {/* 信任点：底部居中"玻璃条" */}
        <div ref={trustPointsRef} className="absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
          <motion.ul
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="backdrop-blur-sm bg-white/8 text-white/85
                       rounded-full px-4 py-2 text-[13px] flex flex-wrap gap-x-5 gap-y-2"
          >
            {TRUST_POINTS.map((item) => (
              <li key={item.text} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                <span>{item.text}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* 滚动指示（略提亮） */}
        <div ref={scrollIndicatorRef} className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-center text-white/50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.6 }}>
            <div className="hero-accent mb-2 text-xs">scroll</div>
            <div className="mx-auto h-6 w-px animate-pulse bg-white/50" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
