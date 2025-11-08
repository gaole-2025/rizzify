"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/components/AuthProvider";

interface AuthGuardProps {
  children: React.ReactNode;
}

// 定义不需要认证的公开路径
const PUBLIC_PATHS = [
  "/", // 主页
  "/login", // 登录页
  "/auth", // 认证相关路径
  "/terms", // 条款页面
  "/privacy", // 隐私政策
  "/test-images", // 测试页面
  "/test-components", // 组件测试页面
  "/test-state-recovery", // 状态恢复测试页面
  "/test-before-after", // Before/After图片测试页面
];

// 检查路径是否为公开路径
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => {
    if (publicPath === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(publicPath);
  });
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { state: authState } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false)
  // 1) 无条件注册：mounted gate
  useEffect(() => { setMounted(true) }, [])

  // 2) 无条件注册：鉴权重定向逻辑（在 effect 内判断 mounted）
  useEffect(() => {
    if (!mounted) return
    if (authState === "loading") return
    if (isPublicPath(pathname)) return
    if (authState === "guest") {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [mounted, authState, pathname, router]);

  // 3) 渲染分支
  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (!mounted || authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mb-4 text-2xl animate-pulse">🔐</div>
          <p className="text-sm text-white/60">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (authState === "guest") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mb-4 text-2xl animate-pulse">🔄</div>
          <p className="text-sm text-white/60">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
