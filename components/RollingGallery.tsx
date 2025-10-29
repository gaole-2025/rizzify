"use client";

import { motion } from "framer-motion";
import OptimizedImage from "./OptimizedImage";
import { GalleryImages } from "@/lib/image-urls";

export default function RollingGallery() {
  // 获取所有roll文件夹中的图片
  const rollImages = GalleryImages.list;

  // 将图片分成3行
  const row1Images = rollImages.slice(0, 8);
  const row2Images = rollImages.slice(8, 16);
  const row3Images = rollImages.slice(16, 24);

  const ImageRow = ({
    images,
    rowIndex,
  }: {
    images: string[];
    rowIndex: number;
  }) => {
    // 不同行的高度和更快的速度
    const rowHeights = ["h-40", "h-48", "h-44"];
    const animationDurations = ["30s", "40s", "35s"]; // 将速度加快一倍
    const delays = ["0s", "-10s", "-5s"]; // 调整延迟

    return (
      <div className="relative overflow-hidden">
        <div
          className="flex gap-4 animate-scroll-infinite"
          style={{
            animationDuration: animationDurations[rowIndex],
            animationDelay: delays[rowIndex],
          }}
        >
          {/* 第一组图片 */}
          {images.map((image, index) => (
            <div
              key={`${rowIndex}-${index}`}
              className={`flex-shrink-0 ${rowHeights[rowIndex]} rounded-xl overflow-hidden shadow-lg`}
              style={{ width: "auto", aspectRatio: "auto" }}
            >
              <OptimizedImage
                src={GalleryImages.get(image)}
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
              style={{ width: "auto", aspectRatio: "auto" }}
            >
              <OptimizedImage
                src={GalleryImages.get(image)}
                alt={`Gallery image ${index + 1} copy`}
                width={250}
                height={rowIndex === 1 ? 192 : rowIndex === 2 ? 176 : 160}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

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
            Handpicked examples of natural, flattering profiles—what your set
            can look like from a single upload.
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
  );
}
