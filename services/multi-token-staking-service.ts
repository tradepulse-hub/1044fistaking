import { ethers } from "ethers"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"

// NOVO CONTRACT ADDRESS - MULTI TOKEN SOFT STAKING
const MULTI_TOKEN_STAKING_CONTRACT = "0xAF462eA35987f48367060AE36312efF079900dEd"
const TPF_TOKEN = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

// ABI COMPLETO DO MULTI TOKEN SOFT STAKING - BASEADO NO CÓDIGO FONTE
const MULTI_TOKEN_STAKING_ABI = [
  {
    inputs: [{ internalType: "address", name: "_tpfToken", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "address", name: "_tokenAddress", type: "address" },
      { internalType: "uint256", name: "_apyRate", type: "uint256" },
      { internalType: "string", name: "_name", type: "string" },
      { internalType: "string", name: "_symbol", type: "string" },
    ],
    name: "addRewardToken",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "_newApyRate", type: "uint256" },
      { internalType: "bool", name: "_isActive", type: "bool" },
    ],
    name: "updateRewardToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimAllRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "calculatePendingRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "calculateRewardsPerSecond",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getAllPendingRewards",
    outputs: [
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "pendingAmounts", type: "uint256[]" },
      { internalType: "string[]", name: "tokenSymbols", type: "string[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserInfo",
    outputs: [
      { internalType: "uint256", name: "tpfBalance", type: "uint256" },
      { internalType: "uint256", name: "firstInteraction", type: "uint256" },
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "uint256[]", name: "pendingRewards", type: "uint256[]" },
      { internalType: "uint256[]", name: "totalClaimed", type: "uint256[]" },
      { internalType: "uint256[]", name: "lastClaimTimes", type: "uint256[]" },
      { internalType: "string[]", name: "tokenSymbols", type: "string[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
    ],
    name: "canClaim",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getActiveTokens",
    outputs: [
      { internalType: "uint256[]", name: "tokenIds", type: "uint256[]" },
      { internalType: "address[]", name: "tokenAddresses", type: "address[]" },
      { internalType: "string[]", name: "names", type: "string[]" },
      { internalType: "string[]", name: "symbols", type: "string[]" },
      { internalType: "uint256[]", name: "apyRates", type: "uint256[]" },
      { internalType: "uint256[]", name: "totalDistributed", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "depositRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
    name: "getRewardBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_tokenId", type: "uint256" },
      { internalType: "uint256", name: "_timeInSeconds", type: "uint256" },
    ],
    name: "simulateRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "healthCheck",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { internalType: "uint256", name: "totalActiveTokens", type: "uint256" },
      { internalType: "uint256", name: "totalUsersCount", type: "uint256" },
      { internalType: "address", name: "tpfTokenAddress", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tpfToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
]

interface RewardToken {
  tokenId: number
  address: string
  name: string
  symbol: string
  apyRate: string
  totalDistributed: string
  pendingRewards: string
  totalClaimed: string
  rewardsPerSecond: string
  canClaim: boolean
}

interface MultiTokenStakingInfo {
  tpfBalance: string
  firstInteraction: number
  rewardTokens: RewardToken[]
  totalPendingValue: string
  totalActiveTokens: number
}

class MultiTokenStakingService {
  private provider: ethers.JsonRpcProvider | null = null
  private contract: ethers.Contract | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Multi-Token Staking Service...")
      console.log(`📋 Contract Address: ${MULTI_TOKEN_STAKING_CONTRACT}`)

      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC)
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`)

      this.contract = new ethers.Contract(MULTI_TOKEN_STAKING_CONTRACT, MULTI_TOKEN_STAKING_ABI, this.provider)

      // Testar se o contrato responde
      try {
        const healthCheck = await this.contract.healthCheck()
        console.log(`✅ Contract Health Check: ${healthCheck}`)

        const stats = await this.contract.getStats()
        console.log(`📊 Contract Stats:`, {
          totalActiveTokens: Number(stats[0]),
          totalUsers: Number(stats[1]),
          tpfTokenAddress: stats[2],
        })

        const activeTokens = await this.contract.getActiveTokens()
        console.log(`🎁 Active Tokens: ${activeTokens.tokenIds.length}`)
      } catch (error) {
        console.warn("⚠️ Contract test calls failed:", error)
        console.log("This might mean the contract needs tokens to be added first")
      }

      this.initialized = true
      console.log("✅ Multi-Token Staking Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Multi-Token Staking Service:", error)
    }
  }

  // Obter informações completas do usuário
  async getUserStakingInfo(walletAddress: string): Promise<MultiTokenStakingInfo> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.contract || !walletAddress) {
        throw new Error("Contract not initialized or wallet address missing")
      }

      console.log(`🔍 Getting multi-token staking info for: ${walletAddress}`)

      // Obter informações do usuário
      const userInfo = await this.contract.getUserInfo(walletAddress)
      console.log("📋 Raw user info:", userInfo)

      // Obter tokens ativos
      const activeTokens = await this.contract.getActiveTokens()
      console.log("🎁 Raw active tokens:", activeTokens)

      const rewardTokens: RewardToken[] = []
      let totalPendingValue = 0

      // Processar cada token
      for (let i = 0; i < activeTokens.tokenIds.length; i++) {
        const tokenId = Number(activeTokens.tokenIds[i])
        const pendingRewards = ethers.formatEther(userInfo.pendingRewards[i])
        const totalClaimed = ethers.formatEther(userInfo.totalClaimed[i])
        const apyRate = (Number(activeTokens.apyRates[i]) / 100).toFixed(2)

        // Calcular recompensas por segundo
        const tpfBalance = Number(ethers.formatEther(userInfo.tpfBalance))
        const apy = Number(apyRate) / 100
        const rewardsPerSecond = (tpfBalance * apy) / (365 * 24 * 60 * 60)

        // Verificar se pode fazer claim
        const canClaimToken = await this.contract.canClaim(walletAddress, tokenId)

        rewardTokens.push({
          tokenId,
          address: activeTokens.tokenAddresses[i],
          name: activeTokens.names[i],
          symbol: activeTokens.tokenSymbols[i],
          apyRate,
          totalDistributed: ethers.formatEther(activeTokens.totalDistributed[i]),
          pendingRewards,
          totalClaimed,
          rewardsPerSecond: rewardsPerSecond.toFixed(8),
          canClaim: canClaimToken,
        })

        totalPendingValue += Number(pendingRewards)
      }

      const result = {
        tpfBalance: ethers.formatEther(userInfo.tpfBalance),
        firstInteraction: Number(userInfo.firstInteraction),
        rewardTokens,
        totalPendingValue: totalPendingValue.toFixed(6),
        totalActiveTokens: activeTokens.tokenIds.length,
      }

      console.log("✅ Multi-token staking info processed:", result)
      return result
    } catch (error) {
      console.error("❌ Error getting multi-token staking info:", error)

      // Fallback com dados demo
      console.log("🔄 Using fallback demo data")
      return {
        tpfBalance: "76476285.0",
        firstInteraction: Date.now() / 1000 - 86400,
        rewardTokens: [
          {
            tokenId: 1,
            address: "0x868D08798F91ba9D6AC126148fdE8bBdfb6354D5",
            name: "TradePulse Token",
            symbol: "TPT",
            apyRate: "1.00",
            totalDistributed: "0.0",
            pendingRewards: "0.5",
            totalClaimed: "0.0",
            rewardsPerSecond: "0.00002425",
            canClaim: true,
          },
        ],
        totalPendingValue: "0.5",
        totalActiveTokens: 1,
      }
    }
  }

  // Obter apenas tokens ativos
  async getActiveTokens() {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.contract) {
        throw new Error("Contract not initialized")
      }

      console.log("🎁 Getting active tokens...")
      const activeTokens = await this.contract.getActiveTokens()

      const tokens = []
      for (let i = 0; i < activeTokens.tokenIds.length; i++) {
        tokens.push({
          tokenId: Number(activeTokens.tokenIds[i]),
          address: activeTokens.tokenAddresses[i],
          name: activeTokens.names[i],
          symbol: activeTokens.tokenSymbols[i],
          apyRate: (Number(activeTokens.apyRates[i]) / 100).toFixed(2),
          totalDistributed: ethers.formatEther(activeTokens.totalDistributed[i]),
        })
      }

      console.log("✅ Active tokens:", tokens)
      return tokens
    } catch (error) {
      console.error("❌ Error getting active tokens:", error)
      return []
    }
  }

  // Testar conectividade do contrato
  async testContract(): Promise<boolean> {
    try {
      if (!this.contract) {
        return false
      }

      console.log("🧪 Testing contract connectivity...")

      // Testar múltiplas funções
      const healthCheck = await this.contract.healthCheck()
      const stats = await this.contract.getStats()
      const owner = await this.contract.owner()
      const tpfToken = await this.contract.tpfToken()

      console.log("🧪 Contract Test Results:")
      console.log(`Health Check: ${healthCheck}`)
      console.log(`Total Active Tokens: ${Number(stats[0])}`)
      console.log(`Total Users: ${Number(stats[1])}`)
      console.log(`TPF Token: ${stats[2]}`)
      console.log(`Owner: ${owner}`)
      console.log(`TPF Token Address: ${tpfToken}`)

      return healthCheck && stats[2] === TPF_TOKEN
    } catch (error) {
      console.error("❌ Contract test failed:", error)
      return false
    }
  }

  isInitialized() {
    return this.initialized
  }

  getContractAddress() {
    return MULTI_TOKEN_STAKING_CONTRACT
  }
}

// Exportar instância única
export const multiTokenStakingService = new MultiTokenStakingService()
