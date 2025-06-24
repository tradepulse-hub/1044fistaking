import { ethers } from "ethers"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"

// Contract address - PORTUGAFI ATUALIZADO
const PORTUGAFI_STAKING_CONTRACT = "0xACc9d1bC40546a4EE05f1B54C7847772F4d8990f"
const TPF_TOKEN = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"
const PORTUGAFI_TOKEN = "0x4891D193C882bF16634E342359A18effE97872a4" // Token PortugaFi correto

// ABI COMPLETO BASEADO NO CONTRATO REAL FORNECIDO
const PORTUGAFI_STAKING_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_tpfToken", type: "address" },
      { internalType: "address", name: "_rewardToken", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "calculatePendingRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "calculateRewardsPerSecond",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "calculateRewardsPerDay",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserInfo",
    outputs: [
      { internalType: "uint256", name: "tpfBalance", type: "uint256" },
      { internalType: "uint256", name: "pendingRewards", type: "uint256" },
      { internalType: "uint256", name: "lastClaimTime", type: "uint256" },
      { internalType: "uint256", name: "totalClaimed", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "canClaim",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentAPY",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRewardBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokenAddresses",
    outputs: [
      { internalType: "address", name: "tpfTokenAddress", type: "address" },
      { internalType: "address", name: "rewardTokenAddress", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_days", type: "uint256" },
    ],
    name: "simulateRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getCalculationDetails",
    outputs: [
      { internalType: "uint256", name: "tpfBalance", type: "uint256" },
      { internalType: "uint256", name: "timeStaked", type: "uint256" },
      { internalType: "uint256", name: "apyRateUsed", type: "uint256" },
      { internalType: "uint256", name: "basisPoints", type: "uint256" },
      { internalType: "uint256", name: "secondsPerYear", type: "uint256" },
      { internalType: "uint256", name: "calculatedRewards", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStats",
    outputs: [
      { internalType: "uint256", name: "totalUsers", type: "uint256" },
      { internalType: "uint256", name: "totalRewards", type: "uint256" },
      { internalType: "uint256", name: "contractRewardBalance", type: "uint256" },
      { internalType: "uint256", name: "currentAPY", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getTimeToNextClaim",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
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
  {
    inputs: [],
    name: "rewardToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
]

interface UserInfo {
  tpfBalance: string
  pendingRewards: string
  lastClaimTime: number
  totalClaimed: string
  rewardsPerSecond: string
  contractAPY: string
}

class PortugaFiStakingService {
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
      console.log("🇵🇹 Initializing PortugaFi Staking Service...")
      console.log(`📋 Contract Address: ${PORTUGAFI_STAKING_CONTRACT}`)

      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC)
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`)

      this.contract = new ethers.Contract(PORTUGAFI_STAKING_CONTRACT, PORTUGAFI_STAKING_ABI, this.provider)

      // Test contract com ABI real
      try {
        const apy = await this.contract.getCurrentAPY()
        const apyPercentage = (Number(apy) / 100).toFixed(2)
        console.log(`✅ PortugaFi Contract APY: ${apyPercentage}%`)

        const tokenAddresses = await this.contract.getTokenAddresses()
        console.log(`✅ TPF Token: ${tokenAddresses[0]}`)
        console.log(`✅ PortugaFi Reward Token: ${tokenAddresses[1]}`)

        const rewardBalance = await this.contract.getRewardBalance()
        console.log(`✅ PortugaFi Reward Balance: ${ethers.formatEther(rewardBalance)}`)

        const stats = await this.contract.getStats()
        console.log(`✅ PortugaFi Stats:`, {
          totalUsers: Number(stats[0]),
          totalRewards: ethers.formatEther(stats[1]),
          contractRewardBalance: ethers.formatEther(stats[2]),
          currentAPY: Number(stats[3]) / 100 + "%",
        })
      } catch (error) {
        console.warn("⚠️ PortugaFi contract test calls failed:", error)
      }

      this.initialized = true
      console.log("✅ PortugaFi Staking Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize PortugaFi Staking Service:", error)
    }
  }

  // Obter APY real do contrato
  async getContractAPY(): Promise<string> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.contract) {
        console.log("PortugaFi contract not initialized, using default APY")
        return "1.00"
      }

      console.log("🔍 Fetching real APY from PortugaFi contract...")

      const apy = await this.contract.getCurrentAPY()
      const apyPercentage = (Number(apy) / 100).toFixed(2)

      console.log(`✅ Real PortugaFi APY fetched from contract: ${apyPercentage}%`)
      return apyPercentage
    } catch (error) {
      console.error("❌ Error fetching real APY from PortugaFi contract:", error)
      return "1.00" // Default to 1% if contract call fails
    }
  }

  // Obter informações completas do usuário
  async getUserInfo(walletAddress: string): Promise<UserInfo> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.contract || !walletAddress) {
        throw new Error("PortugaFi contract not initialized or wallet address missing")
      }

      console.log(`🔍 Getting PortugaFi user info for: ${walletAddress}`)

      // Obter informações do usuário usando ABI real
      const userInfo = await this.contract.getUserInfo(walletAddress)
      console.log("📋 Raw PortugaFi user info:", userInfo)

      // Obter APY real do contrato
      const contractAPY = await this.getContractAPY()

      // Calcular recompensas por segundo usando função do contrato
      let rewardsPerSecond = "0"
      try {
        const rewardsPerSecondBN = await this.contract.calculateRewardsPerSecond(walletAddress)
        rewardsPerSecond = ethers.formatEther(rewardsPerSecondBN)
      } catch (error) {
        console.warn("Could not get rewards per second from contract:", error)
        // Fallback calculation
        const tpfBalance = Number(ethers.formatEther(userInfo[0]))
        const apy = Number(contractAPY) / 100
        const rewardsPerSec = (tpfBalance * apy) / (365 * 24 * 60 * 60)
        rewardsPerSecond = rewardsPerSec.toFixed(18)
      }

      const result = {
        tpfBalance: ethers.formatEther(userInfo[0]),
        pendingRewards: ethers.formatEther(userInfo[1]),
        lastClaimTime: Number(userInfo[2]),
        totalClaimed: ethers.formatEther(userInfo[3]),
        rewardsPerSecond,
        contractAPY,
      }

      console.log("✅ PortugaFi user info processed:", result)
      return result
    } catch (error) {
      console.error("❌ Error getting PortugaFi user info:", error)

      // Fallback com dados demo usando 1% APY
      console.log("🔄 Using fallback demo data for PortugaFi with 1% APY")
      const demoBalance = 76476285.0
      const apy = 0.01 // 1% APY
      const rewardsPerSec = (demoBalance * apy) / (365 * 24 * 60 * 60)

      return {
        tpfBalance: demoBalance.toString(),
        pendingRewards: "0.5",
        lastClaimTime: Date.now() / 1000 - 86400,
        totalClaimed: "0.0",
        rewardsPerSecond: rewardsPerSec.toFixed(18),
        contractAPY: "1.00",
      }
    }
  }

  // Verificar se pode fazer claim usando função do contrato
  async canUserClaim(walletAddress: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.contract || !walletAddress) {
        return false
      }

      const canClaim = await this.contract.canClaim(walletAddress)
      console.log(`✅ PortugaFi can claim check: ${canClaim}`)
      return canClaim
    } catch (error) {
      console.error("Error checking if user can claim PortugaFi rewards:", error)
      return false
    }
  }

  // Obter detalhes de cálculo para debug
  async getCalculationDetails(walletAddress: string) {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.contract || !walletAddress) {
        return null
      }

      const details = await this.contract.getCalculationDetails(walletAddress)
      console.log("🔍 PortugaFi Calculation Details:", {
        tpfBalance: ethers.formatEther(details[0]),
        timeStaked: Number(details[1]) + " seconds",
        apyRateUsed: Number(details[2]) / 100 + "%",
        basisPoints: Number(details[3]),
        secondsPerYear: Number(details[4]),
        calculatedRewards: ethers.formatEther(details[5]),
      })

      return details
    } catch (error) {
      console.error("Error getting PortugaFi calculation details:", error)
      return null
    }
  }

  isInitialized() {
    return this.initialized
  }

  getContractAddress() {
    return PORTUGAFI_STAKING_CONTRACT
  }

  // Testar conectividade do contrato
  async testContract(): Promise<boolean> {
    try {
      if (!this.contract) {
        return false
      }

      console.log("🧪 Testing PortugaFi contract connectivity...")

      const apy = await this.contract.getCurrentAPY()
      const tokenAddresses = await this.contract.getTokenAddresses()
      const rewardBalance = await this.contract.getRewardBalance()
      const stats = await this.contract.getStats()

      console.log("🧪 PortugaFi Contract Test Results:")
      console.log(`APY: ${Number(apy) / 100}%`)
      console.log(`TPF Token: ${tokenAddresses[0]}`)
      console.log(`Reward Token: ${tokenAddresses[1]}`)
      console.log(`Reward Balance: ${ethers.formatEther(rewardBalance)}`)
      console.log(`Total Rewards Claimed: ${ethers.formatEther(stats[1])}`)

      return apy > 0 && tokenAddresses[0] === TPF_TOKEN
    } catch (error) {
      console.error("❌ PortugaFi contract test failed:", error)
      return false
    }
  }
}

// Exportar instância única
export const portugaFiStakingService = new PortugaFiStakingService()
