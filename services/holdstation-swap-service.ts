import { ethers } from "ethers"
import { Client, Multicall3, Quoter, SwapHelper } from "@holdstation/worldchain-ethers-v5"
import { config, inmemoryTokenStorage, TokenProvider } from "@holdstation/worldchain-sdk"

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
  private provider: ethers.providers.StaticJsonRpcProvider | null = null
  private client: Client | null = null
  private tokenProvider: TokenProvider | null = null
  private quoter: Quoter | null = null
  private swapHelper: SwapHelper | null = null
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

      // Create provider
      this.provider = new ethers.providers.StaticJsonRpcProvider(RPC_URL, {
        chainId: 480,
        name: "worldchain",
      })

      // Test connection
      const network = await this.provider.getNetwork()
      console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`)

      // Initialize Holdstation components
      this.client = new Client(this.provider)
      config.client = this.client
      config.multicall3 = new Multicall3(this.provider)

      this.tokenProvider = new TokenProvider()
      this.quoter = new Quoter(this.client)
      this.swapHelper = new SwapHelper(this.client, {
        tokenStorage: inmemoryTokenStorage,
      })

      // Test token details
      try {
        const tokenDetails = await this.tokenProvider.details(TPF_TOKEN, WDD_TOKEN)
        console.log("✅ Token Details:", {
          TPF: tokenDetails[TPF_TOKEN],
          WDD: tokenDetails[WDD_TOKEN],
        })
      } catch (error) {
        console.warn("⚠️ Could not fetch token details:", error)
      }

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

      if (!this.swapHelper) {
        throw new Error("SwapHelper not initialized")
      }

      console.log("💱 Getting swap quote:", {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        fee,
      })

      const params: SwapParams = {
        tokenIn,
        tokenOut,
        amountIn,
        slippage,
        fee,
      }

      const quoteResponse = await this.swapHelper.quote(params)
      console.log("📋 Raw quote response:", quoteResponse)

      // Get token details for formatting
      const tokenDetails = await this.tokenProvider!.details(tokenOut)
      const tokenOutInfo = tokenDetails[tokenOut]

      const quote: SwapQuote = {
        amountOut: quoteResponse.amountOut || "0",
        amountOutFormatted: tokenOutInfo
          ? ethers.utils.formatUnits(quoteResponse.amountOut || "0", tokenOutInfo.decimals)
          : "0",
        priceImpact: quoteResponse.priceImpact || "0",
        route: quoteResponse.route,
        data: quoteResponse.data,
        to: quoteResponse.to,
        value: quoteResponse.value || "0",
        feeAmountOut: quoteResponse.addons?.feeAmountOut,
      }

      console.log("✅ Formatted quote:", quote)
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
      if (!this.swapHelper) {
        throw new Error("SwapHelper not initialized")
      }

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

      // Prepare swap parameters
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
        feeReceiver: ethers.constants.AddressZero,
      }

      console.log("📋 Swap parameters:", swapParams)

      // Get swap transaction data
      const swapResult = await this.swapHelper.swap(swapParams)
      console.log("📋 Swap transaction data:", swapResult)

      // Execute transaction via MiniKit
      const transactionPayload = {
        transaction: [
          {
            address: swapResult.to,
            abi: [], // Holdstation handles the ABI internally
            functionName: "swap", // This will be handled by the raw transaction data
            args: [],
            value: swapResult.value || "0",
            data: swapResult.data,
          },
        ],
      }

      const miniKitResult = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

      if (miniKitResult.finalPayload?.status === "error") {
        return {
          success: false,
          error: `Swap failed: ${miniKitResult.finalPayload.description || "Unknown error"}`,
          quote,
        }
      }

      if (miniKitResult.finalPayload?.status === "success") {
        return {
          success: true,
          transactionHash: miniKitResult.finalPayload.transaction_id,
          quote,
        }
      }

      return {
        success: false,
        error: "Unexpected response from MiniKit",
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

  // Get simple price quote between tokens
  async getSimpleQuote(tokenA: string, tokenB: string): Promise<any> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.quoter) {
        throw new Error("Quoter not initialized")
      }

      console.log(`📊 Getting simple quote: ${tokenA} → ${tokenB}`)

      const quote = await this.quoter.simple(tokenA, tokenB)
      console.log("📋 Simple quote:", quote)

      return quote
    } catch (error) {
      console.error("❌ Error getting simple quote:", error)
      return null
    }
  }

  // Get smart quote with slippage and deadline
  async getSmartQuote(tokenIn: string, slippage = 3, deadline = 10): Promise<any> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      if (!this.quoter) {
        throw new Error("Quoter not initialized")
      }

      console.log(`🧠 Getting smart quote for ${tokenIn}`)

      const quote = await this.quoter.smart(tokenIn, {
        slippage,
        deadline,
      })

      console.log("📋 Smart quote:", quote)
      return quote
    } catch (error) {
      console.error("❌ Error getting smart quote:", error)
      return null
    }
  }

  // Test swap service connectivity
  async testSwapService(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      console.log("🧪 Testing Holdstation Swap Service...")

      // Test token details
      const tokenDetails = await this.tokenProvider!.details(TPF_TOKEN, WDD_TOKEN)

      // Test simple quote
      const simpleQuote = await this.getSimpleQuote(TPF_TOKEN, WDD_TOKEN)

      console.log("🧪 Swap Service Test Results:")
      console.log("Token Details:", tokenDetails)
      console.log("Simple Quote:", simpleQuote)

      return tokenDetails[TPF_TOKEN] !== undefined && tokenDetails[WDD_TOKEN] !== undefined
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
