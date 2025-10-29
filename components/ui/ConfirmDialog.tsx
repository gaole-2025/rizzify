"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when dialog opens
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);

      // Handle keyboard events
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        if (e.key === "Enter") {
          e.preventDefault();
          onConfirm();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: "🗑️",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    },
    warning: {
      icon: "⚠️",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      confirmButton: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
    },
    info: {
      icon: "ℹ️",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    },
  };

  const currentStyle = typeStyles[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md transform rounded-2xl border border-white/10 bg-gray-900/95 p-6 shadow-2xl transition-all">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className={clsx(
            "flex h-16 w-16 items-center justify-center rounded-full",
            currentStyle.iconBg
          )}>
            <span className="text-2xl" role="img" aria-hidden="true">
              {currentStyle.icon}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3
            id="dialog-title"
            className="mb-3 text-xl font-semibold text-white"
          >
            {title}
          </h3>
          <p
            id="dialog-description"
            className="mb-6 text-sm text-gray-300 leading-relaxed"
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              "flex-1 rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
              currentStyle.confirmButton
            )}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">Enter</kbd> to confirm or{" "}
            <kbd className="rounded bg-gray-800 px-1 py-0.5 text-gray-400">Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const showConfirm = (options: Omit<ConfirmDialogProps, 'isOpen'>) => {
    return new Promise<boolean>((resolve) => {
      const dialog = document.createElement('div');
      document.body.appendChild(dialog);

      const cleanup = () => {
        document.body.removeChild(dialog);
      };

      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      // This would need React 18's createRoot, for now we'll use the component directly
      // This is a placeholder for the hook pattern
    });
  };

  return { showConfirm };
}
