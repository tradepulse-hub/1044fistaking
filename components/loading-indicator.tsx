import { cn } from "@/lib/utils"

interface LoadingIndicatorProps {
  isLoading: boolean
  className?: string
}

export function LoadingIndicator({ isLoading, className }: LoadingIndicatorProps) {
  if (!isLoading) {
    return null
  }

  return (
    <div className={cn("relative h-1 overflow-hidden rounded-full bg-slate-700/50 mt-2", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 animate-loading-bar rounded-full" />
    </div>
  )
}
