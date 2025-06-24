"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  AlertCircle,
  FolderOpen,
  Info,
  Home,
  RefreshCw,
  Wifi,
  Shield,
  Mail,
  ExternalLink,
  Lightbulb,
  Zap,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { MiniKit } from "@worldcoin/minikit-js"
import { tptStakingService } from "@/services/tpt-staking-service"
import { drachmaStakingService } from "@/services/drachma-staking-service"
import { drachmaTransactionService } from "@/services/drachma-transaction-service"
import { tptTransactionService } from "@/services/tpt-transaction-service"

export default function TPTStakingApp() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [tpfBalance, setTpfBalance] = useState("0")

  // TPT Token State
  const [tptPendingRewards, setTptPendingRewards] = useState("0")
  const [tptRewardsPerSecond, setTptRewardsPerSecond] = useState("0")

  // Drachma Token State
  const [drachmaPendingRewards, setDrachmaPendingRewards] = useState("0")
  const [drachmaRewardsPerSecond, setDrachmaRewardsPerSecond] = useState("0")

  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [activeTab, setActiveTab] = useState("home")

  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null)
  const [currentTransactionType, setCurrentTransactionType] = useState<"tpt" | "drachma" | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<any>(null)

  const tptRewardsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const drachmaRewardsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch("/api/session")

      if (response.ok) {
        const data = await response.json()

        if (data.authenticated) {
          setIsConnected(true)
          setWalletAddress(data.user.walletAddress)
          setAccount(`${data.user.walletAddress.slice(0, 6)}...${data.user.walletAddress.slice(-4)}`)

          // Load real data
          await loadUserData(data.user.walletAddress)
        }
      }
    } catch (error) {
      console.error("Session check failed:", error)
    }
  }

  const connectWorldWallet = async () => {
    try {
      setIsLoading(true)

      if (!MiniKit.isInstalled()) {
        console.log("Please open in World App")
        return
      }

      // Get nonce from server
      const nonceResponse = await fetch("/api/nonce")
      const { nonce } = await nonceResponse.json()

      // Trigger wallet auth
      const payload = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: crypto.randomUUID(),
        expirationTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        notBefore: new Date(),
        statement: "Connect to Multi-Token Soft Staking",
      })

      if (payload.status === "error") {
        console.log("Wallet connection failed")
        return
      }

      // Verify the payload
      const verifyResponse = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payload.finalPayload, nonce }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResult.isValid) {
        console.log("Wallet verification failed")
        return
      }

      // Login with the verified payload
      const loginResponse = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payload.finalPayload, nonce }),
      })

      const loginResult = await loginResponse.json()

      if (loginResult.success) {
        setIsConnected(true)
        setWalletAddress(loginResult.user.walletAddress)
        setAccount(`${loginResult.user.walletAddress.slice(0, 6)}...${loginResult.user.walletAddress.slice(-4)}`)

        // Load real data
        await loadUserData(loginResult.user.walletAddress)
      } else {
        console.log("Login failed")
      }
    } catch (error) {
      console.error("Connection failed:", error)
      console.log("Connection failed, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserData = async (userAddress: string) => {
    try {
      setIsRefreshing(true)

      console.log("🔄 Loading user data for tokens...")

      // Load TPT Token data
      const tptUserInfo = await tptStakingService.getUserInfo(userAddress)
      console.log("📋 TPT User Info:", tptUserInfo)

      // Load Drachma Token data
      console.log("🪙 Loading Drachma data...")
      const drachmaUserInfo = await drachmaStakingService.getUserInfo(userAddress)
      console.log("📋 Drachma User Info:", drachmaUserInfo)

      // Set shared TPF balance
      setTpfBalance(tptUserInfo.tpfBalance)

      // Set TPT Token specific data
      setTptPendingRewards(tptUserInfo.pendingRewards)
      setTptRewardsPerSecond(tptUserInfo.rewardsPerSecond)

      // Set Drachma Token specific data
      setDrachmaPendingRewards(drachmaUserInfo.pendingRewards)
      setDrachmaRewardsPerSecond(drachmaUserInfo.rewardsPerSecond)

      setNetworkError(false)
    } catch (error) {
      setNetworkError(true)
      loadDemoData()
      console.error("Failed to load user data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadDemoData = () => {
    const demoBalance = 76476285.0

    // TPT: 1% APY
    const tptApy = 0.01
    const tptRewardsPerSec = (demoBalance * tptApy) / (365 * 24 * 60 * 60)

    // Drachma: APY FIXA de 0.01%
    const drachmaApy = 0.0001 // 0.01% APY FIXA
    const drachmaRewardsPerSec = (demoBalance * drachmaApy) / (365 * 24 * 60 * 60)

    setTpfBalance(demoBalance.toString())
    setTptPendingRewards("0.5")
    setTptRewardsPerSecond(tptRewardsPerSec.toFixed(18))
    setDrachmaPendingRewards("0.01")
    setDrachmaRewardsPerSecond(drachmaRewardsPerSec.toFixed(18))
  }

  const disconnectWallet = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      setIsConnected(false)
      setAccount("")
      setWalletAddress("")
      setTpfBalance("0")
      setTptPendingRewards("0")
      setTptRewardsPerSecond("0")
      setDrachmaPendingRewards("0")
      setDrachmaRewardsPerSecond("0")
      setActiveTab("home")
    } catch (error) {
      console.error("Disconnect failed:", error)
    }
  }

  // Real-time rewards calculation for TPT Token
  useEffect(() => {
    if (isConnected && Number(tptRewardsPerSecond) > 0) {
      tptRewardsIntervalRef.current = setInterval(() => {
        setTptPendingRewards((prev) => {
          const current = Number(prev)
          const perSecond = Number(tptRewardsPerSecond)
          const newRewards = current + perSecond * 0.1 // 100ms interval
          return newRewards.toFixed(8)
        })
      }, 100) // Update every 100ms

      return () => {
        if (tptRewardsIntervalRef.current) {
          clearInterval(tptRewardsIntervalRef.current)
        }
      }
    }
  }, [isConnected, tptRewardsPerSecond])

  // Real-time rewards calculation for Drachma Token
  useEffect(() => {
    if (isConnected && Number(drachmaRewardsPerSecond) > 0) {
      drachmaRewardsIntervalRef.current = setInterval(() => {
        setDrachmaPendingRewards((prev) => {
          const current = Number(prev)
          const perSecond = Number(drachmaRewardsPerSecond)
          const newRewards = current + perSecond * 0.1 // 100ms interval
          return newRewards.toFixed(8)
        })
      }, 100) // Update every 100ms

      return () => {
        if (drachmaRewardsIntervalRef.current) {
          clearInterval(drachmaRewardsIntervalRef.current)
        }
      }
    }
  }, [isConnected, drachmaRewardsPerSecond])

  const handleClaimTPTRewards = async () => {
    try {
      setIsLoading(true)

      const result = await tptTransactionService.executeClaimRewards()

      if (result.success && result.transactionId) {
        setCurrentTransactionId(result.transactionId)
        setCurrentTransactionType("tpt")
        setTransactionStatus({ transactionStatus: "pending" })

        // Reset pending rewards
        setTptPendingRewards("0.0")
      } else {
        console.log("TPT claim failed, please try again")
      }
    } catch (error) {
      console.log("Transaction failed, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimDrachmaRewards = async () => {
    try {
      setIsLoading(true)

      const result = await drachmaTransactionService.executeClaimRewards()

      if (result.success && result.transactionId) {
        setCurrentTransactionId(result.transactionId)
        setCurrentTransactionType("drachma")
        setTransactionStatus({ transactionStatus: "pending" })

        // Reset pending rewards
        setDrachmaPendingRewards("0.0")
      } else {
        console.log("Drachma claim failed, please try again")
      }
    } catch (error) {
      console.log("Transaction failed, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (isConnected && walletAddress && !networkError) {
      const interval = setInterval(() => {
        loadUserData(walletAddress)
      }, 30000)
      return () => {
        clearInterval(interval)
      }
    }
  }, [isConnected, walletAddress, networkError])

  // Format large numbers compactly
  const formatBalance = (balance: string) => {
    const num = Number(balance)
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toFixed(0)
  }

  const formatRewards = (rewards: string) => {
    const num = Number(rewards)
    if (num >= 1) {
      return num.toFixed(3)
    }
    return num.toFixed(6)
  }

  const renderContent = () => {
    if (activeTab === "projects") {
      return (
        <div className="space-y-3 scroll-container">
          {/* Contact Info Banner */}
          <Card className="elegant-card bg-gradient-to-r from-slate-800/40 to-gray-800/40 border-slate-600/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-300">Have an idea for your project?</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Contact TPulseFi team for World Chain projects.
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <a
                      href="mailto:support@tradepulsetoken.com"
                      className="text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      support@tradepulsetoken.com
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card className="elegant-card bg-slate-900/60">
            <CardContent className="p-3 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">TPulseFi Projects</h3>

              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="space-y-2">
                  {/* Project Banner */}
                  <div className="relative w-full h-16 rounded-lg overflow-hidden bg-gradient-to-r from-slate-800 to-gray-700">
                    <Image
                      src="/tpulsefi-banner.jpg"
                      alt="TPulseFi - The Global Crypto Bridge"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Project Info */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">TPulseFi</h4>
                    <p className="text-xs text-slate-400">Multi-Token Soft Staking on World Chain</p>

                    <a
                      href="https://worldcoin.org/mini-app?app_id=app_a3a55e132983350c67923dd57dc22c5e&app_mode=mini-app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open TPulseFi
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (activeTab === "info") {
      return (
        <div className="space-y-3 scroll-container">
          <Card className="elegant-card bg-slate-900/60">
            <CardContent className="p-3 space-y-3">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="relative w-12 h-12">
                    <Image
                      src="/logo.png"
                      alt="Multi-Token Soft Staking Logo"
                      fill
                      className="object-contain filter brightness-110"
                    />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Multi-Token Soft Staking</h3>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <div className="bg-slate-800/40 p-2 rounded border border-slate-700/30">
                  <p className="text-slate-200 leading-relaxed text-center text-xs">
                    Earn multiple token rewards based on your TPF holdings without locking tokens.
                  </p>
                </div>

                <div className="bg-slate-800/40 p-2 rounded border border-slate-700/30">
                  <h4 className="text-slate-300 font-medium mb-1 text-xs">Available Rewards:</h4>
                  <ul className="space-y-0.5 text-xs">
                    <li>• TradePulse Token (TPT) - Active</li>
                    <li>• Drachma Token (WDD) - Active</li>
                    <li>• No token locking required</li>
                  </ul>
                </div>

                <div className="space-y-1 pt-1 text-xs">
                  <p>
                    <strong>Network:</strong> World Chain
                  </p>
                  <p>
                    <strong>Status:</strong> {networkError ? "Demo Mode" : "Live"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Home content
    return !isConnected ? (
      // CONNECT SCREEN - COMPACT
      <div className="min-h-screen flex items-center justify-center relative ios-safe-all">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-gray-900"></div>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
          linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
        `,
              backgroundSize: "30px 30px",
              animation: "grid-move 20s linear infinite",
            }}
          ></div>
        </div>

        {/* Connect Card - COMPACT */}
        <div className="relative z-10 w-full max-w-xs mx-4">
          <Card className="elegant-card bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
            <CardContent className="p-4">
              {/* Header - COMPACT */}
              <div className="text-center mb-3">
                {/* Logo - SMALLER */}
                <div className="relative mb-3 logo-container">
                  <div className="air-distortion"></div>
                  <div className="relative w-16 h-16 mx-auto bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center border border-slate-600/50 logo-vibrating">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="filter brightness-110" />
                  </div>
                </div>

                {/* Title - COMPACT */}
                <h1 className="text-xl font-bold mb-1 bg-gradient-to-r from-slate-300 via-white to-slate-300 bg-clip-text text-transparent ios-text-fix">
                  TPulseFi
                </h1>
                <p className="text-slate-400 text-xs mb-3 ios-text-fix">Multi-Token Soft Staking</p>

                {/* Status indicators - COMPACT */}
                <div className="flex items-center justify-center gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <div className="w-1 h-1 bg-slate-500 rounded-full animate-pulse"></div>
                    <span className="ios-text-fix text-xs">World Chain</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Shield className="w-3 h-3" />
                    <span className="ios-text-fix text-xs">Secure</span>
                  </div>
                </div>
              </div>

              {/* Connection section - COMPACT */}
              <div className="space-y-3">
                {/* Wallet icon - SMALLER */}
                <div className="flex justify-center mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-slate-500/20 rounded-full blur-md animate-pulse"></div>
                    <div className="relative w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center border border-slate-600/50">
                      <Wallet className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                </div>

                {/* Text - COMPACT */}
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-semibold text-slate-200 ios-text-fix">Connect Wallet</h3>
                  <p className="text-xs text-slate-400 leading-relaxed ios-text-fix">
                    Connect to start earning rewards
                  </p>
                </div>

                {/* Features list - COMPACT */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                    <span className="ios-text-fix">Hold TPF tokens</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                    <span className="ios-text-fix">Earn multiple token rewards</span>
                  </div>
                </div>

                {/* Connect button - COMPACT */}
                <Button
                  onClick={connectWorldWallet}
                  disabled={isLoading}
                  className="w-full h-10 elegant-button bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 border border-slate-600/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 ios-button-fix"
                >
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ios-text-fix text-sm">Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3 h-3" />
                        <span className="ios-text-fix text-sm">Connect World Wallet</span>
                      </>
                    )}
                  </div>
                </Button>

                {/* Footer - COMPACT */}
                <div className="text-center pt-2 border-t border-slate-700/30">
                  <p className="text-xs text-slate-500 ios-text-fix">Powered by World Chain</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ) : (
      // HOME - COMPACT VERTICAL LIST
      <div className="space-y-2 scroll-container">
        {/* TPF Balance - COMPACT TOP */}
        <div className="text-center py-2 ios-safe-top">
          <div className="text-xs text-slate-400 mb-1 ios-text-fix">Your TPF Balance</div>
          <div className="text-lg font-bold silver-text ios-text-fix">{formatBalance(tpfBalance)} TPF</div>
        </div>

        {/* TPT REWARDS - COMPACT RECTANGLE - ACTIVE */}
        <Card className="elegant-card bg-gradient-to-r from-slate-800/60 to-gray-800/60 border-slate-600/50 mx-3">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Info */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-sm"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center border border-slate-500/50 overflow-hidden">
                    <Image src="/logo.png" alt="TPT Logo" width={32} height={32} className="object-cover" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold silver-text ios-text-fix">TradePulse</h3>
                  <p className="text-xs text-slate-400 ios-text-fix">TPT</p>
                </div>
              </div>

              {/* Right side - Rewards */}
              <div className="text-right">
                <div className="text-xs text-slate-400 ios-text-fix">Pending</div>
                <div className="text-sm font-bold silver-text font-mono ios-text-fix">
                  {formatRewards(tptPendingRewards)}
                </div>
                <div className="text-xs text-slate-500 ios-text-fix">+{Number(tptRewardsPerSecond).toFixed(6)}/s</div>
              </div>
            </div>

            {/* Claim Button - ACTIVE */}
            <div className="mt-2">
              <Button
                onClick={handleClaimTPTRewards}
                disabled={isLoading || Number(tptPendingRewards) <= 0}
                className="w-full h-8 elegant-button bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-semibold text-xs shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 ios-button-fix"
              >
                <div className="flex items-center gap-1">
                  {isLoading && currentTransactionType === "tpt" ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="ios-text-fix">CLAIMING...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      <span className="ios-text-fix">CLAIM TPT</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DRACHMA REWARDS - COMPACT RECTANGLE - ACTIVE */}
        <Card className="elegant-card bg-gradient-to-r from-slate-800/60 to-gray-800/60 border-slate-600/50 mx-3">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              {/* Left side - Logo and Info */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className="absolute inset-0 bg-gray-400/20 rounded-full blur-sm"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center border border-gray-500/50 overflow-hidden">
                    <Image src="/drachma-token.png" alt="WDD Logo" width={32} height={32} className="object-cover" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold silver-text ios-text-fix">Drachma</h3>
                  <p className="text-xs text-slate-400 ios-text-fix">WDD</p>
                </div>
              </div>

              {/* Right side - Rewards */}
              <div className="text-right">
                <div className="text-xs text-slate-400 ios-text-fix">Pending</div>
                <div className="text-sm font-bold silver-text font-mono ios-text-fix">(Surprise!)</div>
                <div className="text-xs text-slate-500 ios-text-fix">
                  +{Number(drachmaRewardsPerSecond).toFixed(8)}/s
                </div>
              </div>
            </div>

            {/* Claim Button - ACTIVE */}
            <div className="mt-2">
              <Button
                onClick={handleClaimDrachmaRewards}
                disabled={isLoading || Number(drachmaPendingRewards) <= 0}
                className="w-full h-8 elegant-button bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-semibold text-xs shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 ios-button-fix"
              >
                <div className="flex items-center gap-1">
                  {isLoading && currentTransactionType === "drachma" ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="ios-text-fix">CLAIMING...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3" />
                      <span className="ios-text-fix">CLAIM WDD</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* INFO FOOTER - COMPACT */}
        <div className="mx-3">
          <Card className="elegant-card bg-slate-900/40 border-slate-700/30">
            <CardContent className="p-2">
              <div className="text-center space-y-1">
                <div className="text-xs text-slate-400 ios-text-fix">Multi-Token Soft Staking</div>
                <div className="text-xs text-slate-500 ios-text-fix">Based on TPF Holdings • No Lock Required</div>
                <div className="flex items-center justify-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    <span className="text-slate-400 ios-text-fix">TPT Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                    <span className="text-slate-400 ios-text-fix">WDD Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-slate-300 relative overflow-hidden scroll-container">
      {/* ELEGANT SILVER BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-gray-900"></div>
        {/* Elegant silver lines */}
        <div className="elegant-lines-bg"></div>
      </div>

      {/* Main container */}
      {!isConnected ? (
        // Full screen connect page
        renderContent()
      ) : (
        // Normal interface with menu
        <>
          {/* Account Info - COMPACT */}
          <div className="flex items-center justify-center gap-2 text-xs py-1 ios-safe-top relative z-10">
            <div
              className={`w-1 h-1 rounded-full animate-pulse ${networkError ? "bg-amber-400" : "bg-emerald-400"}`}
            ></div>
            <span className="text-slate-500 font-mono ios-text-fix text-xs">{account}</span>
            {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />}
            <Badge variant="outline" className="text-xs bg-slate-800/40 text-slate-400 border-slate-600/30 px-1 py-0">
              Multi
            </Badge>
          </div>

          {transactionStatus && (
            <Alert
              className={`bg-slate-900/50 border-slate-600/30 py-1 mx-3 relative z-10 ${
                transactionStatus.transactionStatus === "confirmed"
                  ? "border-emerald-600/30"
                  : transactionStatus.transactionStatus === "failed"
                    ? "border-red-600/30"
                    : "border-amber-600/30"
              }`}
            >
              <AlertCircle
                className={`h-3 w-3 ${
                  transactionStatus.transactionStatus === "confirmed"
                    ? "text-emerald-400"
                    : transactionStatus.transactionStatus === "failed"
                      ? "text-red-400"
                      : "text-amber-400"
                }`}
              />
              <AlertDescription className="text-slate-400 text-xs font-mono ios-text-fix">
                {transactionStatus.transactionStatus === "pending" && "Transaction pending..."}
                {transactionStatus.transactionStatus === "confirmed" &&
                  `${currentTransactionType === "tpt" ? "TPT" : "WDD"} rewards claimed!`}
                {transactionStatus.transactionStatus === "failed" && "Transaction failed"}
              </AlertDescription>
            </Alert>
          )}

          {/* Content */}
          <div className="relative z-10 ios-safe-x pb-20 min-h-screen flex flex-col justify-center">
            <div className="max-w-sm mx-auto space-y-3">
              {/* Header - COMPACT */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="logo-container">
                    <div className="air-distortion"></div>
                    <Image src="/logo.png" alt="Logo" width={20} height={20} className="silver-glow logo-vibrating" />
                  </div>
                  <h1 className="text-base font-bold silver-text ios-text-fix">TPulseFi</h1>
                </div>
              </div>

              {/* Dynamic Content */}
              {renderContent()}
            </div>
          </div>

          {/* Bottom Navigation - COMPACT */}
          <div className="fixed bottom-2 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 z-50 ios-bottom-nav rounded-t-lg mx-2">
            <div className="flex items-center justify-around py-1">
              <button
                onClick={() => setActiveTab("home")}
                className={`flex flex-col items-center p-1 transition-colors ios-button-fix ${
                  activeTab === "home" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                <Home className="h-4 w-4" />
                <span className="text-xs mt-0.5 ios-text-fix">Home</span>
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex flex-col items-center p-1 transition-colors ios-button-fix ${
                  activeTab === "projects" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="text-xs mt-0.5 ios-text-fix">Projects</span>
              </button>
              <button
                onClick={() => setActiveTab("info")}
                className={`flex flex-col items-center p-1 transition-colors ios-button-fix ${
                  activeTab === "info" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                <Info className="h-4 w-4" />
                <span className="text-xs mt-0.5 ios-text-fix">About</span>
              </button>
              <button
                onClick={disconnectWallet}
                className="flex flex-col items-center p-1 transition-colors text-red-400 hover:text-red-300 ios-button-fix"
              >
                <Wallet className="h-4 w-4" />
                <span className="text-xs mt-0.5 ios-text-fix">Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
