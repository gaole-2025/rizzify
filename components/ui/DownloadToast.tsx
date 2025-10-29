"use client";

interface DownloadToastProps {
  message: string;
  type: 'loading' | 'success' | 'error';
}

export function DownloadToast({ message, type }: DownloadToastProps) {
  const bgColor = {
    loading: 'bg-blue-500/90',
    success: 'bg-green-500/90',
    error: 'bg-red-500/90'
  }[type];

  const icon = {
    loading: '⏳',
    success: '✅',
    error: '❌'
  }[type];

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${bgColor} text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{message}</span>
      {type === 'loading' && (
        <div className="ml-2 flex gap-1">
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      )}
    </div>
  );
}
