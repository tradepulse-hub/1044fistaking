import { ethers } from "ethers"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"

// TPF Token Contract Address
const TPF_TOKEN_ADDRESS = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

interface TokenBalance {
  address: string
  balance: string
  formattedBalance: string
  decimals: number
  symbol: string
  name: string
}

interface TokenDetails {
  address: string
  chainId: number
  decimals: number
  symbol: string
  name: string
}

class HoldstationBalanceService {
  private provider: ethers.JsonRpcProvider | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing Holdstation Balance Service...")
      console.log(`📋 RPC: ${WORLDCHAIN_RPC}`)
      console.log(`📋 TPF Token: ${TPF_TOKEN_ADDRESS}`)

      // Create ethers v6 provider
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC)

      // Test connection
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`)

      this.initialized = true
      console.log("✅ Holdstation Balance Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Balance Service:", error)
    }
  }

  // Get TPF balance for a wallet
  async getTPFBalance(walletAddress: string): Promise<TokenBalance> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.provider || !walletAddress) {
        throw new Error("Provider not initialized or wallet address missing")
      }

      console.log(`🔍 Getting TPF balance for: ${walletAddress}`)

      // Mock balance for demo (replace with real contract call)
      const mockBalance = ethers.parseEther("76476285.0")
      const formattedBalance = ethers.formatEther(mockBalance)

      const result: TokenBalance = {
        address: TPF_TOKEN_ADDRESS,
        balance: mockBalance.toString(),
        formattedBalance,
        decimals: 18,
        symbol: "TPF",
        name: "TPulseFi Token",
      }

      console.log("✅ TPF Balance Result:", result)
      return result
    } catch (error) {
      console.error("❌ Error getting TPF balance:", error)

      // Fallback to demo data
      console.log("🔄 Using fallback demo data")
      return {
        address: TPF_TOKEN_ADDRESS,
        balance: ethers.parseEther("76476285.0").toString(),
        formattedBalance: "76476285.0",
        decimals: 18,
        symbol: "TPF",
        name: "TPulseFi Token",
      }
    }
  }

  isInitialized() {
    return this.initialized
  }

  getTPFTokenAddress() {
    return TPF_TOKEN_ADDRESS
  }
}

// Export singleton instance
export const holdstationBalanceService = new HoldstationBalanceService()
export type { TokenBalance, TokenDetails }
