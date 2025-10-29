'use client'

import { motion } from 'framer-motion'
import OptimizedImage from './OptimizedImage'

export default function RollingGallery() {
  // 获取所有roll文件夹中的图片
  const rollImages = [
    '04cd87b5-3984-474e-b5fc-bf887b582e79.webp',
    '2196af43-a96f-405a-9583-3836689dd4b7.webp',
    '250faa09-869b-4a80-9dc8-6af96ce50289.webp',
    '307e7ac4-6243-41d8-a274-6ab183ac9ed5.webp',
    '32d6769d-2fa6-428f-85cd-0b2a06deaf3f.webp',
    '485371d5-83c1-4b25-88df-cf4c83526b77.webp',
    '4efc606f-7134-413c-b3c2-529d17b4c33a.webp',
    '52338a67-1537-4d8e-a034-be7eff39a2d6.webp',
    '53cb1870-7473-42da-a2d3-cc9a5e818167.webp',
    '56fb29c7-ae2b-4486-a3dc-e45549affaed.webp',
    '5b3d9961-083c-47a1-bae3-21cb5983f0a3.webp',
    '734e129e-9b96-4d5b-8010-47f0fc9563b7.webp',
    '76905624-8457-4492-81fa-57494fa46f8f.webp',
    '7f1baf4e-fa5f-4332-9b51-6208172302b6.webp',
    '8d817704-6629-4340-be95-88e9e01b3ca2.webp',
    '918e4124-6722-47e0-9bea-449042b7ae26.webp',
    'a430ce82-d962-4c11-87c4-72042ba40059.webp',
    'a957515d-cc11-4913-bfc9-69fa28fd92a7.webp',
    'c76a6c17-bde8-4335-a9f5-fa89adbfe04a.webp',
    'dfdc3f9c-ae8f-4ec8-becb-36f3504d80a8.webp',
    'e3ef1eb3-dc9e-4aab-955a-51a16fa40d1c.webp',
    'e8247091-8e82-46bf-aff5-b5b9219b7beb.webp',
    'f1a7c046-9761-40d4-974d-3897eb2a394b.webp',
    'fd48717a-ca5a-4536-ad95-133985313b96.webp',
  ]

  // 将图片分成3行
  const row1Images = rollImages.slice(0, 8)
  const row2Images = rollImages.slice(8, 16)
  const row3Images = rollImages.slice(16, 24)

  const ImageRow = ({ images, rowIndex }: { images: string[], rowIndex: number }) => {
    // 不同行的高度和更快的速度
    const rowHeights = ['h-40', 'h-48', 'h-44']
    const animationDurations = ['30s', '40s', '35s'] // 将速度加快一倍
    const delays = ['0s', '-10s', '-5s'] // 调整延迟

    return (
      <div className="relative overflow-hidden">
        <div
          className="flex gap-4 animate-scroll-infinite"
          style={{
            animationDuration: animationDurations[rowIndex],
            animationDelay: delays[rowIndex]
          }}
        >
          {/* 第一组图片 */}
          {images.map((image, index) => (
            <div
              key={`${rowIndex}-${index}`}
              className={`flex-shrink-0 ${rowHeights[rowIndex]} rounded-xl overflow-hidden shadow-lg`}
              style={{ width: 'auto', aspectRatio: 'auto' }}
            >
              <OptimizedImage
                src={`/images/roll/${image}`}
                alt={`Gallery image ${index + 1}`}
                width={250}
                height={rowIndex === 1 ? 192 : rowIndex === 2 ? 176 : 160}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* 复制一组图片用于无缝循环 */}
          {images.map((image, index) => (
            <div
              key={`${rowIndex}-${index}-copy`}
              className={`flex-shrink-0 ${rowHeights[rowIndex]} rounded-xl overflow-hidden shadow-lg`}
              style={{ width: 'auto', aspectRatio: 'auto' }}
            >
              <OptimizedImage
                src={`/images/roll/${image}`}
                alt={`Gallery image ${index + 1} copy`}
                width={250}
                height={rowIndex === 1 ? 192 : rowIndex === 2 ? 176 : 160}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="py-12 bg-dark overflow-hidden">
      <div className="mb-12">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text">
            Swipe-Ready Gallery
          </h2>
          <p className="text-white/70 mt-4 max-w-2xl mx-auto">
            Thousands of professionals already using AI-generated photos for their dating profiles
          </p>
        </motion.div>

        {/* 滚动图片行 */}
        <div className="space-y-4">
          <ImageRow images={row1Images} rowIndex={0} />
          <ImageRow images={row2Images} rowIndex={1} />
          <ImageRow images={row3Images} rowIndex={2} />
        </div>
      </div>
    </section>
  )
}