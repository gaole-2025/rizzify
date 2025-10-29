'use client'

import { motion } from 'framer-motion'

export default function PlatformScroll() {
  // 约会平台数据
  const platforms = [
    { name: 'Bumble', logo: '🐝' },
    { name: 'Happn', logo: '💝' },
    { name: 'Raya', logo: '⭐' },
    { name: 'Tinder', logo: '🔥' },
    { name: 'Badoo', logo: '💜' },
    { name: 'Hinge', logo: '💎' },
    { name: 'OkCupid', logo: '💘' },
    { name: 'Match', logo: '❤️' }
  ]

  // 重复数组以实现无限循环
  const duplicatedPlatforms = [...platforms, ...platforms, ...platforms]

  return (
    <section className="py-20 bg-dark overflow-hidden">
      <div className="container mx-auto text-center mb-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-lg text-gray-400 tracking-wider uppercase font-light"
        >
          Successfully tested and approved on
        </motion.p>
      </div>

      {/* 滚动容器 - 只显示中间部分，两边渐变 */}
      <div className="relative mx-auto max-w-3xl">
        {/* 左右渐变遮罩 */}
        <div
          className="relative overflow-hidden"
          style={{
            mask: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
            WebkitMask: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)'
          }}
        >
          <div className="flex animate-scroll-infinite whitespace-nowrap" style={{ animationDuration: '25s' }}>
            {duplicatedPlatforms.map((platform, index) => (
              <div
                key={index}
                className="flex-shrink-0 mx-8 flex items-center justify-center"
              >
                <div className="flex items-center space-x-4 opacity-70">
                  <span className="text-4xl">{platform.logo}</span>
                  <span className="text-2xl text-gray-300 font-medium tracking-wide">
                    {platform.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}