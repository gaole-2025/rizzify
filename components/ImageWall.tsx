"use client";

import { useEffect, useState, useCallback } from "react";
import OptimizedImage from "./OptimizedImage";
import { LoginImages } from "@/lib/image-urls";

interface ImageItem {
  id: string;
  src: string;
  alt: string;
  position: { top: number; left: number };
  size: { width: number; height: number };
}

export default function ImageWall() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  // 背景墙尺寸 - 填满整个视口
  const FIXED_WALL_SIZE = {
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const generateImageLayout = useCallback(() => {
    if (!isClient) return;

    // 使用新的图片URL系统获取图片列表
    const allImages = LoginImages.list;

    // 根据屏幕大小动态计算网格
    const screenWidth = FIXED_WALL_SIZE.width;
    const screenHeight = FIXED_WALL_SIZE.height;
    
    // 响应式图片尺寸
    let IMAGE_SIZE = { width: 150, height: 170 };
    let COLS = 12;
    let ROWS = 6;
    let GAP_X = 10;
    let GAP_Y = 10;

    // 移动端适配
    if (screenWidth < 768) {
      IMAGE_SIZE = { width: 80, height: 100 };
      COLS = 6;
      ROWS = 4;
      GAP_X = 5;
      GAP_Y = 5;
    } else if (screenWidth < 1024) {
      IMAGE_SIZE = { width: 100, height: 120 };
      COLS = 8;
      ROWS = 5;
      GAP_X = 8;
      GAP_Y = 8;
    }

    const TOTAL_IMAGES = COLS * ROWS;

    // 计算总宽度和高度
    const totalWidth = COLS * IMAGE_SIZE.width + (COLS - 1) * GAP_X;
    const totalHeight = ROWS * IMAGE_SIZE.height + (ROWS - 1) * GAP_Y;

    // 计算缩放因子以填满屏幕
    const scaleX = screenWidth / totalWidth;
    const scaleY = screenHeight / totalHeight;
    const scale = Math.max(scaleX, scaleY) * 1.1; // 多加10%确保完全覆盖

    // 居中偏移
    const offsetX = (FIXED_WALL_SIZE.width - totalWidth * scale) / 2;
    const offsetY = (FIXED_WALL_SIZE.height - totalHeight * scale) / 2;

    // 重复使用图片填满网格
    const selectedImages: string[] = [];
    for (let i = 0; i < TOTAL_IMAGES; i++) {
      selectedImages.push(allImages[i % allImages.length]);
    }

    // 创建网格布局
    const generatedImages: ImageItem[] = selectedImages.map(
      (filename, index) => {
        const row = Math.floor(index / COLS);
        const col = index % COLS;

        const left = offsetX + col * (IMAGE_SIZE.width + GAP_X) * scale;
        const top = offsetY + row * (IMAGE_SIZE.height + GAP_Y) * scale;

        return {
          id: `img-${index}-${filename}`,
          src: LoginImages.get(filename),
          alt: `Dating profile photo ${index + 1}`,
          position: { top, left },
          size: { width: IMAGE_SIZE.width * scale, height: IMAGE_SIZE.height * scale },
        };
      },
    );

    setImages(generatedImages);
  }, [isClient]);

  useEffect(() => {
    generateImageLayout();
  }, [generateImageLayout]);

  if (!isClient) {
    return <div className="fixed inset-0 bg-black" />;
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black"
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
      }}
    >
      {/* 固定尺寸的背景墙容器 - 使用 fixed 完全固定 */}
      <div
        className="fixed inset-0"
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* 规整的图片网格 */}
        <div className="absolute inset-0 w-full h-full">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="absolute transition-opacity duration-500 hover:scale-105 hover:z-10"
              style={{
                top: `${image.position.top}px`,
                left: `${image.position.left}px`,
                width: `${image.size.width}px`,
                height: `${image.size.height}px`,
              }}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md group">
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="150px"
                  quality={85}
                  priority={index < 20}
                />
                {/* 轻微的边框效果 */}
                <div className="absolute inset-0 border border-white/10 rounded-lg pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 仅在中心区域轻微暗化，确保登录框可读 */}
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[400px] -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-black/50 via-black/30 to-transparent rounded-full z-10" />
    </div>
  );
}
