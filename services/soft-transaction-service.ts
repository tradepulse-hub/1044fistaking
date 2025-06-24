import { MiniKit } from "@worldcoin/minikit-js"

// Contract address - NOVO CONTRATO SOFT STAKING
const SOFT_STAKING_CONTRACT = "0x4c1f9CF3c5742c73a00864a32048988b87121e2f"

// ABI para transações - FUNÇÃO CLAIM
const SOFT_STAKING_ABI = [
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

class SoftTransactionService {
  private static instance: SoftTransactionService

  static getInstance(): SoftTransactionService {
    if (!SoftTransactionService.instance) {
      SoftTransactionService.instance = new SoftTransactionService()
    }
    return SoftTransactionService.instance
  }

  // CLAIM TPT REWARDS
  async executeClaimRewards(): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const transactionPayload = {
        transaction: [
          {
            address: SOFT_STAKING_CONTRACT,
            abi: SOFT_STAKING_ABI,
            functionName: "claimRewards",
            args: [],
          },
        ],
      }

      console.log("🚀 TPT SOFT STAKING CLAIM:", {
        contract: SOFT_STAKING_CONTRACT,
        function: "claimRewards",
      })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("TPT_CLAIM", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        console.error("TPT Claim Failed", errorMsg, {
          ...result,
          debugUrl,
          contractAddress: SOFT_STAKING_CONTRACT,
        })

        return {
          success: false,
          error: errorMsg,
          debugUrl,
        }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ TPT CLAIM SUCCESS:", result.finalPayload.transaction_id)
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `TPT claim failed: ${error instanceof Error ? error.message : String(error)}`
      console.error("❌ TPT claim exception:", error)
      console.error("TPT Claim Exception", errorMsg, {
        error,
        contractAddress: SOFT_STAKING_CONTRACT,
      })
      return { success: false, error: errorMsg }
    }
  }

  // Formatação de erro
  private formatError(operation: string, payload: any): string {
    const errorCode = payload.error_code || "unknown_error"
    const description = payload.description || "Transaction failed"
    const details = payload.details || {}

    console.log(`❌ ${operation} ERROR:`, { errorCode, description, payload })

    if (errorCode === "simulation_failed") {
      const debugUrl = details.debugUrl || ""
      return `❌ TPT CLAIM SIMULATION FAILED

🔴 The claim transaction failed during simulation.
📋 Block: ${details.block || "Unknown"}
📋 Contract: ${SOFT_STAKING_CONTRACT}

💡 POSSIBLE CAUSES:
• No TPF tokens in your wallet
• No rewards to claim yet
• Contract has insufficient reward tokens
• Network congestion

🚀 SOLUTIONS:
1. Make sure you have TPF tokens in your wallet
2. Wait for rewards to accumulate
3. Check if contract has reward tokens deposited
4. Try again later

${debugUrl ? `\n🔗 Tenderly Debug: ${debugUrl}` : ""}`
    }

    if (errorCode === "disallowed_operation") {
      return `❌ OPERATION NOT ALLOWED

🔴 Claim function not configured in World Portal
📋 Contract: ${details.contractAddress || SOFT_STAKING_CONTRACT}

💡 SOLUTION: Add contract to World Developer Portal:
🌐 Configuration → Advanced → Contract Entrypoints
📝 Add: ${SOFT_STAKING_CONTRACT}`
    }

    if (errorCode === "user_rejected") {
      return "❌ Transaction cancelled by user"
    }

    return `❌ ${operation} failed: ${description}`
  }

  // Check transaction status
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

  // Obter endereço do contrato
  getContractAddress(): string {
    return SOFT_STAKING_CONTRACT
  }
}

export const softTransactionService = SoftTransactionService.getInstance()
export type { TransactionResult }
