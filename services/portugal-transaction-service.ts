import { MiniKit } from "@worldcoin/minikit-js"
import { debugLogger } from "@/components/debug-console"
import { errorLogger } from "@/components/error-console"

// Contract address - PORTUGAFI ATUALIZADO
const PORTUGAFI_STAKING_CONTRACT = "0xACc9d1bC40546a4EE05f1B54C7847772F4d8990f"

// ABI IDÊNTICO AO TPT QUE FUNCIONA
const PORTUGAFI_STAKING_ABI = [
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

class PortugaFiTransactionService {
  private static instance: PortugaFiTransactionService

  static getInstance(): PortugaFiTransactionService {
    if (!PortugaFiTransactionService.instance) {
      PortugaFiTransactionService.instance = new PortugaFiTransactionService()
    }
    return PortugaFiTransactionService.instance
  }

  // CLAIM PORTUGAFI REWARDS - COPIANDO LÓGICA EXATA DO TPT
  async executeClaimRewards(): Promise<TransactionResult> {
    try {
      debugLogger.info("🇵🇹 Starting PortugaFi claim (copying TPT logic)...")

      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const transactionPayload = {
        transaction: [
          {
            address: PORTUGAFI_STAKING_CONTRACT,
            abi: PORTUGAFI_STAKING_ABI,
            functionName: "claimRewards",
            args: [],
          },
        ],
      }

      debugLogger.info("🚀 PortugaFi transaction payload", {
        contract: PORTUGAFI_STAKING_CONTRACT,
        function: "claimRewards",
        method: "Identical to TPT",
      })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)
      debugLogger.info("📋 PortugaFi MiniKit result", result)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("PORTUGAFI_CLAIM", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        debugLogger.error("❌ PortugaFi claim failed", {
          error: result.finalPayload,
          debugUrl,
        })

        errorLogger.logError("PortugaFi Claim Failed (TPT Logic Copy)", errorMsg, {
          ...result,
          debugUrl,
          contractAddress: PORTUGAFI_STAKING_CONTRACT,
        })

        return { success: false, error: errorMsg, debugUrl }
      }

      if (result.finalPayload?.status === "success") {
        debugLogger.success("✅ PortugaFi claim SUCCESS (TPT logic worked!)", {
          transactionId: result.finalPayload.transaction_id,
        })
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `PortugaFi claim failed: ${error instanceof Error ? error.message : String(error)}`
      debugLogger.error("❌ PortugaFi claim exception", error)
      errorLogger.logError("PortugaFi Claim Exception (TPT Logic Copy)", errorMsg, {
        error,
        contractAddress: PORTUGAFI_STAKING_CONTRACT,
      })
      return { success: false, error: errorMsg }
    }
  }

  // FORMATAÇÃO DE ERRO IDÊNTICA AO TPT
  private formatError(operation: string, payload: any): string {
    const errorCode = payload.error_code || "unknown_error"
    const description = payload.description || "Transaction failed"
    const details = payload.details || {}

    debugLogger.error(`❌ ${operation} ERROR ANALYSIS`, {
      errorCode,
      description,
      payload,
    })

    if (errorCode === "simulation_failed") {
      const debugUrl = details.debugUrl || ""
      return `❌ PORTUGAFI CLAIM SIMULATION FAILED

🔴 The claim transaction failed during simulation.
📋 Contract: ${PORTUGAFI_STAKING_CONTRACT}
📋 Block: ${details.block || "Unknown"}

💡 POSSIBLE CAUSES:
• No TPF tokens in your wallet
• No PortugaFi rewards to claim yet
• Contract has insufficient reward tokens deposited
• Minimum time between claims not reached
• Network congestion

🚀 SOLUTIONS:
1. Make sure you have TPF tokens in your wallet
2. Wait for rewards to accumulate (check APY: 12%)
3. Contact owner to deposit reward tokens to contract
4. Try again later

${debugUrl ? `\n🔗 Tenderly Debug: ${debugUrl}` : ""}`
    }

    if (errorCode === "disallowed_operation") {
      return `❌ OPERATION NOT ALLOWED

🔴 PortugaFi claim function not configured in World Portal
📋 Contract: ${details.contractAddress || PORTUGAFI_STAKING_CONTRACT}

💡 SOLUTION: Add contract to World Developer Portal:
🌐 Configuration → Advanced → Contract Entrypoints
📝 Add: ${PORTUGAFI_STAKING_CONTRACT}`
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
    return PORTUGAFI_STAKING_CONTRACT
  }
}

export const portugaFiTransactionService = PortugaFiTransactionService.getInstance()
export type { TransactionResult }
