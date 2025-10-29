"use client";

import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "确定",
  cancelText = "取消",
  onConfirm,
  showCancel = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      // 防止背景滚动
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // 清理函数
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case "warning":
        return {
          icon: "⚠️",
          color: "text-yellow-400",
          bgColor: "bg-yellow-400/10",
          borderColor: "border-yellow-400/20",
        };
      case "error":
        return {
          icon: "❌",
          color: "text-red-400",
          bgColor: "bg-red-400/10",
          borderColor: "border-red-400/20",
        };
      case "success":
        return {
          icon: "✅",
          color: "text-green-400",
          bgColor: "bg-green-400/10",
          borderColor: "border-green-400/20",
        };
      default:
        return {
          icon: "ℹ️",
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
          borderColor: "border-blue-400/20",
        };
    }
  };

  const { icon, color, bgColor, borderColor } = getIconAndColor();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 w-full max-w-md animate-scale-in duration-300">
        <div
          className={`rounded-2xl border ${borderColor} ${bgColor} bg-black/90 p-6 shadow-2xl`}
        >
          {/* 图标和标题 */}
          <div className="mb-4 text-center">
            <div className="mb-3 text-4xl" aria-hidden="true">
              {icon}
            </div>
            <h2 className={`text-xl font-semibold ${color}`}>{title}</h2>
          </div>

          {/* 消息内容 */}
          <div className="mb-6 text-center">
            <p className="text-white/80 leading-relaxed">{message}</p>
          </div>

          {/* 按钮组 */}
          <div
            className={`flex gap-3 ${showCancel ? "flex-row" : "justify-center"}`}
          >
            {showCancel && (
              <button
                type="button"
                className="flex-1 rounded-full border border-white/20 bg-transparent px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              className={`${showCancel ? "flex-1" : "px-8"} rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90`}
              onClick={handleConfirm}
              autoFocus
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
