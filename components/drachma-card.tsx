"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, TrendingUp, Clock, Award } from "lucide-react"
import { drachmaService } from "@/services/drachma-service"
import { useToast } from "@/hooks/use-toast"

interface DrachmaCardProps {
  userAddress: string
}

export function DrachmaCard({ userAddress }: DrachmaCardProps) {
  const [balance, setBalance] = useState("0")
  const [pendingRewards, setPendingRewards] = useState("0")
  const [totalClaimed, setTotalClaimed] = useState("0")
  const [canClaim, setCanClaim] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apy, setAPY] = useState(0)
  const [realtimeRewards, setRealtimeRewards] = useState("0")
  const { toast } = useToast()

  useEffect(() => {
    if (userAddress) {
      loadUserData()
      const interval = setInterval(updateRealtimeRewards, 1000)
      return () => clearInterval(interval)
    }
  }, [userAddress])

  const loadUserData = async () => {
    try {
      const [userBalance, userInfo, userCanClaim, currentAPY] = await Promise.all([
        drachmaService.getBalance(userAddress),
        drachmaService.getUserInfo(userAddress),
        drachmaService.canClaim(userAddress),
        drachmaService.getAPY(),
      ])

      setBalance(userBalance)
      setPendingRewards(userInfo.pendingRewards)
      setTotalClaimed(userInfo.totalClaimed)
      setCanClaim(userCanClaim)
      setAPY(currentAPY)
      setRealtimeRewards(userInfo.pendingRewards)
    } catch (error) {
      console.error("Error loading Drachma data:", error)
    }
  }

  const updateRealtimeRewards = async () => {
    try {
      const rewards = await drachmaService.getPendingRewards(userAddress)
      setRealtimeRewards(rewards)
    } catch (error) {
      console.error("Error updating realtime rewards:", error)
    }
  }

  const handleClaim = async () => {
    setIsLoading(true)
    try {
      const txHash = await drachmaService.claimRewards()
      toast({
        title: "Drachma Rewards Claimed!",
        description: `Transaction: ${txHash.slice(0, 10)}...`,
      })
      await loadUserData()
    } catch (error: any) {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim Drachma rewards",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
            <Coins className="h-4 w-4 text-white" />
          </div>
          Drachma (DRACHMA)
        </CardTitle>
        <Badge variant="secondary" className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          {apy}% APY
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-semibold">{Number.parseFloat(balance).toFixed(4)} DRACHMA</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Claimed</p>
              <p className="text-lg font-semibold flex items-center gap-1">
                <Award className="h-4 w-4 text-green-500" />
                {Number.parseFloat(totalClaimed).toFixed(6)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending Rewards (Live)
              </p>
            </div>
            <p className="text-xl font-bold text-green-600">{Number.parseFloat(realtimeRewards).toFixed(8)} DRACHMA</p>
          </div>

          <Button
            onClick={handleClaim}
            disabled={!canClaim || isLoading}
            className="w-full"
            variant={canClaim ? "default" : "secondary"}
          >
            {isLoading ? "Claiming..." : canClaim ? "Claim Rewards" : "No Rewards Available"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
