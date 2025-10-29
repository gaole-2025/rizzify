"use client";

import { useState } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import { BeforeAfterImages } from "@/lib/image-urls";

export default function TestBeforeAfterPage() {
  const [imageSource, setImageSource] = useState<"auto" | "local" | "r2">("auto");
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});

  const handleImageError = (imageName: string, error: any) => {
    console.error(`Image failed to load: ${imageName}`, error);
    setImageErrors(prev => ({
      ...prev,
      [imageName]: error.toString()
    }));
  };

  const handleImageLoad = (imageName: string) => {
    console.log(`Image loaded successfully: ${imageName}`);
    setImageErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[imageName];
      return newErrors;
    });
  };

  const pairs = [
    { before: "before-1.webp", after: "after-1.webp" },
    { before: "before-2.webp", after: "after-2.webp" },
    { before: "before-3.webp", after: "after-3.webp" },
    { before: "before-4.webp", after: "after-4.webp" },
    { before: "before-5.webp", after: "after-5.webp" },
    { before: "before-6.webp", after: "after-6.webp" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">Before/After 图片测试</h1>
          <p className="text-white/60">诊断 Before/After 图片加载问题</p>
        </header>

        {/* 图片源选择 */}
        <section className="flex justify-center space-x-4">
          <button
            onClick={() => setImageSource("auto")}
            className={`px-4 py-2 rounded-lg transition ${
              imageSource === "auto"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Auto (默认)
          </button>
          <button
            onClick={() => setImageSource("local")}
            className={`px-4 py-2 rounded-lg transition ${
              imageSource === "local"
                ? "bg-green-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Local (本地)
          </button>
          <button
            onClick={() => setImageSource("r2")}
            className={`px-4 py-2 rounded-lg transition ${
              imageSource === "r2"
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            R2 (云存储)
          </button>
        </section>

        {/* 环境信息 */}
        <section className="bg-white/5 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">环境信息</h3>
          <div className="text-sm space-y-1">
            <p>USE_R2_IMAGES: {process.env.NEXT_PUBLIC_USE_R2_IMAGES || "未设置"}</p>
            <p>NODE_ENV: {process.env.NODE_ENV}</p>
            <p>当前图片源: {imageSource}</p>
          </div>
        </section>

        {/* URL 测试 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">图片 URL 测试</h2>
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">生成的 URL</h3>
            <div className="space-y-2 text-sm font-mono">
              {pairs.map((pair, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-green-400">
                    Before {index + 1}: {BeforeAfterImages.getBefore(pair.before, imageSource)}
                  </div>
                  <div className="text-blue-400">
                    After {index + 1}: {BeforeAfterImages.getAfter(pair.after, imageSource)}
                  </div>
                  <hr className="border-white/10" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 图片展示 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">图片加载测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pairs.map((pair, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-lg font-medium text-center">对比组 {index + 1}</h3>

                {/* Before 图片 */}
                <div className="space-y-2">
                  <h4 className="text-sm text-green-400">Before</h4>
                  <div className="relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border border-white/10">
                    <OptimizedImage
                      src={BeforeAfterImages.getBefore(pair.before, imageSource)}
                      alt={`Before ${index + 1}`}
                      fill
                      className="object-cover"
                      onLoad={() => handleImageLoad(`before-${index + 1}`)}
                      onError={(e) => handleImageError(`before-${index + 1}`, e)}
                    />
                    {imageErrors[`before-${index + 1}`] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-400 text-xs text-center p-2">
                        加载失败: {pair.before}
                      </div>
                    )}
                  </div>
                </div>

                {/* After 图片 */}
                <div className="space-y-2">
                  <h4 className="text-sm text-blue-400">After</h4>
                  <div className="relative aspect-[3/4] bg-gray-800 rounded-lg overflow-hidden border border-white/10">
                    <OptimizedImage
                      src={BeforeAfterImages.getAfter(pair.after, imageSource)}
                      alt={`After ${index + 1}`}
                      fill
                      className="object-cover"
                      onLoad={() => handleImageLoad(`after-${index + 1}`)}
                      onError={(e) => handleImageError(`after-${index + 1}`, e)}
                    />
                    {imageErrors[`after-${index + 1}`] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-400 text-xs text-center p-2">
                        加载失败: {pair.after}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 错误统计 */}
        {Object.keys(imageErrors).length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-400">错误报告</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="space-y-2">
                {Object.entries(imageErrors).map(([imageName, error]) => (
                  <div key={imageName} className="text-sm">
                    <span className="text-red-400 font-medium">{imageName}:</span>{" "}
                    <span className="text-red-300">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 调试信息 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">调试说明</h2>
          <div className="bg-white/5 rounded-lg p-4 text-sm space-y-2">
            <p><strong>如何使用:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>选择不同的图片源测试加载效果</li>
              <li>查看生成的 URL 是否正确</li>
              <li>观察哪些图片加载失败</li>
              <li>查看浏览器控制台的详细错误信息</li>
            </ul>
            <p className="mt-3"><strong>预期结果:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Auto/R2 模式：应该从 https://rizzify.org 加载</li>
              <li>Local 模式：会尝试从 /images/ 加载（可能失败）</li>
              <li>所有图片都应该能在 R2 模式下正常显示</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
