"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NotesBar,
  PreviewDrawer,
  ResultSection,
  SectionNav,
  UploadedSection,
} from "@/components/stage1/results";
import { ErrorBanner, Skeleton } from "@/components/stage1/common";
import { DownloadToast } from "@/components/ui/DownloadToast";
import { useDevPageState } from "@/components/dev/DevToolbar";
import { ApiError } from "@/lib/api/client";
import type {
  GenerationSection,
  ResultCardData,
  SectionKey,
  OriginalCard,
} from "@/lib/stage1-data";
import type { TPlanCode } from "@/lib/api/schema";
import { getSupabaseBrowserClient } from "@/src/lib/supabaseClient";
// @ts-nocheck
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// 🚀 新增：用户结果数据接口 - 智能分页版本
interface UserResultsData {
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
  };
  stats: {
    totalTasks: number;
    totalPhotos: number;
    completedTasks: number;
    sectionCounts: {
      uploaded: number;
      free: number;
      start: number;
      pro: number;
    };
    lastGeneratedAt: string | null;
  };
  photos: {
    uploaded: ResultCardData[];
    free: ResultCardData[];
    start: ResultCardData[]; // 预览10张
    pro: ResultCardData[]; // 预览10张
  };
  recentTasks: Array<{
    id: string;
    plan: TPlanCode;
    status: string;
    createdAt: string;
    completedAt: string | null;
    photoCount: number;
    previewImage: string | null;
  }>;
  // 🚀 新增：智能分页信息
  pagination: {
    start: {
      showing: number;
      total: number;
      hasMore: boolean;
    };
    pro: {
      showing: number;
      total: number;
      hasMore: boolean;
    };
  };
}

const NOTES = {
  freePolicy: "Free plan files expire in 24 hours with watermark.",
  retention:
    "Start/Pro keep files for 30 days. Delete removes links immediately.",
  reset: "Daily reset at 02:00 UTC.",
};

interface SectionStateData {
  items: ResultCardData[];
  state: {
    key: SectionKey;
    error?: string;
    downloadingAll: boolean;
    deletingAll: boolean;
  };
}

interface PageState {
  uploaded: SectionStateData;
  free: SectionStateData;
  start: SectionStateData;
  pro: SectionStateData;
}

interface PreviewState {
  open: boolean;
  section: GenerationSection;
  index: number;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

const SECTION_ORDER: SectionKey[] = ["uploaded", "free", "start", "pro"];

function createInitialState(): PageState {
  return {
    uploaded: {
      items: [],
      state: { key: "uploaded", downloadingAll: false, deletingAll: false },
    },
    free: {
      items: [],
      state: { key: "free", downloadingAll: false, deletingAll: false },
    },
    start: {
      items: [],
      state: { key: "start", downloadingAll: false, deletingAll: false },
    },
    pro: {
      items: [],
      state: { key: "pro", downloadingAll: false, deletingAll: false },
    },
  };
}

// 🚀 新增：从用户结果API数据构建页面状态
function buildStateFromUserResults(data: UserResultsData): PageState {
  return {
    uploaded: {
      items: data.photos.uploaded,
      state: { key: "uploaded", downloadingAll: false, deletingAll: false },
    },
    free: {
      items: data.photos.free,
      state: { key: "free", downloadingAll: false, deletingAll: false },
    },
    start: {
      items: data.photos.start,
      state: { key: "start", downloadingAll: false, deletingAll: false },
    },
    pro: {
      items: data.photos.pro,
      state: { key: "pro", downloadingAll: false, deletingAll: false },
    },
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const { state: pageState } = useDevPageState("results", "Results", "default");

  const [sections, setSections] = useState<PageState>(createInitialState());
  const [userResults, setUserResults] = useState<UserResultsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<PreviewState>({
    open: false,
    section: "free",
    index: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    hasMore: false,
    totalPages: 1,
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    onConfirm: () => {},
  });
  const [proPage, setProPage] = useState(1);  // 🐛 修复：初始已加载第1页
  const [proLoading, setProLoading] = useState(false);
  const [startPage, setStartPage] = useState(1);  // 🐛 修复：初始已加载第1页
  const [startLoading, setStartLoading] = useState(false);
  const [downloadToast, setDownloadToast] = useState<{ message: string; type: 'loading' | 'success' | 'error' } | null>(null);
  const actionsDisabled = pageState === "disabled";

  const notes = useMemo(() => NOTES, []);

  // 🚀 优化：并行调用4个独立接口加载用户结果
  const loadUserResults = useCallback(async () => {
    console.log(
      "📊 [Results] loadUserResults called - using parallel API calls",
    );
    try {
      console.log("📡 [Results] Fetching user results from 4 parallel APIs...");

      // 🚀 添加认证token到请求
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // 🚀 优化：使用统一 API 替代 4 个独立请求
      const allResponse = await fetch("/api/user/results/all", {
        headers,
        credentials: "include",
      });

      console.log("📡 [Results] Unified API response received, status:", allResponse.status);

      // 检查响应状态
      if (!allResponse.ok) {
        console.error("❌ [Results] API failed:", allResponse.status);

        if (allResponse.status === 401) {
          console.log("❌ [Results] User not authenticated");
          setError("Please log in to view your results");
          setLoading(false);
          router.push("/");
          return;
        }

        throw new Error(`API failed with status ${allResponse.status}`);
      }

      // 🚀 解析统一 API 响应
      const allData = await allResponse.json();
      console.log("✅ [Results] Unified data loaded:", {
        uploaded: allData.photos.uploaded.length,
        free: allData.photos.free.length,
        start: allData.photos.start.length,
        pro: allData.photos.pro.length,
      });

      // 🚀 直接使用统一 API 的数据
      const userResultsData: UserResultsData = {
        user: allData.user,
        stats: allData.stats,
        photos: allData.photos,
        recentTasks: allData.recentTasks,
        pagination: allData.pagination,
      };

      console.log("✅ [Results] Unified loading completed:", {
        uploaded: allData.photos.uploaded.length,
        free: allData.photos.free.length,
        start: allData.photos.start.length,
        pro: allData.photos.pro.length,
      });

      // 更新状态
      setUserResults(userResultsData);
      const newState = buildStateFromUserResults(userResultsData);
      console.log("🏗️ [Results] New state built from parallel calls");
      setSections(newState);

      setError(null);
      setLoading(false);
    } catch (err) {
      console.error("❌ [Results] Error in parallel loadUserResults:", err);
      setError("Failed to load your results.");
      setLoading(false);
    }
  }, [router]);

  // 🚀 修改：页面加载时直接获取用户所有结果
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      if (!cancelled) {
        await loadUserResults();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [loadUserResults]);

  const handleDownloadAll = async (section: SectionKey) => {
    const items = sections[section].items;
    if (items.length === 0) return;
    
    setSections((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        state: { ...prev[section].state, downloadingAll: true },
      },
    }));
    
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      
      // 显示下载提示
      setDownloadToast({ message: `📦 Packaging ${items.length} photos...`, type: 'loading' });
      console.log(`📄 正在打包 ${items.length} 张 ${section} 照片...`);
      
      // 调用 ZIP 下载 API（下载所有照片）
      const response = await fetch("/api/photos/download-zip", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          section
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create ZIP file");
      }
      
      // 获取 ZIP 文件
      setDownloadToast({ message: `📥 Downloading ZIP file...`, type: 'loading' });
      console.log(`📋 正在下载 ZIP 文件...`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `rizzify_${section}_${Date.now()}.zip`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      
      setDownloadToast({ message: `✅ Downloaded ${items.length} photos!`, type: 'success' });
      console.log(`✅ ZIP 下载成功: ${items.length} 个 ${section} 照片`);
      
      // 3 秒后隐藏提示
      setTimeout(() => setDownloadToast(null), 3000);
    } catch (err) {
      let message = "Failed to download photos. Please try again.";
      if (err instanceof ApiError) {
        if (err.status === 403) {
          message = "Download permission denied. Photos may have expired.";
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 60;
          message = `Too many download requests. Please wait ${retryAfter} seconds before trying again.`;
        } else {
          message = err.message || "Failed to download photos.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      
      console.error("❌ ZIP 下载失败:", message);
      setDownloadToast({ message: `❌ ${message}`, type: 'error' });
      setTimeout(() => setDownloadToast(null), 4000);
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          state: { ...prev[section].state, error: message, downloadingAll: false },
        },
      }));
    } finally {
      setSections((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          state: { ...prev[section].state, downloadingAll: false },
        },
      }));
      console.log(`✅ Download complete for ${section}`);
    }
  };

  const handleDeleteAll = async (section: SectionKey) => {
    const items = sections[section].items;
    if (items.length === 0) return;

    // 🚀 显示漂亮的删除确认对话框
    setConfirmDialog({
      isOpen: true,
      title: `Delete All ${section.charAt(0).toUpperCase() + section.slice(1)} Photos?`,
      message: `You are about to permanently delete ${items.length} ${section} photos. This action cannot be undone.`,
      confirmText: "Delete All",
      isLoading: false,
      onConfirm: async () => {
        // 🚀 立即显示加载状态
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        
        // 🚀 关闭预览抽屉
        setPreview({ open: false, section: "free", index: 0 });
        
        // 🚀 等待1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 🚀 立即关闭对话框
        setConfirmDialog((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        
        // 🚀 异步执行删除（不阻塞UI）
        performDeleteAll(section);
      },
    });
  };

  const handleDeleteSelected = async (
    section: SectionKey,
    selectedIds: string[],
  ) => {
    if (selectedIds.length === 0) return;

    // 🚀 显示漂亮的批量删除确认对话框
    setConfirmDialog({
      isOpen: true,
      title: `Delete Selected ${section.charAt(0).toUpperCase() + section.slice(1)} Photos?`,
      message: `You are about to permanently delete ${selectedIds.length} selected ${section} photos. This action cannot be undone.`,
      confirmText: `Delete ${selectedIds.length} Photos`,
      isLoading: false,
      onConfirm: async () => {
        // 🚀 立即显示加载状态
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        
        // 🚀 关闭预览抽屉
        setPreview({ open: false, section: "free", index: 0 });
        
        // 🚀 等待1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 🚀 立即关闭对话框
        setConfirmDialog((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        
        // 🚀 异步执行删除（不阻塞UI）
        performDeleteSelected(section, selectedIds);
      },
    });
  };

  const performDeleteSelected = async (
    section: SectionKey,
    selectedIds: string[],
  ) => {
    console.log(
      `⚡ [Results] 乐观更新: 立即删除 ${selectedIds.length} 选中的 ${section} 照片`,
    );

    // 🚀 乐观更新：立即从界面删除，不等API响应
    setSections((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: prev[section].items.filter(
          (item) => !selectedIds.includes(item.id),
        ),
      },
    }));

    // 🚀 异步调用API，不阻塞用户操作
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch("/api/photos/delete-batch", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            section
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(
            `✅ [Results] 后台删除成功: ${selectedIds.length} ${section} photos`,
            result,
          );
          // 删除成功后，延迟 1.5 秒后刷新数据，确保后端删除完全完成
          setTimeout(() => {
            console.log(`🔄 [Results] 刷新数据...`);
            loadUserResults();
          }, 1500);
        } else {
          console.error(
            `❌ [Results] 后台删除失败: ${response.status} ${response.statusText}`,
          );
        }
      } catch (err) {
        console.error("❌ [Results] 后台删除API调用失败:", err);
        // 不显示错误给用户，因为UI已经更新了
      }
    })();
  };

  const performDeleteAll = async (section: SectionKey) => {
    const items = sections[section].items;

    console.log(
      `⚡ [Results] 乐观更新: 立即删除所有 ${items.length} ${section} 照片`,
    );

    // 🚀 乐观更新：立即清空界面，不等API响应
    setSections((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: [],
      },
    }));

    // 🚀 异步调用API，不阻塞用户操作
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(
          `/api/photos/delete-batch?section=${section}`,
          {
            method: "DELETE",
            headers,
            credentials: "include",
          },
        );

        if (response.ok) {
          const result = await response.json();
          console.log(
            `✅ [Results] 后台全部删除成功: ${result.totalCount || items.length} ${section} photos`,
            result,
          );
          // 删除成功后，延迟 1.5 秒后刷新数据，确保后端删除完全完成
          setTimeout(() => {
            console.log(`🔄 [Results] 刷新数据...`);
            loadUserResults();
          }, 1500);
        } else {
          console.error(
            `❌ [Results] 后台全部删除失败: ${response.status} ${response.statusText}`,
          );
        }
      } catch (err) {
        console.error("❌ [Results] 后台删除API调用失败:", err);
        // 不显示错误给用户，因为UI已经更新了
      }
    })();
  };

  const handleSelect = (section: GenerationSection, index: number) => {
    setPreview({ open: true, section, index });
  };

  const handleSelectUploaded = (index: number) => {
    // uploaded 图片通常只有一张，不需要复杂的预览功能
    // 可以在这里添加简单的操作，比如显示图片信息
    console.log(`Selected uploaded image at index ${index}`);
  };

  const handleDeleteSingle = async (section: SectionKey, index: number) => {
    const item = sections[section].items[index];
    if (!item) return;

    // 🚀 显示漂亮的单个删除确认对话框
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${section.charAt(0).toUpperCase() + section.slice(1)} Photo?`,
      message: "You are about to permanently delete this photo. This action cannot be undone.",
      confirmText: "Delete Photo",
      isLoading: false,
      onConfirm: async () => {
        // 🚀 立即显示加载状态
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        
        // 🚀 关闭预览抽屉
        setPreview({ open: false, section: "free", index: 0 });
        
        // 🚀 等待1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 🚀 立即关闭对话框
        setConfirmDialog((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        
        // 🚀 异步执行删除（不阻塞UI）
        performDeleteSingle(section, index);
      },
    });
  };

  const performDeleteSingle = async (section: SectionKey, index: number) => {
    const item = sections[section].items[index];
    if (!item) return;

    console.log(`⚡ [Results] 乐观更新: 立即删除 ${section} 照片 ${item.id}`);

    // 🚀 乐观更新：立即从界面删除，不等API响应
    setSections((prev) => {
      const newItems = prev[section].items.filter((_, idx) => idx !== index);
      return {
        ...prev,
        [section]: {
          ...prev[section],
          items: newItems,
        },
      };
    });

    // 🚀 更新预览状态（仅对生成的 section 有效）
    if (section !== "uploaded") {
      setPreview((prevState) => {
        if (!prevState.open) return prevState;
        if (prevState.section !== section) return prevState;
        const remaining = sections[section].items.length - 1;
        if (remaining <= 0) {
          return { open: false, section: prevState.section, index: 0 };
        }
        const nextIndex = Math.min(prevState.index, remaining - 1);
        return { ...prevState, index: nextIndex };
      });
    }

    // 🚀 异步调用API，不阻塞用户操作
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/photos/${item.id}`, {
          method: "DELETE",
          headers,
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          console.log(
            `✅ [Results] 后台单个删除成功: photo ${item.id}`,
            result,
          );
        } else {
          console.error(
            `❌ [Results] 后台单个删除失败: ${response.status} ${response.statusText}`,
          );
        }
      } catch (err) {
        console.error("❌ [Results] 后台删除API调用失败:", err);
        // 不显示错误给用户，因为UI已经更新了
      }
    })();
  };

  const handleDownloadSingle = async (
    section: GenerationSection,
    index: number,
  ) => {
    const item = sections[section].items[index];
    if (!item) return;
    try {
      const link = {
        url: item.url,
        filename: `rizzify_${section}_${Date.now()}.jpg`,
      };
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.download = link.filename;
      anchor.rel = "noopener";
      anchor.target = "_blank";
      anchor.click();
    } catch (err) {
      let message = "Failed to download photo.";
      if (err instanceof ApiError) {
        if (err.status === 403) {
          message = "Download permission denied. Photo may have expired.";
        } else if (err.status === 429) {
          const retryAfter = err.retryAfterSeconds || 30;
          message = `Too many download requests. Please wait ${retryAfter} seconds before trying again.`;
        } else {
          message = err.message || "Failed to download photo.";
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    }
  };

  const sectionCounts = useMemo(
    () => ({
      uploaded: sections.uploaded.items.length,
      free: sections.free.items.length,
      start: sections.start.items.length,
      pro: sections.pro.items.length,
    }),
    [sections],
  );

  const handleClosePreview = () =>
    setPreview((prevState) => ({ ...prevState, open: false }));

  const handlePrevPreview = () => {
    setPreview((prevState) => {
      const items = sections[prevState.section].items;
      if (items.length === 0)
        return { open: false, section: prevState.section, index: 0 };
      const nextIndex = (prevState.index - 1 + items.length) % items.length;
      return { ...prevState, index: nextIndex };
    });
  };

  const handleNextPreview = () => {
    setPreview((prevState) => {
      const items = sections[prevState.section].items;
      if (items.length === 0)
        return { open: false, section: prevState.section, index: 0 };
      const nextIndex = (prevState.index + 1) % items.length;
      return { ...prevState, index: nextIndex };
    });
  };

  // 🚀 改进的加载状态，显示用户统计信息
  if (loading) {
    return (
      <div className="space-y-6">
        {/* 用户信息骨架屏 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-6 space-y-2">
            <div className="h-8 w-48 rounded-lg bg-white/10 animate-pulse"></div>
            <div className="h-4 w-64 rounded-lg bg-white/5 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-8 mx-auto rounded-lg bg-white/10 animate-pulse mb-2"></div>
                <div className="h-4 w-16 mx-auto rounded-lg bg-white/5 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 上传照片骨架屏 */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 h-6 w-32 rounded-lg bg-white/10 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-white/10 animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* 结果区域骨架屏 */}
        {["Free Plan", "Start Plan", "Pro Plan"].map((plan, index) => (
          <div
            key={plan}
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-32 rounded-lg bg-white/10 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse"></div>
                <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: index + 2 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl bg-white/10 animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center text-white/50 text-sm animate-pulse">
          Loading your AI generated gallery...
        </div>
      </div>
    );
  }

  if (error && error === "User not found") {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold text-white">
            User Not Found
          </h1>
          <p className="text-white/70 mb-6">
            We couldn't find your account. Please try logging in again.
          </p>
          <button
            onClick={() => router.push("/")}
            className="rounded-full border border-white/20 bg-white/10 px-6 py-2 text-white hover:bg-white/20"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* 🚀 新的用户统计信息头部 */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        <header className="mb-6 space-y-2 text-white">
          <h1 className="text-2xl font-semibold">My Photos</h1>
          <p className="text-xs text-white/60">
            {userResults?.user.email || "Loading..."} •{" "}
            {sectionCounts.free + sectionCounts.start + sectionCounts.pro}{" "}
            generated images • {userResults?.stats.totalTasks || 0} tasks
            completed
          </p>
        </header>

        {/* 🚀 新增：统计信息卡片 */}
        {userResults && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {userResults.stats.totalTasks}
              </div>
              <div className="text-xs text-white/50">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {userResults.stats.totalPhotos}
              </div>
              <div className="text-xs text-white/50">Total Photos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {userResults.stats.completedTasks}
              </div>
              <div className="text-xs text-white/50">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {sectionCounts.free + sectionCounts.start + sectionCounts.pro}
              </div>
              <div className="text-xs text-white/50">Generated</div>
            </div>
          </div>
        )}

        <SectionNav counts={sectionCounts} />
        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} onRetry={() => loadUserResults()} />
          </div>
        )}
      </section>

      <UploadedSection
        items={sections.uploaded.items.map(
          (item) =>
            ({
              id: item.id,
              url: item.url,
              createdAt: item.createdAt,
            }) as OriginalCard,
        )}
        state={sections.uploaded.state}
        disabled={actionsDisabled}
        onSelect={(index) => handleSelectUploaded(index)}
        onDownloadAll={() => handleDownloadAll("uploaded")}
        onDeleteAll={() => handleDeleteAll("uploaded")}
        onDeleteSelected={(selectedIds) =>
          handleDeleteSelected("uploaded", selectedIds)
        }
        onDeleteSingle={(index) => handleDeleteSingle("uploaded", index)}
      />

      <ResultSection
        section="free"
        data={sections.free.items}
        state={sections.free.state}
        disabled={actionsDisabled}
        error={sections.free.state.error}
        onSelect={(index) => handleSelect("free", index)}
        onDownloadAll={() => handleDownloadAll("free")}
        onDeleteAll={() => handleDeleteAll("free")}
        onDeleteSelected={(selectedIds) =>
          handleDeleteSelected("free", selectedIds)
        }
        onDeleteSingle={(index) => handleDeleteSingle("free", index)}
      />

      {/* 🚀 Start套餐结果 - 使用ResultSection + 分页 */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Start Plan Results</h3>

        {sections.start.items.length > 0 ? (
          <>
            <ResultSection
              section="start"
              data={sections.start.items}
              state={sections.start.state}
              disabled={actionsDisabled}
              error={sections.start.state.error}
              onSelect={(index) => handleSelect("start", index)}
              onDownloadAll={() => handleDownloadAll("start")}
              onDeleteAll={() => handleDeleteAll("start")}
              onDeleteSelected={(selectedIds) =>
                handleDeleteSelected("start", selectedIds)
              }
              onDeleteSingle={(index) => handleDeleteSingle("start", index)}
            />
            {/* 分页按钮 */}
            {userResults && sections.start.items.length < userResults.pagination.start.total && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="text-center text-white/50 text-sm">
                  Showing {userResults.pagination.start.showing} of{" "}
                  {userResults.pagination.start.total} Start photos
                </div>
                <button
                  onClick={async () => {
                    setStartLoading(true);
                    try {
                      const supabase = getSupabaseBrowserClient();
                      const { data: { session } } = await supabase.auth.getSession();
                      const headers: HeadersInit = { "Content-Type": "application/json" };
                      if (session?.access_token) {
                        headers["Authorization"] = `Bearer ${session.access_token}`;
                      }
                      const nextPage = startPage + 1;
                      const response = await fetch(`/api/user/results/start?page=${nextPage}&limit=20`, {
                        headers,
                        credentials: "include",
                      });
                      if (!response.ok) throw new Error("Failed to load more");
                      const data = await response.json();
                      setSections((prev) => ({
                        ...prev,
                        start: {
                          ...prev.start,
                          items: [...prev.start.items, ...data.photos],
                        },
                      }));
                      setStartPage(nextPage);
                    } catch (err) {
                      console.error("Error loading more Start photos:", err);
                    } finally {
                      setStartLoading(false);
                    }
                  }}
                  disabled={startLoading}
                  className="px-6 py-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {startLoading ? "Loading..." : `Load More (${sections.start.items.length}/${userResults.pagination.start.total})`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-white/50">
            <div className="text-lg mb-2">No Start plan photos yet</div>
            <div className="text-sm">
              Generate some AI photos with the Start plan to see them here!
            </div>
            <button
              onClick={() => router.push("/start")}
              className="mt-4 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
            >
              Try Start Plan
            </button>
          </div>
        )}
      </div>

      {/* 🚀 Pro套餐结果 - 使用ResultSection + 分页 */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Pro Plan Results</h3>

        {sections.pro.items.length > 0 ? (
          <>
            <ResultSection
              section="pro"
              data={sections.pro.items}
              state={sections.pro.state}
              disabled={actionsDisabled}
              error={sections.pro.state.error}
              onSelect={(index) => handleSelect("pro", index)}
              onDownloadAll={() => handleDownloadAll("pro")}
              onDeleteAll={() => handleDeleteAll("pro")}
              onDeleteSelected={(selectedIds) =>
                handleDeleteSelected("pro", selectedIds)
              }
              onDeleteSingle={(index) => handleDeleteSingle("pro", index)}
            />
            {/* 分页按钮 */}
            {userResults && sections.pro.items.length < userResults.pagination.pro.total && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="text-center text-white/50 text-sm">
                  Showing {userResults.pagination.pro.showing} of{" "}
                  {userResults.pagination.pro.total} Pro photos
                </div>
                <button
                  onClick={async () => {
                    setProLoading(true);
                    try {
                      const supabase = getSupabaseBrowserClient();
                      const { data: { session } } = await supabase.auth.getSession();
                      const headers: HeadersInit = { "Content-Type": "application/json" };
                      if (session?.access_token) {
                        headers["Authorization"] = `Bearer ${session.access_token}`;
                      }
                      const nextPage = proPage + 1;
                      const response = await fetch(`/api/user/results/pro?page=${nextPage}&limit=20`, {
                        headers,
                        credentials: "include",
                      });
                      if (!response.ok) throw new Error("Failed to load more");
                      const data = await response.json();
                      setSections((prev) => ({
                        ...prev,
                        pro: {
                          ...prev.pro,
                          items: [...prev.pro.items, ...data.photos],
                        },
                      }));
                      setProPage(nextPage);
                    } catch (err) {
                      console.error("Error loading more Pro photos:", err);
                    } finally {
                      setProLoading(false);
                    }
                  }}
                  disabled={proLoading}
                  className="px-6 py-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {proLoading ? "Loading..." : `Load More (${sections.pro.items.length}/${userResults.pagination.pro.total})`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-white/50">
            <div className="text-lg mb-2">No Pro plan photos yet</div>
            <div className="text-sm">
              Generate some AI photos with the Pro plan to see them here!
            </div>
            <button
              onClick={() => router.push("/start")}
              className="mt-4 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
            >
              Try Pro Plan
            </button>
          </div>
        )}
      </div>

      <NotesBar notes={notes} />

      <PreviewDrawer
        open={preview.open}
        section={preview.section}
        taskId="user-gallery" // 🚀 修改：使用统一的taskId
        cards={sections[preview.section].items}
        index={preview.index}
        onClose={handleClosePreview}
        onPrev={handlePrevPreview}
        onNext={handleNextPreview}
        onDelete={(idx) => handleDeleteSingle(preview.section, idx)}
        onDownload={(idx) => handleDownloadSingle(preview.section, idx)}
        onCopyLink={(idx) => handleDownloadSingle(preview.section, idx)}
      />

      {/* 🚀 漂亮的删除确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
        type="danger"
        isLoading={confirmDialog.isLoading}
        onConfirm={async () => {
          await confirmDialog.onConfirm();
        }}
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* 📄 下载进度提示 */}
      {downloadToast && (
        <DownloadToast message={downloadToast.message} type={downloadToast.type} />
      )}
    </div>
  );
}
