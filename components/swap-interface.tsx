"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, RefreshCw, AlertCircle, Bug, ChevronDown, ChevronUp, Copy, Zap } from "lucide-react"
import { holdstationSwapService, type SwapQuote } from "@/services/holdstation-swap-service"
import { holdstationBalanceService } from "@/services/holdstation-balance-service"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface SwapInterfaceProps {
  userAddress: string
}

export function SwapInterface({ userAddress }: SwapInterfaceProps) {
  const [fromToken, setFromToken] = useState<"TPF" | "WDD">("TPF")
  const [toToken, setToToken] = useState<"TPF" | "WDD">("WDD")
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [tpfBalance, setTpfBalance] = useState("0")
  const [wddBalance, setWddBalance] = useState("0")
  const [showDebug, setShowDebug] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const { toast } = useToast()

  // SLIPPAGE FIXO DE 3%
  const FIXED_SLIPPAGE = "3.0"

  // Debug logger
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}`
    setDebugLogs((prev) => [...prev.slice(-9), logEntry]) // Keep last 10 logs
    console.log(`[SWAP DEBUG] ${logEntry}`)
  }

  useEffect(() => {
    if (userAddress) {
      loadBalances()
    }
  }, [userAddress])

  useEffect(() => {
    if (fromAmount && Number(fromAmount) > 0) {
      getQuote()
    } else {
      setToAmount("")
      setQuote(null)
    }
  }, [fromAmount, fromToken, toToken])

  const loadBalances = async () => {
    try {
      addDebugLog("🔄 Loading balances...")

      // Test Holdstation SDK first
      const sdkTest = await holdstationBalanceService.testHoldstationSDK()
      addDebugLog(`🧪 Holdstation SDK test: ${sdkTest ? "✅ PASS" : "❌ FAIL"}`)

      // Get TPF balance
      const tpfBalanceData = await holdstationBalanceService.getTPFBalance(userAddress)
      setTpfBalance(tpfBalanceData.formattedBalance)
      addDebugLog(`💰 TPF Balance: ${tpfBalanceData.formattedBalance}`)

      // Get WDD balance (placeholder for now)
      setWddBalance("0.0")
      addDebugLog(`💰 WDD Balance: 0.0 (placeholder)`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      addDebugLog(`❌ Balance loading failed: ${errorMsg}`)
      console.error("Error loading balances:", error)
    }
  }

  const getQuote = async () => {
    if (!fromAmount || Number(fromAmount) <= 0) return

    try {
      setIsLoading(true)
      addDebugLog(`💱 Getting REAL quote from quoter helper: ${fromAmount} ${fromToken} → ${toToken}`)
      addDebugLog(`📋 Fixed slippage: ${FIXED_SLIPPAGE}%`)

      // Test swap service first
      const swapTest = await holdstationSwapService.testSwapService()
      addDebugLog(`🧪 Real quoter service test: ${swapTest ? "✅ PASS" : "❌ FAIL"}`)

      const tokenAddresses = holdstationSwapService.getTokenAddresses()
      const fromTokenAddress = fromToken === "TPF" ? tokenAddresses.TPF : tokenAddresses.WDD
      const toTokenAddress = toToken === "TPF" ? tokenAddresses.TPF : tokenAddresses.WDD

      addDebugLog(`📋 From token: ${fromTokenAddress}`)
      addDebugLog(`📋 To token: ${toTokenAddress}`)
      addDebugLog(`📋 Quoter helper: ${holdstationSwapService.getQuoterAddress()}`)

      const quoteResult = await holdstationSwapService.getSwapQuote(
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        FIXED_SLIPPAGE,
      )

      if (quoteResult && quoteResult.realQuote) {
        setQuote(quoteResult)
        setToAmount(quoteResult.amountOutFormatted)
        addDebugLog(`✅ REAL quote received: ${quoteResult.amountOutFormatted} ${toToken}`)
        addDebugLog(`📊 Price impact: ${quoteResult.priceImpact}%`)
        addDebugLog(`🎯 Quote source: Real market data from quoter helper`)
      } else {
        setToAmount("0")
        setQuote(null)
        addDebugLog(`❌ No real quote received from quoter helper`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      addDebugLog(`❌ Real quote error: ${errorMsg}`)
      console.error("Error getting real quote:", error)
      setToAmount("0")
      setQuote(null)
    } finally {
      setIsLoading(false)
    }
  }

  const executeSwap = async () => {
    if (!quote || !fromAmount) return

    try {
      setIsSwapping(true)
      addDebugLog(`🚀 Executing swap with REAL market data: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`)
      addDebugLog(`📋 Using real quote: ${quote.realQuote ? "✅ YES" : "❌ NO"}`)

      let result
      if (fromToken === "TPF") {
        addDebugLog(`📤 Calling swapTPFToWDD with real quoter...`)
        result = await holdstationSwapService.swapTPFToWDD(fromAmount, FIXED_SLIPPAGE)
      } else {
        addDebugLog(`📤 Calling swapWDDToTPF with real quoter...`)
        result = await holdstationSwapService.swapWDDToTPF(fromAmount, FIXED_SLIPPAGE)
      }

      addDebugLog(`📋 Real swap result: ${JSON.stringify(result)}`)

      if (result.success) {
        addDebugLog(`✅ Real swap successful! TX: ${result.transactionHash}`)
        toast({
          title: "Swap Successful!",
          description: `Swapped ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`,
        })

        // Reset form
        setFromAmount("")
        setToAmount("")
        setQuote(null)

        // Reload balances
        await loadBalances()
      } else {
        addDebugLog(`❌ Real swap failed: ${result.error}`)
        toast({
          title: "Swap Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      addDebugLog(`❌ Real swap exception: ${errorMsg}`)
      toast({
        title: "Swap Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSwapping(false)
    }
  }

  const switchTokens = () => {
    addDebugLog(`🔄 Switching tokens: ${fromToken} ↔ ${toToken}`)
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const copyDebugLogs = async () => {
    try {
      const logsText = debugLogs.join("\n")
      await navigator.clipboard.writeText(logsText)
      toast({
        title: "Debug Logs Copied",
        description: "Debug console content copied to clipboard",
      })
      addDebugLog("📋 Debug logs copied to clipboard")
    } catch (error) {
      addDebugLog("❌ Failed to copy debug logs")
      toast({
        title: "Copy Failed",
        description: "Could not copy debug logs to clipboard",
        variant: "destructive",
      })
    }
  }

  const getTokenLogo = (token: "TPF" | "WDD") => {
    return token === "TPF" ? "/logo.png" : "/drachma-token.png"
  }

  const getTokenBalance = (token: "TPF" | "WDD") => {
    return token === "TPF" ? tpfBalance : wddBalance
  }

  const formatBalance = (balance: string) => {
    const num = Number(balance)
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`
    }
    return num.toFixed(4)
  }

  const clearDebugLogs = () => {
    setDebugLogs([])
    addDebugLog("🧹 Debug logs cleared")
  }

  return (
    <div className="space-y-3">
      {/* Debug Console Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Token Swap</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="h-6 px-2 text-xs border-slate-600 hover:bg-slate-700"
        >
          <Bug className="h-3 w-3 mr-1" />
          Debug
          {showDebug ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>
      </div>

      {/* Debug Console */}
      {showDebug && (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-lg p-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyDebugLogs}
                className="h-5 px-2 text-xs text-slate-500 hover:text-slate-300"
                title="Copy debug logs"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <span className="text-xs font-medium text-slate-400">Debug Console (Real Quoter)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDebugLogs}
              className="h-5 px-2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </Button>
          </div>
          <div className="bg-black/50 rounded border border-slate-800 p-2 max-h-32 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No debug logs yet...</p>
            ) : (
              <div className="space-y-0.5">
                {debugLogs.map((log, index) => (
                  <p key={index} className="text-xs font-mono text-slate-300 leading-tight">
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* From Token - COMPACT */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">From</span>
          <span className="text-xs text-slate-500">Bal: {formatBalance(getTokenBalance(fromToken))}</span>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-slate-700/30">
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src={getTokenLogo(fromToken) || "/placeholder.svg"}
              alt={fromToken}
              width={20}
              height={20}
              className="rounded-full flex-shrink-0"
            />
            <span className="font-medium text-slate-300 text-sm">{fromToken}</span>
          </div>

          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="text-right border-none bg-transparent text-slate-300 placeholder-slate-500 h-8 text-sm"
          />
        </div>
      </div>

      {/* Switch Button - COMPACT */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={switchTokens}
          className="rounded-full w-8 h-8 p-0 border-slate-600 hover:bg-slate-700"
        >
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      </div>

      {/* To Token - COMPACT */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">To</span>
          <span className="text-xs text-slate-500">Bal: {formatBalance(getTokenBalance(toToken))}</span>
        </div>

        <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-slate-700/30">
          <div className="flex items-center gap-2 min-w-0">
            <Image
              src={getTokenLogo(toToken) || "/placeholder.svg"}
              alt={toToken}
              width={20}
              height={20}
              className="rounded-full flex-shrink-0"
            />
            <span className="font-medium text-slate-300 text-sm">{toToken}</span>
          </div>

          <div className="text-right text-slate-300 text-sm min-w-0 flex-1">
            {isLoading ? <RefreshCw className="h-3 w-3 animate-spin ml-auto" /> : toAmount || "0.0"}
          </div>
        </div>
      </div>

      {/* Quote Info - COMPACT */}
      {quote && quote.realQuote && (
        <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded border border-slate-700/20">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-green-400" />
            <span className="text-xs text-slate-400">Real Market</span>
          </div>
          <Badge variant="secondary" className="text-xs h-5">
            {Number(quote.priceImpact).toFixed(2)}% impact
          </Badge>
        </div>
      )}

      {/* Slippage - FIXO 3% */}
      <div className="space-y-1">
        <span className="text-xs text-slate-400">Slippage (Fixed)</span>
        <div className="flex gap-1">
          <Button variant="default" size="sm" disabled className="text-xs h-6 px-2 flex-1 bg-slate-600">
            3.0% (Fixed)
          </Button>
        </div>
      </div>

      {/* Swap Button - COMPACT */}
      <Button
        onClick={executeSwap}
        disabled={!quote || !quote.realQuote || isSwapping || !fromAmount || Number(fromAmount) <= 0}
        className="w-full h-8 elegant-button bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-sm"
      >
        {isSwapping ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Swapping...
          </div>
        ) : !quote ? (
          "Enter Amount"
        ) : !quote.realQuote ? (
          "Getting Real Quote..."
        ) : (
          `Swap ${fromToken} → ${toToken}`
        )}
      </Button>

      {/* Warning - COMPACT */}
      <div className="flex items-start gap-2 p-2 bg-amber-900/20 rounded border border-amber-600/30">
        <AlertCircle className="h-3 w-3 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200 leading-tight">
          Using real market quotes from quoter helper. Swapping affects staking rewards.
        </p>
      </div>
    </div>
  )
}
