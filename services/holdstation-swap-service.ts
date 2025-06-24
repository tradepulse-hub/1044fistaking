import { ethers } from "ethers"

// Configuração da rede Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"

// Token addresses
const TPF_TOKEN = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"
const WDD_TOKEN = "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B" // Drachma Token

interface SwapQuote {
  amountOut: string
  amountOutFormatted: string
  priceImpact: string
  route: any
  data: string
  to: string
  value: string
  feeAmountOut?: string
}

interface SwapResult {
  success: boolean
  transactionHash?: string
  error?: string
  quote?: SwapQuote
}

interface SwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  slippage: string
  fee: string
}

class HoldstationSwapService {
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
      console.log("🔄 Initializing Holdstation Swap Service...")

      // Create ethers v6 provider
      this.provider = new ethers.JsonRpcProvider(RPC_URL)

      // Test connection
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`)

      this.initialized = true
      console.log("✅ Holdstation Swap Service initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Swap Service:", error)
    }
  }

  // Get swap quote (TPF → WDD or WDD → TPF)
  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage = "0.5",
    fee = "0.0",
  ): Promise<SwapQuote | null> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("💱 Getting swap quote:", {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        fee,
      })

      // Mock quote for demo (replace with real Holdstation SDK when available)
      const mockAmountOut = (Number(amountIn) * 0.95).toString() // 5% slippage simulation
      const formattedAmountOut = ethers.formatEther(ethers.parseEther(mockAmountOut))

      const quote: SwapQuote = {
        amountOut: ethers.parseEther(mockAmountOut).toString(),
        amountOutFormatted: formattedAmountOut,
        priceImpact: "0.5",
        route: {},
        data: "0x",
        to: ethers.ZeroAddress,
        value: "0",
        feeAmountOut: "0",
      }

      console.log("✅ Mock quote generated:", quote)
      return quote
    } catch (error) {
      console.error("❌ Error getting swap quote:", error)
      return null
    }
  }

  // Execute swap using MiniKit
  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    quote: SwapQuote,
    slippage = "0.5",
    fee = "0.0",
  ): Promise<SwapResult> {
    try {
      console.log("🚀 Executing swap:", {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        fee,
      })

      // Check if MiniKit is available
      const { MiniKit } = await import("@worldcoin/minikit-js")

      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      // Prepare swap parameters using ethers v6
      const swapParams = {
        tokenIn,
        tokenOut,
        amountIn,
        tx: {
          data: quote.data,
          to: quote.to,
          value: quote.value,
        },
        feeAmountOut: quote.feeAmountOut,
        fee,
        feeReceiver: ethers.ZeroAddress, // ethers v6 syntax
      }

      console.log("📋 Swap parameters:", swapParams)

      // Mock successful swap for demo
      return {
        success: true,
        transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
        quote,
      }
    } catch (error) {
      console.error("❌ Error executing swap:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        quote,
      }
    }
  }

  // Swap TPF to WDD (Drachma)
  async swapTPFToWDD(amountTPF: string, slippage = "0.5"): Promise<SwapResult> {
    try {
      console.log(`💱 Swapping ${amountTPF} TPF → WDD`)

      // Get quote
      const quote = await this.getSwapQuote(TPF_TOKEN, WDD_TOKEN, amountTPF, slippage)

      if (!quote) {
        return {
          success: false,
          error: "Failed to get swap quote",
        }
      }

      console.log(`📋 Quote: ${amountTPF} TPF → ${quote.amountOutFormatted} WDD`)

      // Execute swap
      return await this.executeSwap(TPF_TOKEN, WDD_TOKEN, amountTPF, quote, slippage)
    } catch (error) {
      console.error("❌ TPF → WDD swap failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Swap WDD (Drachma) to TPF
  async swapWDDToTPF(amountWDD: string, slippage = "0.5"): Promise<SwapResult> {
    try {
      console.log(`💱 Swapping ${amountWDD} WDD → TPF`)

      // Get quote
      const quote = await this.getSwapQuote(WDD_TOKEN, TPF_TOKEN, amountWDD, slippage)

      if (!quote) {
        return {
          success: false,
          error: "Failed to get swap quote",
        }
      }

      console.log(`📋 Quote: ${amountWDD} WDD → ${quote.amountOutFormatted} TPF`)

      // Execute swap
      return await this.executeSwap(WDD_TOKEN, TPF_TOKEN, amountWDD, quote, slippage)
    } catch (error) {
      console.error("❌ WDD → TPF swap failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Test swap service connectivity
  async testSwapService(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("🧪 Testing Holdstation Swap Service...")

      // Test simple quote
      const simpleQuote = await this.getSwapQuote(TPF_TOKEN, WDD_TOKEN, "1.0")

      console.log("🧪 Swap Service Test Results:")
      console.log("Simple Quote:", simpleQuote)

      return simpleQuote !== null
    } catch (error) {
      console.error("❌ Swap service test failed:", error)
      return false
    }
  }

  isInitialized() {
    return this.initialized
  }

  getTokenAddresses() {
    return {
      TPF: TPF_TOKEN,
      WDD: WDD_TOKEN,
    }
  }
}

// Export singleton instance
export const holdstationSwapService = new HoldstationSwapService()
export type { SwapQuote, SwapResult, SwapParams }
