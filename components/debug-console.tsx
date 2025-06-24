"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, X, Copy, Trash2, ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle } from "lucide-react"

interface DebugLog {
  id: string
  timestamp: Date
  level: "info" | "warn" | "error" | "success"
  message: string
  data?: any
}

class DebugLogger {
  private static instance: DebugLogger
  private logs: DebugLog[] = []
  private listeners: ((logs: DebugLog[]) => void)[] = []

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger()
    }
    return DebugLogger.instance
  }

  log(level: "info" | "warn" | "error" | "success", message: string, data?: any) {
    const log: DebugLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      data,
    }

    this.logs.unshift(log) // Add to beginning
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100) // Keep only last 100 logs
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([...this.logs]))

    // Also log to browser console
    const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : "log"
    console[consoleMethod](`[DEBUG ${level.toUpperCase()}] ${message}`, data || "")
  }

  info(message: string, data?: any) {
    this.log("info", message, data)
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data)
  }

  error(message: string, data?: any) {
    this.log("error", message, data)
  }

  success(message: string, data?: any) {
    this.log("success", message, data)
  }

  subscribe(listener: (logs: DebugLog[]) => void) {
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

export const debugLogger = DebugLogger.getInstance()

interface DebugConsoleProps {
  isOpen: boolean
  onToggle: () => void
}

export function DebugConsole({ isOpen, onToggle }: DebugConsoleProps) {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = debugLogger.subscribe(setLogs)
    return unsubscribe
  }, [])

  // Auto scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current && !isMinimized) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [logs, isMinimized])

  const copyLog = (log: DebugLog) => {
    const logText = `[${log.timestamp.toLocaleString()}] ${log.level.toUpperCase()}: ${log.message}\n${
      log.data ? `Data: ${JSON.stringify(log.data, null, 2)}` : ""
    }`
    navigator.clipboard.writeText(logText)
  }

  const copyAllLogs = () => {
    const allLogsText = logs
      .map((log) => {
        const timestamp = log.timestamp.toLocaleString()
        const dataStr = log.data ? `\nData: ${JSON.stringify(log.data, null, 2)}` : ""
        return `[${timestamp}] ${log.level.toUpperCase()}: ${log.message}${dataStr}`
      })
      .join("\n\n")

    navigator.clipboard.writeText(allLogsText)
  }

  const clearLogs = () => {
    debugLogger.clear()
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertTriangle className="h-3 w-3 text-red-400" />
      case "warn":
        return <AlertTriangle className="h-3 w-3 text-yellow-400" />
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-400" />
      default:
        return <Info className="h-3 w-3 text-blue-400" />
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-300 bg-red-900/20 border-red-700/30"
      case "warn":
        return "text-yellow-300 bg-yellow-900/20 border-yellow-700/30"
      case "success":
        return "text-green-300 bg-green-900/20 border-green-700/30"
      default:
        return "text-blue-300 bg-blue-900/20 border-blue-700/30"
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed top-2 right-2 z-50">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-gray-900/90 border-gray-700/50 text-gray-300 hover:text-gray-200"
        >
          <Terminal className="h-4 w-4 mr-1" />
          Debug
          {logs.length > 0 && (
            <Badge variant="outline" className="ml-1 text-xs bg-blue-600 text-white border-blue-500">
              {logs.length}
            </Badge>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
      <Card className="bg-gray-900 border-0 rounded-none">
        <CardHeader className="pb-2 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-green-400" />
              <CardTitle className="text-sm text-green-300">Debug Console</CardTitle>
              <Badge variant="outline" className="text-xs text-green-400 border-green-600">
                {logs.length} logs
              </Badge>
              {logs.filter((l) => l.level === "error").length > 0 && (
                <Badge variant="outline" className="text-xs text-red-400 border-red-600">
                  {logs.filter((l) => l.level === "error").length} errors
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300"
              >
                {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
              <Button
                onClick={copyAllLogs}
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300"
                disabled={logs.length === 0}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={clearLogs}
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300"
                disabled={logs.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button onClick={onToggle} variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent className="p-0">
            <ScrollArea className="h-48 p-3" ref={scrollAreaRef}>
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No debug logs yet</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className={`rounded p-2 border text-xs font-mono ${getLogColor(log.level)}`}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getLogIcon(log.level)}
                          <span className="font-semibold">{log.level.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{log.timestamp.toLocaleTimeString()}</span>
                          <Button
                            onClick={() => copyLog(log)}
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 text-gray-400 hover:text-gray-300"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap break-words">{log.message}</div>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="cursor-pointer hover:text-gray-200 text-xs">Show Data</summary>
                          <pre className="mt-1 p-2 bg-gray-800/50 rounded text-xs overflow-x-auto">
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
  )
}
