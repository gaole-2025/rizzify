"use client";

import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
  progress?: number; // 0-100 的进度值
  showProgress?: boolean;
}

export default function LoadingOverlay({
  isVisible,
  title = "Preparing your personal model...",
  message = "This usually takes 10-15 minutes. Please keep this tab open.",
  progress = 0,
  showProgress = false,
}: LoadingOverlayProps) {
  const [dots, setDots] = useState("");
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // 动态点点点动画
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  // 进度条动画
  useEffect(() => {
    if (!isVisible || !showProgress) return;

    const interval = setInterval(() => {
      setAnimatedProgress((prev) => {
        if (prev >= progress) return progress;
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, showProgress, progress]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-20 flex h-full w-full items-center justify-center rounded-3xl bg-black/70 backdrop-blur animate-fade-in duration-500">
      <div className="rounded-2xl border border-white/10 bg-black/90 px-8 py-8 text-center text-white shadow-2xl animate-scale-in duration-500">
        {/* 旋转的加载图标 */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* 外圈旋转 */}
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white/60"></div>
            {/* 内圈反向旋转 */}
            <div
              className="absolute inset-2 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-b-white/40"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
            {/* 中心点脉动 */}
            <div className="absolute inset-6 h-4 w-4 animate-pulse rounded-full bg-white/80"></div>
          </div>
        </div>

        {/* 标题 */}
        <h2 className="mb-3 text-xl font-semibold">
          {title}
          <span className="inline-block w-6 text-left text-white/60">
            {dots}
          </span>
        </h2>

        {/* 进度条（可选） */}
        {showProgress && (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm text-white/60">
              <span>Progress</span>
              <span>{animatedProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-white/60 to-white/80 transition-all duration-300 ease-out"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 消息 */}
        <p className="text-sm text-white/60 leading-relaxed">{message}</p>

        {/* 底部动画指示器 */}
        <div className="mt-6 flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-white/40 animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1.5s",
              }}
            />
          ))}
        </div>

        {/* 背景装饰波纹 */}
        <div className="absolute -inset-4 -z-10 opacity-20">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-3xl border border-white/20 animate-ping"
              style={{
                animationDelay: `${i * 0.7}s`,
                animationDuration: "2s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
