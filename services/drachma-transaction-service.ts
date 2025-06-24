import { MiniKit } from "@worldcoin/minikit-js"
// import { errorLogger } from "@/components/error-console"

// Contract address - DRACHMA (COPIANDO LÓGICA DO TPT)
const DRACHMA_STAKING_CONTRACT = "0xc4F3ae925E647aa2623200901a43BF65e8542c23"

// ABI IDÊNTICO AO TPT QUE FUNCIONA
const DRACHMA_STAKING_ABI = [
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

class DrachmaTransactionService {
  private static instance: DrachmaTransactionService

  static getInstance(): DrachmaTransactionService {
    if (!DrachmaTransactionService.instance) {
      DrachmaTransactionService.instance = new DrachmaTransactionService()
    }
    return DrachmaTransactionService.instance
  }

  // Fallback logger (replaces deleted error-console)
  private logError(context: string, message: string, meta?: Record<string, unknown>) {
    console.error(`[${context}] ${message}`, meta)
  }

  // CLAIM DRACHMA REWARDS - COPIANDO LÓGICA EXATA DO TPT
  async executeClaimRewards(): Promise<TransactionResult> {
    try {
      console.info("🪙 Starting Drachma claim (copying TPT logic that works)...")

      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const transactionPayload = {
        transaction: [
          {
            address: DRACHMA_STAKING_CONTRACT,
            abi: DRACHMA_STAKING_ABI,
            functionName: "claimRewards",
            args: [],
          },
        ],
      }

      console.info("🚀 Drachma transaction payload (TPT method)", {
        contract: DRACHMA_STAKING_CONTRACT,
        function: "claimRewards",
        method: "Identical to working TPT",
        investigation: "Error 0x372500ab fix attempt",
      })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)
      console.info("📋 Drachma MiniKit result", result)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("DRACHMA_CLAIM", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        console.error("❌ Drachma claim failed (even with TPT logic)", {
          error: result.finalPayload,
          debugUrl,
          errorCode: result.finalPayload.error_code,
          investigation: "0x372500ab still occurring",
        })

        this.logError("Drachma Claim Failed (TPT Logic Copy)", errorMsg, {
          ...result,
          debugUrl,
          contractAddress: DRACHMA_STAKING_CONTRACT,
          specificError: "0x372500ab",
          tptLogicUsed: true,
        })

        return { success: false, error: errorMsg, debugUrl }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ Drachma claim SUCCESS (TPT logic worked!)", {
          transactionId: result.finalPayload.transaction_id,
          errorFixed: "0x372500ab resolved",
        })
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `Drachma claim failed: ${error instanceof Error ? error.message : String(error)}`
      console.error("❌ Drachma claim exception (TPT logic copy)", error)
      this.logError("Drachma Claim Exception (TPT Logic Copy)", errorMsg, {
        error,
        contractAddress: DRACHMA_STAKING_CONTRACT,
        specificError: "0x372500ab",
        tptLogicUsed: true,
      })
      return { success: false, error: errorMsg }
    }
  }

  // FORMATAÇÃO DE ERRO IDÊNTICA AO TPT COM FOCO NO 0x372500ab
  private formatError(operation: string, payload: any): string {
    const errorCode = payload.error_code || "unknown_error"
    const description = payload.description || "Transaction failed"
    const details = payload.details || {}

    console.error(`❌ ${operation} ERROR ANALYSIS (TPT logic used)`, {
      errorCode,
      description,
      payload,
      investigation: "0x372500ab",
    })

    // Tratamento específico para erro 0x372500ab
    if (errorCode.includes("0x372500ab") || description.includes("0x372500ab")) {
      const debugUrl = details.debugUrl || ""
      return `❌ DRACHMA CLAIM FAILED - ERROR 0x372500ab (EVEN WITH TPT LOGIC)

🔴 Specific contract error detected (TPT logic didn't fix it)
📋 Contract: ${DRACHMA_STAKING_CONTRACT}
📋 Function: claimRewards (copied from working TPT)
📋 Error Code: 0x372500ab

💡 THIS MEANS THE DRACHMA CONTRACT IS DIFFERENT:
• Contract may not have the same claimRewards function
• Contract may have different requirements
• Contract may be paused or restricted
• Contract may need different parameters

🚀 NEXT STEPS:
1. Verify Drachma contract ABI is correct
2. Check if contract has different claim requirements
3. Contact Drachma contract owner
4. Verify contract is properly deployed

${debugUrl ? `\n🔗 Tenderly Debug: ${debugUrl}` : ""}

📞 CONCLUSION: Drachma contract is NOT identical to TPT contract`
    }

    if (errorCode === "simulation_failed") {
      const debugUrl = details.debugUrl || ""
      return `❌ DRACHMA CLAIM SIMULATION FAILED (TPT LOGIC USED)

🔴 Transaction simulation failed even with working TPT logic
📋 Contract: ${DRACHMA_STAKING_CONTRACT}
📋 Block: ${details.block || "Unknown"}

💡 POSSIBLE CAUSES:
• Drachma contract has different requirements than TPT
• No TPF tokens in wallet
• No Drachma rewards to claim
• Contract has insufficient reward tokens
• Contract is paused or has restrictions

🚀 SOLUTIONS:
1. Verify Drachma contract ABI
2. Check contract requirements
3. Contact contract owner
4. Try again later

${debugUrl ? `\n🔗 Debug: ${debugUrl}` : ""}`
    }

    if (errorCode === "disallowed_operation") {
      return `❌ OPERATION NOT ALLOWED (TPT LOGIC USED)

🔴 Contract not configured in World Portal
📋 Contract: ${DRACHMA_STAKING_CONTRACT}

💡 SOLUTION: Add contract to World Developer Portal:
🌐 Configuration → Advanced → Contract Entrypoints
📝 Add: ${DRACHMA_STAKING_CONTRACT}`
    }

    if (errorCode === "user_rejected") {
      return "❌ Transaction cancelled by user"
    }

    return `❌ ${operation} failed (TPT logic used): ${description}

📋 Error Code: ${errorCode}
📋 Contract: ${DRACHMA_STAKING_CONTRACT}
📋 Method: Copied from working TPT

💡 If error persists, Drachma contract may be different from TPT.`
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
    return DRACHMA_STAKING_CONTRACT
  }
}

export const drachmaTransactionService = DrachmaTransactionService.getInstance()
export type { TransactionResult }
