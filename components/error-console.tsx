"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, X, Copy, Trash2, ChevronDown, ChevronUp } from "lucide-react"

interface ErrorLog {
  id: string
  timestamp: Date
  title: string
  message: string
  data?: any
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private listeners: ((logs: ErrorLog[]) => void)[] = []

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  logError(title: string, message: string, data?: any) {
    const log: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      title,
      message,
      data,
    }

    this.logs.unshift(log) // Add to beginning
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(0, 50) // Keep only last 50 errors
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([...this.logs]))

    // Also log to browser console
    console.error(`[${title}] ${message}`, data || "")
  }

  subscribe(listener: (logs: ErrorLog[]) => void) {
    this.listeners.push(listener)
    listener([...this.logs]) // Send current logs immediately

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  clear() {
    this.logs = []
    this.listeners.forEach((listener) => listener([]))
  }

  getLogs() {
    return [...this.logs]
  }
}

export const errorLogger = ErrorLogger.getInstance()

interface ErrorConsoleProps {
  isOpen: boolean
  onClose: () => void
}

export function ErrorConsole({ isOpen, onClose }: ErrorConsoleProps) {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const unsubscribe = errorLogger.subscribe(setLogs)
    return unsubscribe
  }, [isOpen])

  const copyError = (log: ErrorLog) => {
    const errorText = `[${log.timestamp.toLocaleString()}] ${log.title}\n\n${log.message}\n\n${
      log.data ? `Data: ${JSON.stringify(log.data, null, 2)}` : ""
    }`

    navigator.clipboard.writeText(errorText)
  }

  const copyAllErrors = () => {
    const allErrorsText = logs
      .map((log) => {
        const timestamp = log.timestamp.toLocaleString()
        const dataStr = log.data ? `\nData: ${JSON.stringify(log.data, null, 2)}` : ""
        return `[${timestamp}] ${log.title}\n\n${log.message}${dataStr}`
      })
      .join("\n\n" + "=".repeat(80) + "\n\n")

    navigator.clipboard.writeText(allErrorsText)
  }

  const clearErrors = () => {
    errorLogger.clear()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gray-900 border-t border-red-700/50">
        <Card className="h-full bg-gray-900 border-0 rounded-none">
          <CardHeader className="pb-2 bg-red-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <CardTitle className="text-sm text-red-300">Error Console</CardTitle>
                <Badge variant="outline" className="text-xs text-red-400 border-red-600">
                  {logs.length} errors
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsMinimized(!isMinimized)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={copyAllErrors}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                  disabled={logs.length === 0}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={clearErrors}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                  disabled={logs.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button onClick={onClose} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {!isMinimized && (
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {logs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No errors logged</div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-red-900/20 rounded-lg p-4 border border-red-700/30 hover:border-red-600/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <h4 className="text-red-300 font-medium text-sm">{log.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-500 text-xs">{log.timestamp.toLocaleTimeString()}</span>
                            <Button
                              onClick={() => copyError(log)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-red-200 text-sm whitespace-pre-wrap mb-3 font-mono leading-relaxed">
                          {log.message}
                        </div>
                        {log.data && (
                          <details className="mt-2">
                            <summary className="text-red-400 cursor-pointer hover:text-red-300 text-xs">
                              Show Technical Details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-900/50 rounded text-xs overflow-x-auto text-red-400 border border-red-800/30">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
