/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
// import { getActiveTask } from "@/lib/api/client"; // TODO: getActiveTask not exported
import {
  saveGenerationState,
  loadGenerationState,
  clearGenerationState,
  hasActiveGenerationState,
  createInitializingState,
  isActiveState,
  GenerationState,
} from "@/lib/generation-state";

export default function TestStateRecoveryPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState<GenerationState | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 页面加载时检查当前状态
    const state = loadGenerationState();
    setCurrentState(state);
    addTestResult(`页面加载，当前状态: ${state ? JSON.stringify(state) : 'null'}`);
  }, []);

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testSessionStorage = () => {
    addTestResult("=== 测试 SessionStorage 功能 ===");

    // 创建测试状态
    const testState = createInitializingState(
      "free",
      "male",
      "test-upload-id",
      "test-photo.jpg"
    );

    // 保存状态
    saveGenerationState(testState);
    addTestResult("✅ 保存测试状态到 sessionStorage");

    // 读取状态
    const loadedState = loadGenerationState();
    if (loadedState && loadedState.uploadId === "test-upload-id") {
      addTestResult("✅ 成功从 sessionStorage 读取状态");
      setCurrentState(loadedState);
    } else {
      addTestResult("❌ 从 sessionStorage 读取状态失败");
    }

    // 测试活跃状态判断
    const isActive = loadedState ? isActiveState(loadedState.status) : false;
    addTestResult(`✅ 状态活跃性检查: ${isActive}`);
  };

  const testStateCreation = () => {
    addTestResult("=== 测试状态创建功能 ===");

    const newState = createInitializingState(
      "pro",
      "female",
      "upload-123",
      "profile-photo.png"
    );

    addTestResult(`✅ 创建新状态: ${JSON.stringify(newState)}`);

    // 测试各种状态判断
    const states = ["initializing", "queued", "running", "done", "error"];
    states.forEach(status => {
      const testState = { ...newState, status: status as GenerationState["status"] };
      const active = isActiveState(testState.status);
      addTestResult(`状态 '${status}' 是否活跃: ${active}`);
    });
  };

  const testAPICall = async () => {
    addTestResult("=== 测试 API 调用 ===");
    setIsLoading(true);

    try {
      const response = await getActiveTask();
      setApiResponse(response);
      addTestResult(`✅ API 调用成功: ${JSON.stringify(response)}`);

      if (response.hasActiveTask && response.task) {
        addTestResult(`✅ 找到活跃任务: ID=${response.task.id}, Status=${response.task.status}`);
      } else {
        addTestResult("ℹ️ 没有找到活跃任务");
      }
    } catch (error) {
      addTestResult(`❌ API 调用失败: ${error}`);
      console.error("API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullFlow = async () => {
    addTestResult("=== 测试完整流程 ===");

    // 1. 清除现有状态
    clearGenerationState();
    addTestResult("1️⃣ 清除现有状态");

    // 2. 创建并保存初始化状态
    const initState = createInitializingState(
      "start",
      "male",
      "flow-test-upload",
      "flow-test.jpg"
    );
    saveGenerationState(initState);
    addTestResult("2️⃣ 保存初始化状态");

    // 3. 模拟页面刷新 - 读取状态
    const restoredState = loadGenerationState();
    if (restoredState && isActiveState(restoredState.status)) {
      addTestResult("3️⃣ ✅ 页面刷新后成功恢复状态");
      setCurrentState(restoredState);
    } else {
      addTestResult("3️⃣ ❌ 页面刷新后状态恢复失败");
    }

    // 4. 检查数据库
    try {
      const dbResponse = await getActiveTask();
      if (dbResponse.hasActiveTask) {
        addTestResult("4️⃣ ✅ 数据库中有活跃任务");
      } else {
        addTestResult("4️⃣ ℹ️ 数据库中没有活跃任务（正常，因为我们只是测试）");
      }
    } catch (error) {
      addTestResult(`4️⃣ ❌ 数据库检查失败: ${error}`);
    }
  };

  const clearAll = () => {
    clearGenerationState();
    setCurrentState(null);
    setTestResults([]);
    setApiResponse(null);
    addTestResult("🧹 清除所有状态和测试结果");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 页面标题 */}
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">状态恢复系统测试</h1>
          <p className="text-white/60">测试生成状态恢复功能的各个组件</p>
        </header>

        {/* 测试按钮 */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={testSessionStorage}
            className="rounded-lg bg-blue-500/20 border border-blue-500/40 px-4 py-3 text-sm font-medium transition hover:bg-blue-500/30"
          >
            测试 SessionStorage
          </button>
          <button
            onClick={testStateCreation}
            className="rounded-lg bg-green-500/20 border border-green-500/40 px-4 py-3 text-sm font-medium transition hover:bg-green-500/30"
          >
            测试状态创建
          </button>
          <button
            onClick={testAPICall}
            disabled={isLoading}
            className="rounded-lg bg-purple-500/20 border border-purple-500/40 px-4 py-3 text-sm font-medium transition hover:bg-purple-500/30 disabled:opacity-50"
          >
            {isLoading ? "调用中..." : "测试 API 调用"}
          </button>
          <button
            onClick={testFullFlow}
            className="rounded-lg bg-yellow-500/20 border border-yellow-500/40 px-4 py-3 text-sm font-medium transition hover:bg-yellow-500/30"
          >
            测试完整流程
          </button>
        </section>

        {/* 清除按钮 */}
        <div className="flex justify-center">
          <button
            onClick={clearAll}
            className="rounded-lg bg-red-500/20 border border-red-500/40 px-6 py-3 text-sm font-medium transition hover:bg-red-500/30"
          >
            清除所有状态
          </button>
        </div>

        {/* 当前状态显示 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">当前状态</h2>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <pre className="text-sm text-white/80 whitespace-pre-wrap">
              {currentState ? JSON.stringify(currentState, null, 2) : "没有保存的状态"}
            </pre>
          </div>
        </section>

        {/* API响应显示 */}
        {apiResponse && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">API 响应</h2>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <pre className="text-sm text-white/80 whitespace-pre-wrap">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </section>
        )}

        {/* 测试结果 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">测试日志</h2>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-white/60">还没有测试结果</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result.includes("===") ? (
                      <div className="text-yellow-400 font-bold mt-3 mb-1">{result}</div>
                    ) : result.includes("✅") ? (
                      <div className="text-green-400">{result}</div>
                    ) : result.includes("❌") ? (
                      <div className="text-red-400">{result}</div>
                    ) : result.includes("ℹ️") ? (
                      <div className="text-blue-400">{result}</div>
                    ) : (
                      <div className="text-white/80">{result}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 使用说明 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">使用说明</h2>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="space-y-2 text-sm text-white/70">
              <p><strong>1. 测试 SessionStorage:</strong> 验证状态的保存和读取功能</p>
              <p><strong>2. 测试状态创建:</strong> 验证各种状态判断逻辑</p>
              <p><strong>3. 测试 API 调用:</strong> 验证获取活跃任务的API是否工作</p>
              <p><strong>4. 测试完整流程:</strong> 模拟完整的状态恢复流程</p>
              <p className="mt-4 text-yellow-400">
                <strong>调试提示:</strong> 打开浏览器开发者工具查看控制台日志获取更多详细信息
              </p>
            </div>
          </div>
        </section>

        {/* 手动测试说明 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">手动测试步骤</h2>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="space-y-2 text-sm text-white/70">
              <p><strong>步骤1:</strong> 运行"测试完整流程"创建测试状态</p>
              <p><strong>步骤2:</strong> 刷新这个页面，看看状态是否被恢复</p>
              <p><strong>步骤3:</strong> 前往 /gen-image 页面，看看是否能正确恢复</p>
              <p><strong>步骤4:</strong> 在实际的应用中开始一个生成任务</p>
              <p><strong>步骤5:</strong> 在生成过程中刷新页面，验证状态恢复</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
