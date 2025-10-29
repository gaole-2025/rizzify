"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { loginMock } from "@/lib/stage1-data";
import { ErrorBanner } from "@/components/stage1/common";
import { useDevAuth, useDevPageState } from "@/components/dev/DevToolbar";
import { getSupabaseBrowserClient } from "@/src/lib/supabaseClient";
import { useAuth } from "@/src/components/AuthProvider";
import ImageWall from "@/components/ImageWall";
import { analytics, AnalyticsEvents } from '@/src/lib/analytics';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect");
  const redirectTo =
    redirectParam && redirectParam.startsWith("/")
      ? redirectParam
      : loginMock.redirect.to;

  const { state: pageState, setState: setPageState } = useDevPageState(
    "login",
    "Login",
    "default",
  );
  const { setAuthState } = useDevAuth();
  const { state: authState, user } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const loginTrackedRef = useRef(false); // 防止重复追踪登录成功

  // 📊 埋点：页面浏览
  useEffect(() => {
    analytics.pageView('/login')
  }, [])

  useEffect(() => {
    if (pageState === "error") {
      setError("Sign-in failed. Please try again.");
    } else if (pageState !== "loading") {
      setError(null);
    }
  }, [pageState]);

  const loading = pageState === "loading";
  const disabled = pageState === "disabled";

  const handleGoogle = async () => {
    if (loading || disabled || isAuthenticating) return;

    // 📊 埋点：登录开始
    analytics.track(AnalyticsEvents.LOGIN_START, { method: 'google' })

    setIsAuthenticating(true);
    setPageState("loading");
    setError(null);

    try {
      // DB 模式：使用 Supabase Auth Google OAuth
      const supabase = getSupabaseBrowserClient();
      const redirectTo =
        process.env.AUTH_REDIRECT_URL || "http://localhost:3000/auth/callback";

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, queryParams: { prompt: "select_account" } },
      });
    } catch (err) {
      console.error("Google OAuth error:", err);
      let errorMessage = "Sign-in failed. Please try again.";

      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
        if (err.message.includes("popup")) {
          errorMessage =
            "Please allow popups for this site to sign in with Google.";
        } else if (err.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (
          err.message.includes("OAuth") ||
          err.message.includes("provider")
        ) {
          errorMessage =
            "Google OAuth not configured in Supabase dashboard. Please configure Google Auth provider.";
        }
      }

      // 📊 埋点：登录失败
      analytics.track(AnalyticsEvents.LOGIN_ERROR, {
        errorCode: err instanceof Error ? err.name : 'UNKNOWN',
        errorMessage: errorMessage
      })

      setError(errorMessage);
      setPageState("error");
      setIsAuthenticating(false);
    }
  };

  // 检查用户是否已登录，如果已登录则重定向
  useEffect(() => {
    if (authState === "user" && user && !loginTrackedRef.current) {
      // 📊 埋点：登录成功（只追踪一次）
      loginTrackedRef.current = true;
      analytics.track(AnalyticsEvents.LOGIN_SUCCESS, {
        userId: user.id,
        method: 'google',
        isNewUser: false
      })
      analytics.setUserId(user.id)
      
      router.replace(redirectTo);
    }
  }, [authState, user, router, redirectTo]);

  // 检查是否有认证错误回调
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const errorDescription = urlParams.get("error_description");

    if (error && errorDescription) {
      const errorMessage = getGoogleAuthErrorMessage(error, errorDescription);
      setError(errorMessage);
      setPageState("error");

      // 清除URL中的错误参数
      const cleanUrl = window.location.pathname + window.location.search;
      const url = new URL(cleanUrl, window.location.origin);
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const getGoogleAuthErrorMessage = (
    error: string,
    description: string,
  ): string => {
    switch (error) {
      case "access_denied":
        return "Sign-in was cancelled. Please try again if you wish to continue.";
      case "invalid_request":
        return "Invalid sign-in request. Please try again.";
      case "unauthorized_client":
        return "Authentication service unavailable. Please contact support.";
      case "server_error":
        return "Google sign-in service is temporarily unavailable. Please try again later.";
      case "temporarily_unavailable":
        return "Google sign-in service is temporarily unavailable. Please try again later.";
      default:
        return description || "Sign-in failed. Please try again.";
    }
  };

  const copy = loginMock.copy;
  const legal = loginMock.legalLinks;

  // 检查是否有认证配置（Supabase Auth 或 Google OAuth）
  const hasSupabaseConfig = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const hasGoogleConfig = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasAuthConfig = hasSupabaseConfig || hasGoogleConfig;

  return (
    <div className="relative flex min-h-screen items-center justify-center text-white">
      {/* 固定的图片墙背景 */}
      <ImageWall />

      {/* 可缩放的登录表单容器 - 支持浏览器缩放 */}
      <div className="relative z-50 mx-4 w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl" style={{ transformOrigin: "center center" }}>
        <div className="rounded-3xl border border-white/20 bg-black/90 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md">
          <header className="mb-6 space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight">
              {copy.headline}
            </h1>
            <p className="text-sm sm:text-base text-white/60">{copy.subtext}</p>
            {!hasAuthConfig && (
              <p className="text-xs text-yellow-400 mt-2">
                ⚠️ Authentication not configured. Please set up Supabase Auth or
                Google OAuth.
              </p>
            )}
          </header>

          {error && (
            <div className="mb-4">
              <ErrorBanner
                message={error}
                onRetry={() => setPageState("default")}
              />
            </div>
          )}

          <button
            type="button"
            className={`flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-black transition hover:bg-white/90 disabled:opacity-50 ${isAuthenticating ? "animate-pulse" : ""}`}
            onClick={handleGoogle}
            disabled={
              disabled ||
              loading ||
              isAuthenticating ||
              !loginMock.providers.allowGoogle ||
              !hasAuthConfig
            }
            aria-label="Continue with Google"
          >
            <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/80 text-xs sm:text-sm font-bold text-white">
              G
            </span>
            <span className="hidden sm:inline">
              {isAuthenticating
                ? "Connecting to Google..."
                : loading
                  ? "Signing in..."
                  : "Continue with Google"}
            </span>
            <span className="sm:hidden">
              {isAuthenticating
                ? "Connecting..."
                : loading
                  ? "Signing in..."
                  : "Google"}
            </span>
          </button>

          <ul className="mt-6 space-y-2 text-sm sm:text-base text-white/70">
            {copy.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-white/40 mt-1">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-white/10 pt-4 text-xs sm:text-sm text-white/50 leading-relaxed">
            {copy.complianceNote}
          </p>

          <footer className="mt-6 text-center text-xs sm:text-sm text-white/40 leading-relaxed">
            By continuing you agree to our{" "}
            <a
              href={legal.termsHref}
              className="text-white/60 hover:text-white underline"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href={legal.privacyHref}
              className="text-white/60 hover:text-white underline"
            >
              Privacy Policy
            </a>
            .
          </footer>
        </div>
      </div>
    </div>
  );
}
