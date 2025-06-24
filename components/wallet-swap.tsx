"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Wallet, RefreshCw, ArrowRightLeft } from "lucide-react"

interface WalletSwapProps {
  walletAddress: string
  tpfBalance: string
  isRefreshing: boolean
  onRefresh: () => void
}

export default function WalletSwap({ walletAddress, tpfBalance, isRefreshing, onRefresh }: WalletSwapProps) {
  return (
    <div className="space-y-3 scroll-container">
      <Card className="elegant-card bg-slate-900/60">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">Your Wallet</h3>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">Connected Address:</span>
            </div>
            <code className="text-sm font-mono text-white break-all">
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not Connected"}
            </code>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400">TPF Balance:</span>
            </div>
            <span className="text-lg font-bold silver-text">{Number(tpfBalance).toFixed(2)} TPF</span>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="h-4 w-4 text-slate-400" />
              <h4 className="text-sm font-semibold text-slate-300">Swap Tokens</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This section will allow you to swap between different tokens. The integration with Dynamic for wallet
              management and cross-wallet transfers will be implemented here.
            </p>
            <div className="mt-3 text-center">
              <button className="w-full h-8 elegant-button bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-semibold text-xs shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 ios-button-fix">
                Coming Soon: Swap Functionality
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
