"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Bug } from "lucide-react"
import { softStakingService } from "@/services/soft-staking-service"
import { portugaFiStakingService } from "@/services/portugal-staking-service"
import { drachmaStakingService } from "@/services/drachma-staking-service"

interface ContractDebugInfo {
  name: string
  address: string
  isConnected: boolean
  apy: string
  rewardBalance: string
  canClaim: boolean
  userBalance: string
  pendingRewards: string
  error?: string
}

interface ContractDebuggerProps {
  walletAddress: string
  isOpen: boolean
  onClose: () => void
}

export function ContractDebugger({ walletAddress, isOpen, onClose }: ContractDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<ContractDebugInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const debugContracts = async () => {
    if (!walletAddress) return

    setIsLoading(true)
    const results: ContractDebugInfo[] = []

    // Debug TPT Contract
    try {
      console.log("🔍 Debugging TPT Contract...")
      const tptConnected = await softStakingService.testContract()
      const tptUserInfo = await softStakingService.getUserInfo(walletAddress)
      const tptCanClaim = await softStakingService.canUserClaim(walletAddress)

      results.push({
        name: "TradePulse (TPT)",
        address: softStakingService.getContractAddress(),
        isConnected: tptConnected,
        apy: tptUserInfo.contractAPY + "%",
        rewardBalance: "Unknown", // Would need additional call
        canClaim: tptCanClaim,
        userBalance: tptUserInfo.tpfBalance,
        pendingRewards: tptUserInfo.pendingRewards,
      })
    } catch (error) {
      results.push({
        name: "TradePulse (TPT)",
        address: softStakingService.getContractAddress(),
        isConnected: false,
        apy: "Error",
        rewardBalance: "Error",
        canClaim: false,
        userBalance: "0",
        pendingRewards: "0",
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Debug PortugaFi Contract
    try {
      console.log("🔍 Debugging PortugaFi Contract...")
      const ptfConnected = await portugaFiStakingService.testContract()
      const ptfUserInfo = await portugaFiStakingService.getUserInfo(walletAddress)
      const ptfCanClaim = await portugaFiStakingService.canUserClaim(walletAddress)

      results.push({
        name: "PortugaFi (PTF)",
        address: portugaFiStakingService.getContractAddress(),
        isConnected: ptfConnected,
        apy: ptfUserInfo.contractAPY + "%",
        rewardBalance: "Unknown",
        canClaim: ptfCanClaim,
        userBalance: ptfUserInfo.tpfBalance,
        pendingRewards: ptfUserInfo.pendingRewards,
      })
    } catch (error) {
      results.push({
        name: "PortugaFi (PTF)",
        address: portugaFiStakingService.getContractAddress(),
        isConnected: false,
        apy: "Error",
        rewardBalance: "Error",
        canClaim: false,
        userBalance: "0",
        pendingRewards: "0",
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Debug Drachma Contract
    try {
      console.log("🔍 Debugging Drachma Contract...")
      const wddConnected = await drachmaStakingService.testContract()
      const wddUserInfo = await drachmaStakingService.getUserInfo(walletAddress)
      const wddCanClaim = await drachmaStakingService.canUserClaim(walletAddress)

      results.push({
        name: "Drachma (WDD)",
        address: drachmaStakingService.getContractAddress(),
        isConnected: wddConnected,
        apy: wddUserInfo.contractAPY + "%",
        rewardBalance: "Unknown",
        canClaim: wddCanClaim,
        userBalance: wddUserInfo.tpfBalance,
        pendingRewards: wddUserInfo.pendingRewards,
      })
    } catch (error) {
      results.push({
        name: "Drachma (WDD)",
        address: drachmaStakingService.getContractAddress(),
        isConnected: false,
        apy: "Error",
        rewardBalance: "Error",
        canClaim: false,
        userBalance: "0",
        pendingRewards: "0",
        error: error instanceof Error ? error.message : String(error),
      })
    }

    setDebugInfo(results)
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gray-900 border-t border-blue-700/50">
        <Card className="h-full bg-gray-900 border-0 rounded-none">
          <CardHeader className="pb-2 bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-sm text-blue-300">Contract Debugger</CardTitle>
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-600">
                  {debugInfo.length} contracts
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={debugContracts}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300"
                  disabled={isLoading}
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
                <Button onClick={onClose} variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                  ✕
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <div className="text-center py-8">
                <Button onClick={debugContracts} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Debugging..." : "Start Debug"}
                </Button>
              </div>
            ) : (
              debugInfo.map((contract, index) => (
                <Card key={index} className="bg-gray-800/50 border-gray-700/30">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">{contract.name}</h4>
                        <div className="flex items-center gap-1">
                          {contract.isConnected ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-xs text-gray-400">{contract.isConnected ? "Connected" : "Failed"}</span>
                        </div>
                      </div>

                      {/* Contract Address */}
                      <div className="text-xs text-gray-400 font-mono break-all">{contract.address}</div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">APY:</span>
                          <span className="text-white ml-1">{contract.apy}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Can Claim:</span>
                          <span className={`ml-1 ${contract.canClaim ? "text-green-400" : "text-red-400"}`}>
                            {contract.canClaim ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">TPF Balance:</span>
                          <span className="text-white ml-1">{Number(contract.userBalance).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Pending:</span>
                          <span className="text-yellow-400 ml-1">{Number(contract.pendingRewards).toFixed(6)}</span>
                        </div>
                      </div>

                      {/* Error */}
                      {contract.error && (
                        <div className="bg-red-900/20 border border-red-700/30 rounded p-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0 mt-0.5" />
                            <span className="text-red-300 text-xs">{contract.error}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Summary */}
            {debugInfo.length > 0 && (
              <Card className="bg-blue-900/20 border-blue-700/30">
                <CardContent className="p-3">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2">Debug Summary</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connected Contracts:</span>
                      <span className="text-white">{debugInfo.filter((c) => c.isConnected).length}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Claimable Contracts:</span>
                      <span className="text-white">{debugInfo.filter((c) => c.canClaim).length}/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Pending:</span>
                      <span className="text-yellow-400">
                        {debugInfo.reduce((sum, c) => sum + Number(c.pendingRewards), 0).toFixed(6)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
