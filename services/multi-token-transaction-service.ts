import { MiniKit } from "@worldcoin/minikit-js"
import { errorLogger } from "@/components/error-console"

// NOVO CONTRACT ADDRESS - MULTI TOKEN SOFT STAKING
const MULTI_TOKEN_STAKING_CONTRACT = "0xAF462eA35987f48367060AE36312efF079900dEd"

// ABI para transações - FUNÇÕES DE CLAIM
const MULTI_TOKEN_TRANSACTION_ABI = [
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
]

interface TransactionResult {
  success: boolean
  transactionId?: string
  error?: string
  debugUrl?: string
}

class MultiTokenTransactionService {
  private static instance: MultiTokenTransactionService

  static getInstance(): MultiTokenTransactionService {
    if (!MultiTokenTransactionService.instance) {
      MultiTokenTransactionService.instance = new MultiTokenTransactionService()
    }
    return MultiTokenTransactionService.instance
  }

  // Claim de um token específico
  async executeClaimSingleToken(tokenId: number): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const transactionPayload = {
        transaction: [
          {
            address: MULTI_TOKEN_STAKING_CONTRACT,
            abi: MULTI_TOKEN_TRANSACTION_ABI,
            functionName: "claimRewards",
            args: [tokenId.toString()],
          },
        ],
      }

      console.log("🚀 CLAIM SINGLE TOKEN (MULTI-TOKEN CONTRACT):", {
        tokenId,
        contract: MULTI_TOKEN_STAKING_CONTRACT,
      })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("SINGLE_CLAIM", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        errorLogger.logError("Single Token Claim Failed (Multi-Token Contract)", errorMsg, {
          ...result,
          debugUrl,
          tokenId,
          contractAddress: MULTI_TOKEN_STAKING_CONTRACT,
        })

        return { success: false, error: errorMsg, debugUrl }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ SINGLE TOKEN CLAIM SUCCESS (MULTI-TOKEN CONTRACT):", result.finalPayload.transaction_id)
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `Single token claim failed (Multi-Token Contract): ${error instanceof Error ? error.message : String(error)}`
      errorLogger.logError("Single Token Claim Exception (Multi-Token Contract)", errorMsg, {
        error,
        tokenId,
        contractAddress: MULTI_TOKEN_STAKING_CONTRACT,
      })
      return { success: false, error: errorMsg }
    }
  }

  // Claim de todos os tokens
  async executeClaimAllTokens(): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const transactionPayload = {
        transaction: [
          {
            address: MULTI_TOKEN_STAKING_CONTRACT,
            abi: MULTI_TOKEN_TRANSACTION_ABI,
            functionName: "claimAllRewards",
            args: [],
          },
        ],
      }

      console.log("🚀 CLAIM ALL TOKENS (MULTI-TOKEN CONTRACT):", {
        contract: MULTI_TOKEN_STAKING_CONTRACT,
      })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("ALL_CLAIM", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        errorLogger.logError("All Tokens Claim Failed (Multi-Token Contract)", errorMsg, {
          ...result,
          debugUrl,
          contractAddress: MULTI_TOKEN_STAKING_CONTRACT,
        })

        return { success: false, error: errorMsg, debugUrl }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ ALL TOKENS CLAIM SUCCESS (MULTI-TOKEN CONTRACT):", result.finalPayload.transaction_id)
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `All tokens claim failed (Multi-Token Contract): ${error instanceof Error ? error.message : String(error)}`
      errorLogger.logError("All Tokens Claim Exception (Multi-Token Contract)", errorMsg, {
        error,
        contractAddress: MULTI_TOKEN_STAKING_CONTRACT,
      })
      return { success: false, error: errorMsg }
    }
  }

  private formatError(operation: string, payload: any): string {
    const errorCode = payload.error_code || "unknown_error"
    const description = payload.description || "Transaction failed"
    const details = payload.details || {}

    console.log(`❌ ${operation} ERROR (MULTI-TOKEN CONTRACT):`, { errorCode, description, payload })

    if (errorCode === "simulation_failed") {
      const debugUrl = details.debugUrl || ""
      return `❌ MULTI-TOKEN CLAIM SIMULATION FAILED

🔴 The claim transaction failed during simulation.
📋 Contract: ${MULTI_TOKEN_STAKING_CONTRACT}
📋 Block: ${details.block || "Unknown"}

💡 POSSIBLE CAUSES:
• No TPF tokens in your wallet
• No rewards to claim for any token
• Contract has no active reward tokens
• Minimum claim interval not reached (1 hour)
• Contract has insufficient reward tokens deposited

🚀 SOLUTIONS:
1. Make sure you have TPF tokens in your wallet
2. Wait for rewards to accumulate (check if tokens are added)
3. Contact owner to add reward tokens to the contract
4. Wait minimum interval between claims (1 hour)
5. Check if contract has reward tokens deposited

${debugUrl ? `\n🔗 Tenderly Debug: ${debugUrl}` : ""}`
    }

    if (errorCode === "disallowed_operation") {
      return `❌ OPERATION NOT ALLOWED (MULTI-TOKEN CONTRACT)

🔴 Multi-token claim function not configured in World Portal
📋 Contract: ${details.contractAddress || MULTI_TOKEN_STAKING_CONTRACT}

💡 SOLUTION: Add contract to World Developer Portal:
🌐 Configuration → Advanced → Contract Entrypoints
📝 Add: ${MULTI_TOKEN_STAKING_CONTRACT}`
    }

    if (errorCode === "user_rejected") {
      return "❌ Transaction cancelled by user"
    }

    return `❌ ${operation} failed (Multi-Token Contract): ${description}`
  }

  getContractAddress(): string {
    return MULTI_TOKEN_STAKING_CONTRACT
  }
}

export const multiTokenTransactionService = MultiTokenTransactionService.getInstance()
export type { TransactionResult }
