import { cn } from "@/lib/utils"

interface LoadingIndicatorProps {
  isLoading: boolean
  progress: number // Add progress prop
  className?: string
}

export function LoadingIndicator({ isLoading, progress, className }: LoadingIndicatorProps) {
  if (!isLoading) {
    return null
  }

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
