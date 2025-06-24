import { MiniKit } from "@worldcoin/minikit-js"

// Contract address - TPT
const TPT_STAKING_CONTRACT = "0x123456789abcdef123456789abcdef123456789a"

// ABI IDÊNTICO AO QUE FUNCIONA
const TPT_STAKING_ABI = [
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

interface TransactionResult {
  success: boolean
  transactionId?: string
  error?: string
  debugUrl?: string
}

class TPTTransactionService {
  private static instance: TPTTransactionService

  static getInstance(): TPTTransactionService {
    if (!TPTTransactionService.instance) {
      TPTTransactionService.instance = new TPTTransactionService()
    }
    return TPTTransactionService.instance
  }

  // CLAIM TPT REWARDS
  async executeClaimRewards(): Promise<TransactionResult> {
    try {
      console.log("🎯 Starting TPT claim...")

      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const transactionPayload = {
        transaction: [
          {
            address: TPT_STAKING_CONTRACT,
            abi: TPT_STAKING_ABI,
            functionName: "claimRewards",
            args: [],
          },
        ],
      }

      console.log("🚀 TPT transaction payload", {
        contract: TPT_STAKING_CONTRACT,
        function: "claimRewards",
      })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)
      console.log("📋 TPT MiniKit result", result)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("TPT_CLAIM", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        console.error("❌ TPT claim failed", {
          error: result.finalPayload,
          debugUrl,
        })

        return { success: false, error: errorMsg, debugUrl }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ TPT claim SUCCESS", {
          transactionId: result.finalPayload.transaction_id,
        })
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `TPT claim failed: ${error instanceof Error ? error.message : String(error)}`
      console.error("❌ TPT claim exception", error)
      return { success: false, error: errorMsg }
    }
  }

  // FORMATAÇÃO DE ERRO
  private formatError(operation: string, payload: any): string {
    const errorCode = payload.error_code || "unknown_error"
    const description = payload.description || "Transaction failed"
    const details = payload.details || {}

    console.error(`❌ ${operation} ERROR ANALYSIS`, {
      errorCode,
      description,
      payload,
    })

    if (errorCode === "simulation_failed") {
      const debugUrl = details.debugUrl || ""
      return `❌ TPT CLAIM SIMULATION FAILED

🔴 The claim transaction failed during simulation.
📋 Contract: ${TPT_STAKING_CONTRACT}
📋 Block: ${details.block || "Unknown"}

💡 POSSIBLE CAUSES:
• No TPF tokens in your wallet
• No TPT rewards to claim yet
• Contract has insufficient reward tokens deposited
• Minimum time between claims not reached
• Network congestion

🚀 SOLUTIONS:
1. Make sure you have TPF tokens in your wallet
2. Wait for rewards to accumulate (check APY: 1%)
3. Contact owner to deposit reward tokens to contract
4. Try again later

${debugUrl ? `\n🔗 Tenderly Debug: ${debugUrl}` : ""}`
    }

    if (errorCode === "disallowed_operation") {
      return `❌ OPERATION NOT ALLOWED

🔴 TPT claim function not configured in World Portal
📋 Contract: ${details.contractAddress || TPT_STAKING_CONTRACT}

💡 SOLUTION: Add contract to World Developer Portal:
🌐 Configuration → Advanced → Contract Entrypoints
📝 Add: ${TPT_STAKING_CONTRACT}`
    }

    if (errorCode === "user_rejected") {
      return "❌ Transaction cancelled by user"
    }

    return `❌ ${operation} failed: ${description}`
  }

  async checkTransactionStatus(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`/api/transaction-status?id=${transactionId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to check transaction status:", error)
      return null
    }
  }

  getContractAddress(): string {
    return TPT_STAKING_CONTRACT
  }
}

export const tptTransactionService = TPTTransactionService.getInstance()
export type { TransactionResult }
