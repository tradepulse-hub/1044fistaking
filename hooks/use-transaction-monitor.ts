"use client"

import { useState, useEffect } from "react"
import { transactionService } from "@/services/transaction-service"

interface TransactionStatus {
  transactionId: string
  transactionHash?: string
  transactionStatus: "pending" | "confirmed" | "failed"
  isLoading: boolean
}

export function useTransactionMonitor(transactionId: string | null) {
  const [status, setStatus] = useState<TransactionStatus | null>(null)

  useEffect(() => {
    if (!transactionId) {
      setStatus(null)
      return
    }

    setStatus({
      transactionId,
      transactionStatus: "pending",
      isLoading: true,
    })

    const checkStatus = async () => {
      try {
        const result = await transactionService.checkTransactionStatus(transactionId)

        if (result) {
          setStatus({
            transactionId,
            transactionHash: result.transactionHash,
            transactionStatus: result.transactionStatus,
            isLoading: result.transactionStatus === "pending",
          })

          // If still pending, check again in 3 seconds
          if (result.transactionStatus === "pending") {
            setTimeout(checkStatus, 3000)
          }
        }
      } catch (error) {
        console.error("Error checking transaction status:", error)
        setStatus({
          transactionId,
          transactionStatus: "failed",
          isLoading: false,
        })
      }
    }

    // Start checking immediately
    checkStatus()
  }, [transactionId])

  return status
}
