import { ethers } from "ethers"

// Configuração da rede Worldchain
const RPC_URL = "https://worldchain-mainnet.g.alchemy.com/public"

// Token addresses
const TPF_TOKEN = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"
const WDD_TOKEN = "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B" // Drachma Token

// Quoter Helper Contract (Uniswap V3 style)
const QUOTER_HELPER_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e" // World Chain quoter
const QUOTER_HELPER_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
    ],
    name: "quoteExactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "path", type: "bytes" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
    ],
    name: "quoteExactInput",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]

interface SwapQuote {
  amountOut: string
  amountOutFormatted: string
  priceImpact: string
  route: any
  data: string
  to: string
  value: string
  feeAmountOut?: string
  realQuote: boolean
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
  private quoterContract: ethers.Contract | null = null
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private async initialize() {
    if (this.initialized) return

    try {
      console.log("🔄 Initializing Holdstation Swap Service with Real Quoter...")

      // Create basic ethers provider
      this.provider = new ethers.JsonRpcProvider(RPC_URL)

      // Test connection
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`)

      // Initialize quoter contract
      this.quoterContract = new ethers.Contract(QUOTER_HELPER_ADDRESS, QUOTER_HELPER_ABI, this.provider)
      console.log(`📋 Quoter Helper initialized: ${QUOTER_HELPER_ADDRESS}`)

      this.initialized = true
      console.log("✅ Holdstation Swap Service with Real Quoter initialized successfully")
    } catch (error) {
      console.error("❌ Failed to initialize Holdstation Swap Service:", error)
    }
  }

  // Get real market quote from quoter helper
  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippage = "3.0",
    fee = "3000", // 0.3% pool fee
  ): Promise<SwapQuote | null> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.quoterContract) {
        throw new Error("Quoter contract not initialized")
      }

      console.log("💱 Getting REAL market quote from quoter helper:", {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        fee,
      })

      const inputAmount = Number(amountIn)
      if (inputAmount <= 0) {
        throw new Error("Invalid input amount")
      }

      // Convert amount to wei
      const amountInWei = ethers.parseEther(amountIn)
      console.log(`📋 Amount in wei: ${amountInWei.toString()}`)

      // Call quoter helper for real market price
      console.log("📞 Calling quoter helper contract...")

      let amountOut: bigint
      try {
        // Try single pool quote first
        amountOut = await this.quoterContract.quoteExactInputSingle.staticCall(
          tokenIn,
          tokenOut,
          Number(fee), // Pool fee (3000 = 0.3%)
          amountInWei,
          0, // sqrtPriceLimitX96 (0 = no limit)
        )
        console.log(`✅ Single pool quote successful: ${amountOut.toString()}`)
      } catch (singleError) {
        console.warn("⚠️ Single pool quote failed, trying multi-hop:", singleError)

        // Try multi-hop quote if single pool fails
        // Encode path: tokenIn + fee + tokenOut
        const path = ethers.solidityPacked(["address", "uint24", "address"], [tokenIn, Number(fee), tokenOut])

        amountOut = await this.quoterContract.quoteExactInput.staticCall(path, amountInWei)
        console.log(`✅ Multi-hop quote successful: ${amountOut.toString()}`)
      }

      // Format output amount
      const amountOutFormatted = ethers.formatEther(amountOut)
      console.log(`📋 Real market quote: ${amountIn} → ${amountOutFormatted}`)

      // Calculate price impact (simplified)
      const inputValue = Number(amountIn)
      const outputValue = Number(amountOutFormatted)
      const expectedRate = this.getExpectedRate(tokenIn, tokenOut)
      const actualRate = outputValue / inputValue
      const priceImpact = Math.abs(((actualRate - expectedRate) / expectedRate) * 100)

      // Apply slippage (3% fixo)
      const slippageMultiplier = 1 - 0.03 // 3% slippage fixo
      const finalAmount = Number(amountOutFormatted) * slippageMultiplier

      const quote: SwapQuote = {
        amountOut: amountOut.toString(),
        amountOutFormatted: finalAmount.toFixed(8),
        priceImpact: priceImpact.toFixed(4),
        route: {
          path: [tokenIn, tokenOut],
          pools: [`${tokenIn}-${tokenOut}-${fee}`],
          quoterUsed: QUOTER_HELPER_ADDRESS,
        },
        data: "0x", // Real transaction data would be built here
        to: "0x0000000000000000000000000000000000000000", // Real router address
        value: "0",
        feeAmountOut: "0",
        realQuote: true,
      }

      console.log("✅ REAL market quote generated from quoter helper:", quote)
      return quote
    } catch (error) {
      console.error("❌ Error getting REAL quote from quoter helper:", error)

      // Log detailed error for debugging
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          tokenIn,
          tokenOut,
          amountIn,
        })
      }

      return null
    }
  }

  // Get expected rate for price impact calculation
  private getExpectedRate(tokenIn: string, tokenOut: string): number {
    // This would normally come from historical data or oracle
    // For now, using approximate market rates
    if (tokenIn === TPF_TOKEN && tokenOut === WDD_TOKEN) {
      return 0.00001 // Approximate TPF/WDD rate
    } else if (tokenIn === WDD_TOKEN && tokenOut === TPF_TOKEN) {
      return 100000 // Approximate WDD/TPF rate
    }
    return 1
  }

  // Execute swap using MiniKit with real quote
  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    quote: SwapQuote,
    slippage = "3.0",
    fee = "3000",
  ): Promise<SwapResult> {
    try {
      console.log("🚀 Executing swap with REAL quote:", {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        fee,
        realQuote: quote.realQuote,
      })

      // Check if MiniKit is available
      const { MiniKit } = await import("@worldcoin/minikit-js")

      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      if (!quote.realQuote) {
        throw new Error("Cannot execute swap without real market quote")
      }

      console.log("📋 Executing swap with real market data...")
      console.log("📋 Quote from quoter helper:", quote)

      // Real swap execution would happen here
      // This requires integration with actual DEX router
      return {
        success: false,
        error: "Real swap execution requires DEX router integration. Quote obtained from real market data.",
        quote,
      }
    } catch (error) {
      console.error("❌ Error executing swap with real quote:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        quote,
      }
    }
  }

  // Swap TPF to WDD using real quoter
  async swapTPFToWDD(amountTPF: string, slippage = "3.0"): Promise<SwapResult> {
    try {
      console.log(`💱 Swapping ${amountTPF} TPF → WDD (REAL QUOTER)`)

      // Get REAL quote from quoter helper
      const quote = await this.getSwapQuote(TPF_TOKEN, WDD_TOKEN, amountTPF, slippage)

      if (!quote) {
        return {
          success: false,
          error: "Failed to get real market quote from quoter helper",
        }
      }

      console.log(`📋 REAL Market Quote: ${amountTPF} TPF → ${quote.amountOutFormatted} WDD`)
      console.log(`📊 Price Impact: ${quote.priceImpact}%`)

      // Execute swap with real quote
      return await this.executeSwap(TPF_TOKEN, WDD_TOKEN, amountTPF, quote, slippage)
    } catch (error) {
      console.error("❌ TPF → WDD swap with real quoter failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Swap WDD to TPF using real quoter
  async swapWDDToTPF(amountWDD: string, slippage = "3.0"): Promise<SwapResult> {
    try {
      console.log(`💱 Swapping ${amountWDD} WDD → TPF (REAL QUOTER)`)

      // Get REAL quote from quoter helper
      const quote = await this.getSwapQuote(WDD_TOKEN, TPF_TOKEN, amountWDD, slippage)

      if (!quote) {
        return {
          success: false,
          error: "Failed to get real market quote from quoter helper",
        }
      }

      console.log(`📋 REAL Market Quote: ${amountWDD} WDD → ${quote.amountOutFormatted} TPF`)
      console.log(`📊 Price Impact: ${quote.priceImpact}%`)

      // Execute swap with real quote
      return await this.executeSwap(WDD_TOKEN, TPF_TOKEN, amountWDD, quote, slippage)
    } catch (error) {
      console.error("❌ WDD → TPF swap with real quoter failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Test swap service with real quoter
  async testSwapService(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("🧪 Testing Holdstation Swap Service with REAL Quoter...")

      // Test basic connectivity
      if (!this.provider) {
        console.log("❌ Provider not initialized")
        return false
      }

      if (!this.quoterContract) {
        console.log("❌ Quoter contract not initialized")
        return false
      }

      // Test network connection
      const network = await this.provider.getNetwork()
      console.log(`✅ Network test: ${network.name} (${network.chainId})`)

      // Test quoter contract
      try {
        const code = await this.provider.getCode(QUOTER_HELPER_ADDRESS)
        if (code === "0x") {
          console.log("❌ Quoter contract not deployed")
          return false
        }
        console.log("✅ Quoter contract deployed")
      } catch (error) {
        console.log("❌ Quoter contract check failed:", error)
        return false
      }

      // Test real quote
      const testQuote = await this.getSwapQuote(TPF_TOKEN, WDD_TOKEN, "1.0")
      const quoteSuccess = testQuote !== null && testQuote.realQuote === true
      console.log(`✅ Real quoter test: ${quoteSuccess ? "SUCCESS" : "FAILED"}`)

      return quoteSuccess
    } catch (error) {
      console.error("❌ Swap service test with real quoter failed:", error)
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

  getQuoterAddress() {
    return QUOTER_HELPER_ADDRESS
  }
}

// Export singleton instance
export const holdstationSwapService = new HoldstationSwapService()
export type { SwapQuote, SwapResult, SwapParams }
