import { cn } from "@/lib/utils"

interface LoadingIndicatorProps {
  isLoading: boolean // For transaction progress (0-100%)
  progress: number // Add progress prop
  isRefreshing?: boolean // For background data refresh (indeterminate)
  className?: string
}

export function LoadingIndicator({ isLoading, progress, isRefreshing = false, className }: LoadingIndicatorProps) {
  if (!isLoading && !isRefreshing) {
    return null
  }

  // If it's a transaction loading, show percentage progress
  if (isLoading) {
    return (
      <div className={cn("relative h-1 overflow-hidden rounded-full bg-slate-700/50 mt-2", className)}>
        <div
          className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }} // Control width with progress
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-200">
          {progress > 0 && `${Math.round(progress)}%`}
        </div>
      </div>
    )
  }

  // If it's refreshing (but not a transaction), show an indeterminate bar
  if (isRefreshing) {
    return (
      <div className={cn("relative h-1 overflow-hidden rounded-full bg-slate-700/50 mt-2", className)}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse" />
      </div>
    )
  }

  return null
}
