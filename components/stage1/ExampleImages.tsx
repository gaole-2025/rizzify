"use client";

import OptimizedImage from "@/components/OptimizedImage";
import { BeforeAfterImages } from "@/lib/image-urls";

interface ExampleImagesProps {
  idealImages: string[];
  avoidImages: string[];
  className?: string;
}

export default function ExampleImages({
  idealImages,
  avoidImages,
  className = "",
}: ExampleImagesProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${className}`}>
      {/* 理想示例 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-400 text-xl">✅</span>
          <h3 className="text-lg font-semibold text-green-400">Good Examples</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {idealImages.slice(0, 4).map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border-2 border-green-400/30 shadow-lg"
            >
              <OptimizedImage
                src={imageUrl}
                alt={`Good example ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* 好的示例标签 */}
              <div className="absolute top-2 right-2">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  ✓ Good
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 避免示例 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-400 text-xl">❌</span>
          <h3 className="text-lg font-semibold text-red-400">Avoid These</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {avoidImages.slice(0, 4).map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border-2 border-red-400/30 shadow-lg"
            >
              <OptimizedImage
                src={imageUrl}
                alt={`Avoid example ${index + 1}`}
                fill
                className="object-cover opacity-60 grayscale"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {/* 避免示例覆盖层 */}
              <div className="absolute inset-0 bg-red-500/20"></div>
              {/* 大的X标记 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-500/80 rounded-full p-2">
                  <span className="text-white text-2xl font-bold">✕</span>
                </div>
              </div>
              {/* 避免示例标签 */}
              <div className="absolute top-2 right-2">
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  ✕ Avoid
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
