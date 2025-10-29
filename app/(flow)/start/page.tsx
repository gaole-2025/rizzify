"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import UploadArea from "@/components/stage1/upload";
import { ErrorBanner } from "@/components/stage1/common";
import Modal from "@/components/stage1/Modal";
import LoadingOverlay from "@/components/stage1/LoadingOverlay";
import {
  GenderOption,
  SelectedFileMeta,
  UploadHint,
  genderOptions,
  preparingOverlayMock,
  startCopy,
  startExamples,
  uploadHintDefault,
} from "@/lib/stage1-data";
import { uploadInit, uploadProbe, ApiError } from "@/lib/api/client";
import { useDevAuth, useDevPageState } from "@/components/dev/DevToolbar";
import { useAuth } from "@/src/components/AuthProvider";
import { analytics, AnalyticsEvents } from '@/src/lib/analytics';

const STORAGE_KEY_GENDER = "rizzify.stage1.gender";
const STORAGE_KEY_FILE = "rizzify.stage1.file";
const UPLOAD_SESSION_KEY = "rizzify.stage2.upload";

type UploadSession = {
  fileId: string;
  gender?: "male" | "female";
  fileMeta?: SelectedFileMeta;
};

async function buildMeta(file: File): Promise<SelectedFileMeta> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const dimensions = await new Promise<{ width: number; height: number }>(
    (resolve) => {
      const image = new Image();
      image.onload = () =>
        resolve({ width: image.width, height: image.height });
      image.onerror = () => resolve({ width: 0, height: 0 });
      image.src = dataUrl;
    },
  );

  return {
    name: file.name,
    sizeMB: file.size / 1024 / 1024,
    width: dimensions.width,
    height: dimensions.height,
    previewUrl: dataUrl,
  };
}

function validate(meta: SelectedFileMeta): UploadHint {
  const reasons: string[] = [];
  if (meta.sizeMB > 20) reasons.push("File exceeds 20MB limit");
  return {
    passed: reasons.length === 0,
    reasons: reasons.length ? reasons : uploadHintDefault.reasons,
  };
}

function readUploadSession(): UploadSession | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(UPLOAD_SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UploadSession;
  } catch {
    return null;
  }
}

function persistUploadSession(session: UploadSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.sessionStorage.removeItem(UPLOAD_SESSION_KEY);
    return;
  }
  window.sessionStorage.setItem(UPLOAD_SESSION_KEY, JSON.stringify(session));
}

export default function StartPage() {
  const router = useRouter();
  const { guardBypass } = useDevAuth();

  const { state: pageState, setState: setPageState } = useDevPageState(
    "start",
    "Start",
    "default",
  );

  const [selectedGender, setSelectedGender] = useState<
    GenderOption["value"] | undefined
  >(undefined);
  const [selectedFile, setSelectedFile] = useState<SelectedFileMeta | null>(
    null,
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null); // 🆕 存储原始文件对象
  const [hint, setHint] = useState<UploadHint>(uploadHintDefault);
  const [preparing, setPreparing] = useState(preparingOverlayMock);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadSession = useMemo(() => readUploadSession(), []);
  const pageViewTrackedRef = useRef(false);

  // 📊 埋点：页面浏览
  useEffect(() => {
    if (!pageViewTrackedRef.current) {
      pageViewTrackedRef.current = true;
      analytics.pageView('/start');
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedGender = window.sessionStorage.getItem(STORAGE_KEY_GENDER) as
      | GenderOption["value"]
      | null;
    const storedFile = window.sessionStorage.getItem(STORAGE_KEY_FILE);
    if (storedGender) setSelectedGender(storedGender);
    if (storedFile) {
      try {
        const parsed = JSON.parse(storedFile) as SelectedFileMeta;
        setSelectedFile(parsed);
        setHint(validate(parsed));
      } catch {
        // ignore invalid cache
      }
    }
    if (uploadSession?.gender) {
      setSelectedGender(uploadSession.gender);
    }
    if (uploadSession?.fileMeta) {
      setSelectedFile(uploadSession.fileMeta);
      setHint(validate(uploadSession.fileMeta));
    }
  }, [uploadSession]);

  useEffect(() => {
    if (pageState === "empty") {
      setSelectedGender(undefined);
      setSelectedFile(null);
      setHint(uploadHintDefault);
      setRetryAfter(0);
      persistUploadSession(null);
    }
    if (pageState === "error") {
      setError("Upload service temporarily unavailable.");
    } else {
      setError(null);
      setRetryAfter(0);
    }
  }, [pageState]);

  useEffect(() => {
    if (retryAfter > 0) {
      const timer = window.setInterval(() => {
        setRetryAfter((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => window.clearInterval(timer);
    }
  }, [retryAfter]);

  const disabled = pageState === "disabled";
  const loading = pageState === "loading";
  // 🚀 优化：不再检查loading状态，因为文件选择是本地处理
  const continueDisabled =
    !selectedGender ||
    !selectedFile ||
    !hint.passed ||
    !pendingFile ||
    disabled ||
    retryAfter > 0;

  const handleGenderChange = (value: "male" | "female") => {
    // 📊 埋点：性别选择
    analytics.track(AnalyticsEvents.GENDER_SELECT, { gender: value });

    setSelectedGender(value);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY_GENDER, value);
    }
    const session = readUploadSession();
    if (session) {
      persistUploadSession({ ...session, gender: value });
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image.");
      return;
    }

    // 检查是否已选择性别
    if (!selectedGender) {
      setShowGenderModal(true);
      return;
    }

    try {
      // 🚀 本地处理 - 无需网络请求
      const meta = await buildMeta(file);
      const validation = validate(meta);

      setSelectedFile(meta);
      setHint(validation);
      setPendingFile(file); // 🆕 存储原始文件对象，用于后续上传

      if (!validation.passed) {
        throw new Error(
          "Selected photo does not meet the quality requirements.",
        );
      }

      // ❌ 移除所有上传API调用
      // ✅ 立即准备就绪，无需等待
      setError(null);
      setPageState("default");

      console.log("✅ File selected and ready for batch processing");
    } catch (err) {
      console.error(err);

      let message = "File selection failed. Please try again.";

      if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setPageState("default");
      setSelectedFile(null);
      setPendingFile(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPendingFile(null); // 🆕 清除待处理文件
    setHint(uploadHintDefault);
    persistUploadSession(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY_FILE);
    }
  };

  const handleGenerate = async () => {
    if (continueDisabled) return;

    if (!pendingFile) {
      setError("Please select a file first");
      return;
    }

    const uploadStartTime = Date.now();
    setPreparing({ ...preparingOverlayMock, visible: true });
    setError(null);
    setUploadProgress(0);

    try {
      // 📊 埋点：上传开始
      analytics.track(AnalyticsEvents.UPLOAD_START, {
        fileSize: pendingFile.size,
        fileType: pendingFile.type
      });

      // 🚀 在这个时机执行上传到R2
      console.log("📤 Uploading file to R2...");
      setUploadProgress(20);

      const uploadInitResponse = await uploadInit({
        filename: pendingFile.name,
        contentType: pendingFile.type as "image/jpeg" | "image/png",
        sizeBytes: pendingFile.size,
      });

      setUploadProgress(40);

      const uploadResponse = await fetch(uploadInitResponse.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": pendingFile.type },
        body: pendingFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload failed");
      }

      console.log("✅ File uploaded successfully to R2");
      setUploadProgress(70);

      // 🚀 调用probe确认上传并更新元数据
      console.log("🔍 Probing upload to confirm and update metadata...");
      await uploadProbe({
        fileId: uploadInitResponse.fileId,
        width: selectedFile?.width || 0,
        height: selectedFile?.height || 0,
        sizeMB: selectedFile?.sizeMB || 0,
      });
      console.log("✅ Upload probe completed");
      setUploadProgress(90);

      // 存储上传成功的信息
      const uploadSession = {
        fileId: uploadInitResponse.fileId,
        gender: selectedGender,
        fileMeta: selectedFile,
      };

      persistUploadSession(uploadSession);
      setUploadProgress(100);

      // 📊 埋点：上传成功
      analytics.track(AnalyticsEvents.UPLOAD_SUCCESS, {
        fileId: uploadInitResponse.fileId,
        duration: Date.now() - uploadStartTime
      });

      // 上传成功，跳转到gen-image页面
      setTimeout(() => {
        setPreparing(preparingOverlayMock);
        const target = selectedGender
          ? `/gen-image?gender=${selectedGender}`
          : "/gen-image";
        router.push(target);
      }, preparingOverlayMock.durationMs);
    } catch (err) {
      console.error("❌ Upload error:", err);

      // 📊 埋点：上传失败
      analytics.track(AnalyticsEvents.UPLOAD_ERROR, {
        errorCode: err instanceof ApiError ? err.code : 'UNKNOWN',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        fileSize: pendingFile.size
      });

      // 上传失败，在当前页面显示错误
      let message = "Upload failed. Please try again.";
      if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setPreparing(preparingOverlayMock);
      setPageState("default");
    }
  };

  const overlayVisible = preparing.visible || pageState === "loading";

  return (
    <div className="relative space-y-10 text-white">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold md:text-4xl">
          Refresh your dating profile in minutes
        </h1>
        <p className="text-sm text-white/70">
          Upload one clear, front-facing photo. We'll do the rest.
        </p>
      </header>

      {error && (
        <ErrorBanner message={error} onRetry={() => setPageState("default")} />
      )}

      <UploadArea
        genderOptions={genderOptions}
        selectedGender={selectedGender}
        onGenderChange={handleGenderChange}
        selectedFile={selectedFile}
        uploadHint={hint}
        onFileSelect={handleFileSelect}
        onFileRemove={handleRemoveFile}
        disabled={disabled}
        isUploading={loading}
        examples={startExamples}
        dropzoneCopy={{
          title: startCopy.dropzoneTitle,
          description: startCopy.dropzoneDescription,
          helper: startCopy.dropzoneHelper,
        }}
      />

      <div className="space-y-4">
        <button
          type="button"
          className="w-full rounded-full bg-white px-6 py-4 text-base font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
          onClick={handleGenerate}
          disabled={continueDisabled}
        >
          {continueDisabled && retryAfter > 0
            ? `Please wait ${retryAfter}s...`
            : "Create my photos"}
        </button>
        <p className="text-xs text-white/50">
          No nudity, impersonation, or minors. Upload runs immediately after
          this step.
          {retryAfter > 0 && (
            <span className="block mt-1 text-yellow-400">
              Rate limited: ${retryAfter}s remaining
            </span>
          )}
        </p>
      </div>

      <LoadingOverlay
        isVisible={overlayVisible}
        title="Preparing your personal model"
        message="This usually takes a few seconds. Please keep this tab open."
        progress={uploadProgress}
        showProgress={uploadProgress > 0}
      />

      <Modal
        isOpen={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        title="Gender Selection Required"
        message="Please select your gender first before uploading a photo. This helps us generate better results for you."
        type="warning"
        confirmText="Got it!"
      />
    </div>
  );
}
