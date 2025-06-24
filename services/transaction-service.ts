interface TransactionStatus {
  transactionId: string
  transactionHash?: string
  transactionStatus: "pending" | "confirmed" | "failed"
  isLoading: boolean
}

/**
 * Minimal transaction-status helper used by hooks/use-transaction-monitor.
 * It only proxies to the /api/transaction-status route.
 */
class TransactionService {
  private static instance: TransactionService

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService()
    }
    return TransactionService.instance
  }

  /** Query the status of a World App transaction via our API route. */
  async checkTransactionStatus(transactionId: string): Promise<TransactionStatus | null> {
    try {
      const res = await fetch(`/api/transaction-status?id=${transactionId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.error("[transaction-service] checkTransactionStatus failed:", err)
      return null
    }
  }
}

export const transactionService = TransactionService.getInstance()
