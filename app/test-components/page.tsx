"use client";

import { useState } from "react";
import Modal from "@/components/stage1/Modal";
import LoadingOverlay from "@/components/stage1/LoadingOverlay";

export default function TestComponentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"info" | "warning" | "error" | "success">("warning");
  const [showLoading, setShowLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleShowModal = (type: "info" | "warning" | "error" | "success") => {
    setModalType(type);
    setShowModal(true);
  };

  const handleShowLoading = () => {
    setShowLoading(true);
    setLoadingProgress(0);

    // 模拟进度增长
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowLoading(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* 页面标题 */}
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">Component Testing Page</h1>
          <p className="text-white/60">测试新的弹窗和加载组件</p>
        </header>

        {/* Modal 测试区域 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Modal Components</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleShowModal("info")}
              className="rounded-lg bg-blue-500/20 border border-blue-500/40 px-4 py-3 text-sm font-medium transition hover:bg-blue-500/30"
            >
              Info Modal
            </button>
            <button
              onClick={() => handleShowModal("warning")}
              className="rounded-lg bg-yellow-500/20 border border-yellow-500/40 px-4 py-3 text-sm font-medium transition hover:bg-yellow-500/30"
            >
              Warning Modal
            </button>
            <button
              onClick={() => handleShowModal("error")}
              className="rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-3 text-sm font-medium transition hover:bg-red-500/30"
            >
              Error Modal
            </button>
            <button
              onClick={() => handleShowModal("success")}
              className="rounded-lg bg-green-500/20 border border-green-500/40 px-4 py-3 text-sm font-medium transition hover:bg-green-500/30"
            >
              Success Modal
            </button>
          </div>
        </section>

        {/* Loading 测试区域 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Loading Overlay</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleShowLoading}
              className="rounded-lg bg-white/10 border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/20"
            >
              Show Loading with Progress
            </button>
            <button
              onClick={() => setShowLoading(true)}
              className="rounded-lg bg-white/10 border border-white/20 px-6 py-3 text-sm font-medium transition hover:bg-white/20"
            >
              Show Loading (Static)
            </button>
            <button
              onClick={() => setShowLoading(false)}
              className="rounded-lg bg-red-500/20 border border-red-500/40 px-6 py-3 text-sm font-medium transition hover:bg-red-500/30"
            >
              Hide Loading
            </button>
          </div>
        </section>

        {/* 动画演示区域 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Animation Demos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-white/10 bg-white/5">
              <h3 className="text-lg font-medium mb-3">Spin Animation</h3>
              <div className="flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white/60"></div>
              </div>
            </div>
            <div className="p-6 rounded-lg border border-white/10 bg-white/5">
              <h3 className="text-lg font-medium mb-3">Pulse Animation</h3>
              <div className="flex justify-center">
                <div className="h-12 w-12 animate-pulse rounded-full bg-white/80"></div>
              </div>
            </div>
            <div className="p-6 rounded-lg border border-white/10 bg-white/5">
              <h3 className="text-lg font-medium mb-3">Bounce Animation</h3>
              <div className="flex justify-center">
                <div className="h-12 w-12 animate-bounce rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
              </div>
            </div>
          </div>
        </section>

        {/* 相对定位容器用于测试 Loading Overlay */}
        <section className="relative min-h-64 rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold mb-4">Loading Overlay Test Area</h2>
          <p className="text-white/60 mb-4">
            这个区域用于测试加载覆盖层效果。点击上面的按钮来显示加载状态。
          </p>
          <div className="space-y-4">
            <div className="h-4 bg-white/10 rounded-full"></div>
            <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
            <div className="h-4 bg-white/10 rounded-full w-1/2"></div>
          </div>

          <LoadingOverlay
            isVisible={showLoading}
            title="Processing your request"
            message="Please wait while we prepare your content..."
            progress={loadingProgress}
            showProgress={loadingProgress > 0}
          />
        </section>

        {/* Modal 组件 */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === "info" ? "Information" :
            modalType === "warning" ? "Gender Selection Required" :
            modalType === "error" ? "Upload Failed" :
            "Success!"
          }
          message={
            modalType === "info" ? "This is an informational message to help you understand the feature." :
            modalType === "warning" ? "Please select your gender first before uploading a photo. This helps us generate better results for you." :
            modalType === "error" ? "There was an error processing your request. Please try again or contact support if the problem persists." :
            "Your request has been processed successfully! You can now proceed to the next step."
          }
          type={modalType}
          confirmText={
            modalType === "warning" ? "Got it!" :
            modalType === "error" ? "Try Again" :
            "Okay"
          }
        />
      </div>
    </div>
  );
}
