"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    // 如果认证状态还在加载中，不做任何操作
    if (authState === "loading") {
      return;
    }

    // 如果是公开路径，允许访问
    if (isPublicPath(pathname)) {
      return;
    }

    // 如果用户未登录且访问受保护的路径，跳转到登录页
    if (authState === "guest") {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(loginUrl);
    }
  }, [authState, pathname, router]);

  // 如果认证状态还在加载中，显示加载状态
  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="mb-4 text-2xl animate-pulse">🔐</div>
          <p className="text-sm text-white/60">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // 如果是公开路径，直接显示内容
  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  // 如果用户未登录且访问受保护的路径，不显示内容（将会跳转到登录页）
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

  // 用户已登录，显示受保护的内容
  return <>{children}</>;
}
