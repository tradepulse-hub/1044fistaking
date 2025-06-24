"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, RefreshCw, AlertCircle } from "lucide-react"
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
  const [slippage, setSlippage] = useState("0.5")
  const [tpfBalance, setTpfBalance] = useState("0")
  const [wddBalance, setWddBalance] = useState("0")
  const { toast } = useToast()

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
  }, [fromAmount, fromToken, toToken, slippage])

  const loadBalances = async () => {
    try {
      // Get TPF balance
      const tpfBalanceData = await holdstationBalanceService.getTPFBalance(userAddress)
      setTpfBalance(tpfBalanceData.formattedBalance)

      // Get WDD balance (you might need to implement this)
      // For now, using a placeholder
      setWddBalance("0.0")
    } catch (error) {
      console.error("Error loading balances:", error)
    }
  }

  const getQuote = async () => {
    if (!fromAmount || Number(fromAmount) <= 0) return

    try {
      setIsLoading(true)

      const tokenAddresses = holdstationSwapService.getTokenAddresses()
      const fromTokenAddress = fromToken === "TPF" ? tokenAddresses.TPF : tokenAddresses.WDD
      const toTokenAddress = toToken === "TPF" ? tokenAddresses.TPF : tokenAddresses.WDD

      const quoteResult = await holdstationSwapService.getSwapQuote(
        fromTokenAddress,
        toTokenAddress,
        fromAmount,
        slippage,
      )

      if (quoteResult) {
        setQuote(quoteResult)
        setToAmount(quoteResult.amountOutFormatted)
      } else {
        setToAmount("0")
        setQuote(null)
      }
    } catch (error) {
      console.error("Error getting quote:", error)
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

      let result
      if (fromToken === "TPF") {
        result = await holdstationSwapService.swapTPFToWDD(fromAmount, slippage)
      } else {
        result = await holdstationSwapService.swapWDDToTPF(fromAmount, slippage)
      }

      if (result.success) {
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
        toast({
          title: "Swap Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Swap Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsSwapping(false)
    }
  }

  const switchTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
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

  return (
    <div className="space-y-4">
      {/* From Token */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">From</span>
          <span className="text-xs text-slate-500">Balance: {formatBalance(getTokenBalance(fromToken))}</span>
        </div>

        <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
          <div className="flex items-center gap-2 flex-1">
            <Image
              src={getTokenLogo(fromToken) || "/placeholder.svg"}
              alt={fromToken}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="font-medium text-slate-300">{fromToken}</span>
          </div>

          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="text-right border-none bg-transparent text-slate-300 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Switch Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={switchTokens}
          className="rounded-full w-10 h-10 p-0 border-slate-600 hover:bg-slate-700"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">To</span>
          <span className="text-xs text-slate-500">Balance: {formatBalance(getTokenBalance(toToken))}</span>
        </div>

        <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
          <div className="flex items-center gap-2 flex-1">
            <Image
              src={getTokenLogo(toToken) || "/placeholder.svg"}
              alt={toToken}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="font-medium text-slate-300">{toToken}</span>
          </div>

          <div className="text-right text-slate-300">
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : toAmount || "0.0"}
          </div>
        </div>
      </div>

      {/* Quote Info */}
      {quote && (
        <div className="space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Price Impact</span>
            <Badge variant="secondary" className="text-xs">
              {Number(quote.priceImpact).toFixed(2)}%
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Slippage</span>
            <span className="text-slate-300">{slippage}%</span>
          </div>
        </div>
      )}

      {/* Slippage Settings */}
      <div className="space-y-2">
        <span className="text-sm text-slate-400">Slippage Tolerance</span>
        <div className="flex gap-2">
          {["0.1", "0.5", "1.0"].map((value) => (
            <Button
              key={value}
              variant={slippage === value ? "default" : "outline"}
              size="sm"
              onClick={() => setSlippage(value)}
              className="text-xs"
            >
              {value}%
            </Button>
          ))}
          <Input
            type="number"
            placeholder="Custom"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            className="w-20 text-xs"
            step="0.1"
            min="0.1"
            max="50"
          />
        </div>
      </div>

      {/* Swap Button */}
      <Button
        onClick={executeSwap}
        disabled={!quote || isSwapping || !fromAmount || Number(fromAmount) <= 0}
        className="w-full elegant-button bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600"
      >
        {isSwapping ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Swapping...
          </div>
        ) : !quote ? (
          "Enter Amount"
        ) : (
          `Swap ${fromToken} → ${toToken}`
        )}
      </Button>

      {/* Warning */}
      <div className="flex items-start gap-2 p-2 bg-amber-900/20 rounded border border-amber-600/30">
        <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200">
          Swapping will affect your staking rewards. Make sure you understand the impact before proceeding.
        </p>
      </div>
    </div>
  )
}
