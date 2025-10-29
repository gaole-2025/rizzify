'use client'

import { motion } from 'framer-motion'
import OptimizedImage from './OptimizedImage'
import { beforeAfterCases } from '@/lib/data'
import { useState } from 'react'

/**
 * 箭头覆盖层（只负责装饰，不拦截交互）
 * - 左上：朝下指向画面（rotate ~95deg）
 * - 右下：朝上指向右下角小图（rotate ~-85deg）
 * - 动画：先画线（pathLength 0→1），再显示三角（marker polygon 淡入）
 */
const ArrowOverlay = () => {
  const [showHeadR, setShowHeadR] = useState(false)

  const DRAW_S = 1 // 画线时长（秒）
  const GOLD = '#D9B36C' // 温暖金色，可改成你的品牌色

  // 手绘回勾曲线（不要改坐标）
  const D =
    'M 6 66 C 28 56, 46 44, 60 48 C 72 52, 72 66, 58 64 C 52 63, 52 56, 64 54 C 88 50, 104 50, 120 50'

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Profile Glow-Up 标签（左上角，无箭头） */}
   
      {/* ---------- 右侧箭头（保持你的位置与角度） ---------- */}
      <motion.svg
        className="absolute bottom-[100px] right-[170px] w-[220px] h-[140px] md:w-[260px] md:h-[160px]"
        viewBox="0 0 120 80"
        style={{ transform: 'rotate(30deg)', transformOrigin: 'right bottom' }}
        initial={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <defs>
          <linearGradient id="goldStrokeR" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8F6B29" />
            <stop offset="0.25" stopColor="#CFA96A" />
            <stop offset="0.5" stopColor="#FFF2C4" />
            <stop offset="0.75" stopColor="#CFA96A" />
            <stop offset="1" stopColor="#8F6B29" />
          </linearGradient>
          <filter id="goldGlowR" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowhead-right" markerWidth="9" markerHeight="9" refX="6" refY="4" orient="auto">
            <motion.polygon
              points="0 0, 8 4, 0 8"
              fill="url(#goldStrokeR)"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: showHeadR ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            />
          </marker>
        </defs>

        <motion.path
          d={D}
          fill="none"
          stroke="url(#goldStrokeR)"
          filter="url(#goldGlowR)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={showHeadR ? 'url(#arrowhead-right)' : undefined}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: DRAW_S, ease: 'easeInOut', delay: 0.25 }}
          viewport={{ once: true }}
          onAnimationComplete={() => setTimeout(() => setShowHeadR(true), 100)}
        />
        {/* 线画完后，BEFORE 标签从左侧滑入并淡入（同样放在箭头尖左边） */}
        {showHeadR && (
          <motion.g
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
          >
            <defs>
              <linearGradient id="goldLabelR" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#CFA96A" />
                <stop offset="1" stopColor="#EED9A0" />
              </linearGradient>
            </defs>

            {(() => {
              const W = 62, H = 24, GAP = 16;
              const x = 110 - W - GAP;
              const y = 40 - H / 2;
              return (
                <>
                  {showHeadR && (
                    <motion.text
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut', delay: 0.08 }}
                      x={108}
                      y={40}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize="14"
                      fontWeight={800}
                      fontStyle="normal"
                      fill="#F4D27E"
                      stroke="rgba(0,0,0,.55)" strokeWidth={1} paintOrder="stroke fill"
                      className="caveat-font"
                      style={{
                        letterSpacing: '0.08em',
                        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.35))',
                      }}
                    >
                      before
                    </motion.text>
                  )}



                 
                </>
              );
            })()}
          </motion.g>
        )}


        {showHeadR && (
          <motion.path
            d={D}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.85}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.25))' }}
            strokeDasharray="28 260"
            animate={{ strokeDashoffset: [0, -320] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.svg>




    </div>
  )
}

export default function BeforeAfter() {
  // 重新排序图片：第2、3组在前，第1组在后，然后4、5组并排，最后第6组
  const reorderedCases = [
    beforeAfterCases[1], // 第2组 (横图)
    beforeAfterCases[2], // 第3组 (横图)
    beforeAfterCases[0], // 第1组 (方图)
    beforeAfterCases[3], // 第4组 (方图)
    beforeAfterCases[4], // 第5组 (横图)
    beforeAfterCases[5], // 第6组 (横图)
  ]

  return (
    <section id="compare" className="py-8 bg-dark min-h-screen">
      <div className="w-full max-w-[95vw] mx-auto">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text">Transformation Gallery</h2>
        </motion.div>

        {/* 图片网格 */}
        <div className="space-y-4">
          {/* 第一行：第2组和第3组（横图并排） */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reorderedCases.slice(0, 2).map((caseItem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-2xl">
                  {/* After 图片（主图） */}
                  <div className="absolute inset-0">
                    <OptimizedImage src={caseItem.after} alt="After" fill className="object-cover" priority={index < 2} />
                  </div>

                  {/* Before 图片（右下角小图） */}
                  <div className="absolute bottom-4 right-4 w-32 h-32 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                    <OptimizedImage src={caseItem.before} alt="Before" fill className="object-cover" />
                  </div>

                  {/* 箭头覆盖层 */}
                  <ArrowOverlay />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 第二行：第1组和第4组（方图并排） */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[reorderedCases[2], reorderedCases[3]].map((caseItem, index) => (
              <motion.div
                key={index + 2}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: (index + 2) * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full aspect-square overflow-hidden rounded-2xl shadow-2xl">
                  {/* After 图片（主图） */}
                  <div className="absolute inset-0">
                    <OptimizedImage src={caseItem.after} alt="After" fill className="object-cover" />
                  </div>

                  {/* Before 图片（右下角小图） */}
                  <div className="absolute bottom-4 right-4 w-40 h-40 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                    <OptimizedImage src={caseItem.before} alt="Before" fill className="object-cover" />
                  </div>

                  {/* 箭头覆盖层 */}
                  <ArrowOverlay />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 第三行：第5组和第6组（横图并排，与第1、2组排列一样） */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reorderedCases.slice(4, 6).map((caseItem, index) => (
              <motion.div
                key={index + 4}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: (index + 4) * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full aspect-video overflow-hidden rounded-2xl shadow-2xl">
                  {/* After 图片（主图） */}
                  <div className="absolute inset-0">
                    <OptimizedImage src={caseItem.after} alt="After" fill className="object-cover" />
                  </div>

                  {/* Before 图片（右下角小图） */}
                  <div className="absolute bottom-4 right-4 w-32 h-32 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
                    <OptimizedImage src={caseItem.before} alt="Before" fill className="object-cover" />
                  </div>

                  {/* 箭头覆盖层 */}
                  <ArrowOverlay />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
