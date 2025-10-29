"use client";

interface GenerationBannerProps {
  className?: string;
}

export default function GenerationBanner({ className = "" }: GenerationBannerProps) {
  return (
    <div className={`bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-white/80">
              Creating your AI photos... (10-15 min)
            </p>
          </div>
          <p className="text-xs text-white/60 ml-5">
            💡 Don't refresh this page. Results will appear automatically when ready.
          </p>
        </div>
        <a
          href="/results"
          className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors group ml-4 flex-shrink-0"
        >
          <span>View previous results</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>
    </div>
  );
}
