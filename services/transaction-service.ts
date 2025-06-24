import { MiniKit } from "@worldcoin/minikit-js"
import { ethers } from "ethers"
// import { errorLogger } from "@/components/error-console"

// Contract addresses
const STAKING_CONTRACT = "0x51bd987FA376C92c5293cff5E62963D7Ea3e51Bf"
const STAKING_TOKEN = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45"

// Staking contract ABI
const STAKING_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// ERC20 ABI with approve
const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
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

class TransactionService {
  private static instance: TransactionService

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService()
    }
    return TransactionService.instance
  }

  // Execute stake transaction with approval
  async executeStake(amount: string, walletAddress: string): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const amountWei = ethers.utils.parseEther(amount)

      const transactionPayload = {
        transaction: [
          // Step 1: Approve tokens
          {
            address: STAKING_TOKEN,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [STAKING_CONTRACT, amountWei.toString()],
          },
          // Step 2: Stake tokens
          {
            address: STAKING_CONTRACT,
            abi: STAKING_ABI,
            functionName: "stake",
            args: [amountWei.toString()],
          },
        ],
      }

      console.log("🚀 STAKE:", {
        amount,
        amountWei: amountWei.toString(),
        token: STAKING_TOKEN,
        contract: STAKING_CONTRACT,
      })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("STAKE", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        console.error("Stake Failed:", errorMsg, {
          ...result,
          debugUrl,
        })

        return {
          success: false,
          error: errorMsg,
          debugUrl,
        }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ STAKE SUCCESS:", result.finalPayload.transaction_id)
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `Stake failed: ${error instanceof Error ? error.message : String(error)}`
      console.error("❌ Stake exception:", error)
      console.error("Stake Exception:", errorMsg, { error, amount, walletAddress })
      return { success: false, error: errorMsg }
    }
  }

  // Execute unstake transaction
  async executeUnstake(amount: string): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const amountWei = ethers.utils.parseEther(amount)

      const transactionPayload = {
        transaction: [
          {
            address: STAKING_CONTRACT,
            abi: STAKING_ABI,
            functionName: "unstake",
            args: [amountWei.toString()],
          },
        ],
      }

      console.log("🚀 UNSTAKE:", { amount, amountWei: amountWei.toString() })

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("UNSTAKE", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        console.error("Unstake Failed:", errorMsg, {
          ...result,
          debugUrl,
        })

        return {
          success: false,
          error: errorMsg,
          debugUrl,
        }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ UNSTAKE SUCCESS:", result.finalPayload.transaction_id)
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `Unstake failed: ${error instanceof Error ? error.message : String(error)}`
      console.error("Unstake Exception:", errorMsg, { error, amount })
      return { success: false, error: errorMsg }
    }
  }

  // Execute claim rewards transaction
  async executeClaimRewards(): Promise<TransactionResult> {
    try {
      if (!MiniKit.isInstalled()) {
        throw new Error("World App not detected. Please open in World App.")
      }

      const transactionPayload = {
        transaction: [
          {
            address: STAKING_CONTRACT,
            abi: STAKING_ABI,
            functionName: "claimRewards",
            args: [],
          },
        ],
      }

      console.log("🚀 CLAIM REWARDS")

      const result = await MiniKit.commandsAsync.sendTransaction(transactionPayload)

      if (result.finalPayload?.status === "error") {
        const errorMsg = this.formatError("CLAIM", result.finalPayload)
        const debugUrl = result.finalPayload?.details?.debugUrl

        console.error("Claim Failed:", errorMsg, {
          ...result,
          debugUrl,
        })

        return {
          success: false,
          error: errorMsg,
          debugUrl,
        }
      }

      if (result.finalPayload?.status === "success") {
        console.log("✅ CLAIM SUCCESS:", result.finalPayload.transaction_id)
        return { success: true, transactionId: result.finalPayload.transaction_id }
      }

      return { success: false, error: "Unexpected response from MiniKit" }
    } catch (error) {
      const errorMsg = `Claim failed: ${error instanceof Error ? error.message : String(error)}`
      console.error("Claim Exception:", errorMsg, { error })
      return { success: false, error: errorMsg }
    }
  }

  // Enhanced error formatting
  private formatError(operation: string, payload: any): string {
    const errorCode = payload.error_code || "unknown_error"
    const description = payload.description || "Transaction failed"
    const details = payload.details || {}

    console.log(`❌ ${operation} ERROR:`, { errorCode, description, payload })

    if (errorCode === "simulation_failed") {
      const debugUrl = details.debugUrl || ""
      return `❌ TRANSACTION SIMULATION FAILED

🔴 The transaction failed during simulation.
📋 Block: ${details.block || "Unknown"}
🔍 Simulation ID: ${details.simulationId || "Unknown"}

💡 MOST LIKELY CAUSE:
• Insufficient token balance
• Contract requires approval first
• Network congestion

🚀 SOLUTIONS TO TRY:
1. Check your token balance
2. Try a smaller amount
3. Wait and try again

${debugUrl ? `\n🔗 Tenderly Debug: ${debugUrl}` : ""}`
    }

    if (errorCode === "disallowed_operation") {
      return `❌ OPERATION NOT ALLOWED

🔴 Function not configured in World Portal
📋 Contract: ${details.contractAddress}

💡 SOLUTION: Add contract to World Developer Portal:
🌐 https://developer.worldcoin.org
⚙️ Configuration → Advanced → Contract Entrypoints`
    }

    if (errorCode === "user_rejected") {
      return "❌ Transaction cancelled by user"
    }

    if (errorCode === "insufficient_balance") {
      return "❌ Insufficient balance"
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
}

export const transactionService = TransactionService.getInstance()
export type { TransactionResult }
