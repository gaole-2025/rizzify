"use client";

import { useEffect, useState } from "react";

interface AIGenerationLoadingProps {
  status: "initializing" | "queued" | "running" | "error";
  taskId?: string;
  progress?: number | null;
  etaSeconds?: number | null;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export default function AIGenerationLoading({
  status,
  taskId,
  progress,
  etaSeconds,
  errorMessage,
  onRetry,
}: AIGenerationLoadingProps) {
  const [dots, setDots] = useState("");
  const [glowIntensity, setGlowIntensity] = useState(0);

  // 动态点点点动画
  useEffect(() => {
    if (status === "error") return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 600);

    return () => clearInterval(interval);
  }, [status]);

  // 光晕强度动画
  useEffect(() => {
    if (status === "error") return;

    const interval = setInterval(() => {
      setGlowIntensity((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 50);

    return () => clearInterval(interval);
  }, [status]);

  const getStatusInfo = () => {
    switch (status) {
      case "initializing":
        return {
          title: "Initializing AI",
          subtitle: "Setting up your generation task",
          icon: "🧠",
          color: "from-blue-500 to-purple-600",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/30",
        };
      case "queued":
        return {
          title: "In Queue",
          subtitle: "Your task will start processing soon",
          icon: "⏳",
          color: "from-yellow-500 to-orange-600",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/30",
        };
      case "running":
        return {
          title: "Creating Magic",
          subtitle: "AI is crafting your perfect photos",
          icon: "✨",
          color: "from-green-500 to-emerald-600",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/30",
        };
      case "error":
        return {
          title: "Generation Failed",
          subtitle: errorMessage || "Something went wrong",
          icon: "❌",
          color: "from-red-500 to-red-600",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
        };
    }
  };

  const statusInfo = getStatusInfo();

  const formatETA = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      {/* 主要动画区域 */}
      <div className="relative mb-8">
        {/* 背景光晕 */}
        <div
          className={`absolute inset-0 rounded-full ${statusInfo.bgColor} blur-xl opacity-60 animate-pulse`}
          style={{
            transform: `scale(${1 + glowIntensity / 200})`,
            opacity: status === "error" ? 0.3 : 0.6,
          }}
        />

        {/* 主圆圈 */}
        <div
          className={`relative flex h-32 w-32 items-center justify-center rounded-full border-2 ${statusInfo.borderColor} ${statusInfo.bgColor} backdrop-blur-sm`}
        >
          {/* 旋转环 */}
          {status !== "error" && (
            <>
              <div
                className={`absolute inset-2 rounded-full border-2 border-transparent bg-gradient-to-r ${statusInfo.color} animate-spin`}
                style={{
                  background: `conic-gradient(from 0deg, transparent 0%, var(--tw-gradient-stops) 50%, transparent 100%)`,
                  animationDuration: status === "running" ? "2s" : "3s",
                }}
              />
              <div
                className={`absolute inset-4 rounded-full border-2 border-transparent bg-gradient-to-r ${statusInfo.color} animate-spin`}
                style={{
                  background: `conic-gradient(from 180deg, transparent 0%, var(--tw-gradient-stops) 30%, transparent 100%)`,
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              />
            </>
          )}

          {/* 中心图标 */}
          <div
            className={`relative z-10 text-4xl ${status === "error" ? "" : "animate-pulse"}`}
          >
            {statusInfo.icon}
          </div>

          {/* 进度环 */}
          {status === "running" && progress !== null && progress !== undefined && (
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="58"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="50%"
                cy="50%"
                r="58"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className={`text-green-400 transition-all duration-1000`}
                strokeDasharray={`${2 * Math.PI * 58}`}
                strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress / 100)}`}
              />
            </svg>
          )}
        </div>
      </div>

      {/* 状态文本 */}
      <div className="text-center space-y-3 max-w-md">
        <h2
          className={`text-2xl font-bold bg-gradient-to-r ${statusInfo.color} bg-clip-text text-transparent`}
        >
          {statusInfo.title}
          {status !== "error" && (
            <span className="inline-block w-8 text-left text-white/60 font-normal">
              {dots}
            </span>
          )}
        </h2>

        <p className="text-white/70 leading-relaxed">{statusInfo.subtitle}</p>

        {/* 进度和ETA信息 */}
        {status === "running" && (
          <div className="space-y-2 text-sm text-white/60">
            {progress !== null && progress !== undefined && (
              <div className="flex justify-center items-center space-x-2">
                <span>Progress:</span>
                <span className="text-green-400 font-semibold">
                  {progress}%
                </span>
              </div>
            )}
            {etaSeconds !== null && etaSeconds !== undefined && etaSeconds > 0 && (
              <div className="flex justify-center items-center space-x-2">
                <span>ETA:</span>
                <span className="text-blue-400 font-semibold">
                  {formatETA(etaSeconds)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 任务ID（仅在运行时显示） */}
        {taskId && status === "running" && (
          <div className="text-xs text-white/40 font-mono bg-white/5 px-3 py-1 rounded-full inline-block">
            ID: {taskId.slice(0, 8)}...
          </div>
        )}


        {/* 错误状态的重试按钮 */}
        {status === "error" && onRetry && (
          <div className="mt-6 space-y-4">
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
            <div className="text-center">
              <a
                href="/results"
                className="inline-flex items-center space-x-2 text-white/60 hover:text-white text-sm transition-colors"
              >
                <span>🖼️</span>
                <span>View previous results instead</span>
              </a>
            </div>
          </div>
        )}
      </div>


      {/* 背景粒子效果 */}
      {status === "running" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
