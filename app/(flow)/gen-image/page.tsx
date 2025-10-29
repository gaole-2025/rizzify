"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentSheet, PlansGrid } from "@/components/stage1/plans";
import { ErrorBanner } from "@/components/stage1/common";
import AIGenerationLoading from "@/components/stage1/AIGenerationLoading";
import GenerationBanner from "@/components/stage1/GenerationBanner";
import { generationMock } from "@/lib/stage1-data";
import {
  createPaymentSession,
  getTaskStatus,
  startGeneration,
  ApiError,
} from "@/lib/api/client";
import { useDevAuth, useDevMocks, useDevPageState } from "@/components/dev/DevToolbar";
import { writeLastTaskId } from "@/lib/stage2-storage";
import { analytics, AnalyticsEvents } from '@/src/lib/analytics';

const UPLOAD_SESSION_KEY = "rizzify.stage2.upload";
// 🚀 优化：轮询间隔从 1.2 秒增加到 5 秒，减少数据库查询
const POLL_INTERVAL_MS = 5000; // 5 秒

interface UploadSession {
  fileId: string;
  gender?: "male" | "female";
}

type PlanCode = "free" | "start" | "pro";
type ViewState = "choose" | "processing";

type TaskRuntimeState = {
  taskId: string;
  status: "queued" | "running" | "done" | "error";
  etaSeconds?: number | null;
  progress?: number | null;
  errorMessage?: string | null;
};

function readUploadSession(): UploadSession | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(UPLOAD_SESSION_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as UploadSession;
    if (!parsed.fileId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearUploadSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(UPLOAD_SESSION_KEY);
}

function useUploadSession() {
  const [session, setSession] = useState<UploadSession | null>(() =>
    readUploadSession(),
  );
  useEffect(() => {
    setSession(readUploadSession());
  }, []);
  return session;
}

export default function GenImagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uploadSession = useUploadSession();
  const { authState, guardBypass } = useDevAuth();
  const { paymentMock, queueMock } = useDevMocks();
  const { state: pageState, setState: setPageState } = useDevPageState(
    "gen-image",
    "Generate",
    "default",
  );

  const [view, setView] = useState<ViewState>("choose");
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null);
  const [runtime, setRuntime] = useState<TaskRuntimeState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIdempotency = useRef<string | null>(null);
  const pageViewTrackedRef = useRef(false);
  const generationStartTime = useRef<number>(0);

  // 📊 埋点：页面浏览
  useEffect(() => {
    if (!pageViewTrackedRef.current) {
      pageViewTrackedRef.current = true;
      analytics.pageView('/gen-image');
    }
  }, []);

  const chooseCopy = generationMock.chooseCopy;
  const plans = useMemo(() => generationMock.plans, []);
  const processingCopy = generationMock.processingView;
  const paymentCopy = generationMock.paymentSheet;

  const isAuthed = authState !== "guest";
  const isLoading = pageState === "loading";
  const isDisabled = pageState === "disabled";
  const showProcessing = view === "processing";
  const showErrorBanner = Boolean(errorMessage) && view === "processing";

  useEffect(() => {
    if (!isAuthed && !guardBypass) {
      router.replace("/login?redirect=/gen-image");
    }
  }, [guardBypass, isAuthed, router]);

  useEffect(() => {
    const genderParam = searchParams?.get("gender");
    if (genderParam && uploadSession && !uploadSession.gender) {
      window.sessionStorage.setItem(
        UPLOAD_SESSION_KEY,
        JSON.stringify({
          ...uploadSession,
          gender: genderParam as UploadSession["gender"],
        }),
      );
    }
  }, [searchParams, uploadSession]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pageState === "error") {
      setErrorMessage("Something went wrong during processing. Please retry.");
      setView("processing");
      setRuntime((prev) => (prev ? { ...prev, status: "error" } : prev));
    }
  }, [pageState]);

  const startPolling = useCallback(
    (taskId: string) => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      if (queueMock === "empty") {
        setErrorMessage(
          "Queue is currently unavailable. Please try again later.",
        );
        setRuntime(null);
        setView("choose");
        return;
      }

      const poll = async () => {
        try {
          const status = await getTaskStatus(taskId);
          const effectiveStatus =
            queueMock === "processing" && status.status === "done"
              ? "running"
              : status.status;
          setRuntime({
            taskId,
            status: effectiveStatus,
            etaSeconds: status.etaSeconds ?? null,
            progress: status.progress ?? null,
            errorMessage: status.error?.message ?? null,
          });

          if (status.status === "done") {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            writeLastTaskId(taskId);
            clearUploadSession();
            router.push("/results");
          }

          if (status.status === "error") {
            setErrorMessage(
              status.error?.message ?? "Generation failed. Please try again.",
            );
            setRuntime((prev) =>
              prev
                ? {
                    ...prev,
                    status: "error",
                    errorMessage: status.error?.message ?? null,
                  }
                : null,
            );
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        } catch (err) {
          console.error(err);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          const message =
            err instanceof ApiError
              ? err.message
              : "Failed to poll task status.";
          setErrorMessage(message);
          setRuntime((prev) =>
            prev ? { ...prev, status: "error", errorMessage: message } : prev,
          );
        }
      };

      poll();
      let currentInterval = POLL_INTERVAL_MS;
      const adaptivePolling = setInterval(async () => {
        try {
          const status = await getTaskStatus(taskId);
          const progress = status.progress ?? 0;
          if (progress < 30) {
            currentInterval = 5000; // 早期：5 秒
          } else if (progress < 80) {
            currentInterval = 8000; // 中期：8 秒
          } else {
            currentInterval = 3000; // 后期：3 秒（快速完成）
          }
          const effectiveStatus =
            queueMock === "processing" && status.status === "done"
              ? "running"
              : status.status;
          setRuntime({
            taskId,
            status: effectiveStatus,
            etaSeconds: status.etaSeconds ?? null,
            progress: status.progress ?? null,
            errorMessage: status.error?.message ?? null,
          });

          if (status.status === "done") {
            clearInterval(adaptivePolling);
            writeLastTaskId(taskId);
            clearUploadSession();
            router.push("/results");
          }

          if (status.status === "error") {
            setErrorMessage(
              status.error?.message ?? "Generation failed. Please try again.",
            );
            setRuntime((prev) =>
              prev
                ? {
                    ...prev,
                    status: "error",
                    errorMessage: status.error?.message ?? null,
                  }
                : null,
            );
            clearInterval(adaptivePolling);
          }
        } catch (err) {
          console.error(err);
          clearInterval(adaptivePolling);
          const message =
            err instanceof ApiError
              ? err.message
              : "Failed to poll task status.";
          setErrorMessage(message);
          setRuntime((prev) =>
            prev ? { ...prev, status: "error", errorMessage: message } : prev,
          );
        }
      }, currentInterval);
      pollRef.current = adaptivePolling;
    },
    [queueMock, router],
  );

  const resetToPlans = useCallback(() => {
    setSelectedPlan(null);
    setView("choose");
    setRuntime(null);
    setErrorMessage(null);
    setErrorCode(null);
    setIsPaymentSheetOpen(false);
    setPageState("default");
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [setPageState]);

  const beginGeneration = useCallback(
    async (plan: PlanCode) => {
      if (!uploadSession?.fileId || !uploadSession.gender) {
        setErrorMessage("Missing upload session. Please start again.");
        return;
      }

      // 📊 埋点：生成开始
      generationStartTime.current = Date.now();
      analytics.track(AnalyticsEvents.GENERATION_START, {
        plan,
        fileId: uploadSession.fileId
      });

      if (queueMock === "empty") {
        setErrorMessage(
          "Queue is currently unavailable. Please try again later.",
        );
        setView("choose");
        return;
      }

      // 🚀 立即跳转到processing界面，提供即时反馈
      const idempotencyKey =
        globalThis.crypto?.randomUUID?.() ?? `idem_${Date.now()}`;
      lastIdempotency.current = idempotencyKey;

      // 设置processing状态，但不设置taskId
      setRuntime({
        taskId: "", // 空的taskId表示正在初始化
        status: "queued",
      });
      setView("processing");
      setErrorMessage(null);

      // 异步调用生成API
      console.log("🚀 Starting async generation call...");
      startGeneration({
        plan,
        gender: uploadSession.gender,
        fileId: uploadSession.fileId,
        idempotencyKey,
      })
        .then((response) => {
          console.log("✅ Generation API successful:", response.taskId);
          const initialStatus =
            queueMock === "processing" ? "running" : "queued";

          setRuntime({
            taskId: response.taskId,
            status: initialStatus,
          });
          startPolling(response.taskId);
        })
        .catch((err) => {
          console.error("❌ Generation API failed:", err);

          let message = "Failed to start generation. Please try again.";

          if (err instanceof ApiError) {
            // Handle specific API errors with user-friendly messages
            if (err.status === 400) {
              if (err.code === "invalid_plan") {
                message =
                  "Selected plan is no longer available. Please choose a different plan.";
              } else if (err.code === "invalid_file") {
                message =
                  "Uploaded file is invalid or expired. Please upload a new photo.";
              } else if (err.code === "quota_exceeded") {
                message =
                  "You've reached your generation limit. Please upgrade your plan or try again later.";
              } else if (err.code?.startsWith("invalid_")) {
                message = `Generation error: ${err.message || "Invalid request. Please try again."}`;
              } else {
                message =
                  err.message ||
                  "Failed to start generation. Please try again.";
              }
            } else if (err.status === 402) {
              message =
                "Payment required to start generation. Please select a plan and complete payment.";
            } else if (err.status === 429) {
              if (err.code === 'daily_quota_exceeded') {
                message = "You've reached your daily limit for the free plan. Upgrade to Start or Pro plan to generate more photos.";
              } else {
                const retryAfter = err.retryAfterSeconds || 30;
                message = `Too many generation attempts. Please wait ${retryAfter} seconds before trying again.`;
              }
            } else if (err.status === 503) {
              message =
                "Generation service is temporarily unavailable. Please try again in a few minutes.";
            } else {
              message =
                err.message || "Failed to start generation. Please try again.";
            }
          } else if (err instanceof Error) {
            message = err.message;
          }

          setErrorMessage(message);
          setErrorCode(err.code || null);
          setRuntime((prev) =>
            prev
              ? {
                  ...prev,
                  status: "error",
                  errorMessage: message,
                }
              : {
                  taskId: "",
                  status: "error",
                  errorMessage: message,
                },
          );
        });
    },
    [queueMock, startPolling, uploadSession],
  );

  const handlePlanSelect = (code: PlanCode) => {
    if (isDisabled || isLoading) return;

    if (!uploadSession) {
      setErrorMessage("Upload session not found. Please upload a photo again.");
      return;
    }

    // 📊 埋点：套餐选择
    analytics.track(AnalyticsEvents.PLAN_SELECT, { plan: code });

    setSelectedPlan(code);
    // 🚀 优化：所有计划都直接跳过支付，直接开始生成
    beginGeneration(code);
  };

  const handlePaymentConfirm = async () => {
    const plan = selectedPlan ?? "start";
    // 🚀 优化：跳过支付，直接开始生成
    setIsPaymentSheetOpen(false);
    beginGeneration(plan);
  };

  const handlePaymentClose = () => {
    setIsPaymentSheetOpen(false);
  };

  if (!isAuthed && !guardBypass) {
    return null;
  }

  if (!uploadSession?.fileId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-white">
        <ErrorBanner
          message="Upload session expired. Please start again."
          onRetry={() => router.push("/start")}
        />
        <button
          type="button"
          className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/10"
          onClick={() => router.push("/start")}
        >
          Go back to start
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl sm:max-w-3xl md:max-w-4xl space-y-4 sm:space-y-6 md:space-y-8 px-4 sm:px-6">
      <section
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 md:p-8 shadow-lg"
        aria-busy={isLoading}
      >
        <header className="mb-4 sm:mb-6 md:mb-8 space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">
            {chooseCopy.title}
          </h1>
          <p className="text-xs sm:text-sm text-white/60">{chooseCopy.subtext}</p>
          {pageState === "empty" && (
            <p className="text-xs text-amber-300">
              No plans available in this demo state.
            </p>
          )}
        </header>

        {showErrorBanner && (
          <ErrorBanner message={errorMessage ?? ""} onRetry={resetToPlans} errorCode={errorCode ?? undefined} />
        )}

        {!showProcessing && (
          <div
            className={isLoading ? "pointer-events-none opacity-60" : undefined}
          >
            <PlansGrid
              plans={plans}
              selected={selectedPlan ?? undefined}
              onSelect={handlePlanSelect}
              disabled={isDisabled || isLoading}
            />

            {/* 查看历史结果的快速入口 */}
            <div className="mt-6 sm:mt-8 text-center">
              <a
                href="/results"
                className="inline-flex items-center space-x-2 text-white/60 hover:text-white text-xs sm:text-sm transition-colors group"
              >
                <span className="group-hover:animate-pulse">🖼️</span>
                <span>View your previous photo results</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>
            </div>
          </div>
        )}

        {showProcessing && (
          <div className="space-y-6">
            {/* 友好提示横幅 */}
            <GenerationBanner />

            <AIGenerationLoading
              status={
                !runtime?.taskId
                  ? "initializing"
                  : runtime.status === "done"
                    ? "running"
                    : runtime.status
              }
              taskId={runtime?.taskId}
              progress={runtime?.progress}
              etaSeconds={runtime?.etaSeconds}
              errorMessage={runtime?.errorMessage}
              onRetry={resetToPlans}
            />
          </div>
        )}
      </section>

      <PaymentSheet
        open={isPaymentSheetOpen}
        plan={plans.find((plan) => plan.code === (selectedPlan ?? undefined))}
        copy={paymentCopy}
        onClose={handlePaymentClose}
        onConfirm={handlePaymentConfirm}
      />
    </div>
  );
}
