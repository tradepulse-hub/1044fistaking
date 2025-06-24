"use client"

import { useState, useEffect, useCallback } from "react"
import EventEmitter2 from "eventemitter2"
import { useWeb3React } from "@web3-react/core"

interface TransactionDetails {
  hash: string
  chainId: number | undefined
  summary?: string
  addedTime: number
  confirmedTime?: number
  from?: string
  receipt?: any
  success?: boolean
}

interface TransactionMonitor {
  addTransaction: (hash: string, chainId: number | undefined, summary?: string) => void
  confirmTransaction: (hash: string, receipt: any) => void
  getTransaction: (hash: string) => TransactionDetails | undefined
  pendingTransactions: TransactionDetails[]
  emitter: EventEmitter2
}

const TRANSACTION_CONFIRMATION_BLOCKS = 5

const useTransactionMonitor = (): TransactionMonitor => {
  const { chainId, account, library } = useWeb3React()
  const [transactions, setTransactions] = useState<TransactionDetails[]>([])
  const emitter = new EventEmitter2({ wildcard: true })

  // Load transactions from local storage on mount
  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem("transactions")
      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions) as TransactionDetails[]
        setTransactions(parsedTransactions)
      }
    } catch (error) {
      console.error("Error loading transactions from local storage:", error)
    }
  }, [])

  // Save transactions to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("transactions", JSON.stringify(transactions))
    } catch (error) {
      console.error("Error saving transactions to local storage:", error)
    }
  }, [transactions])

  const addTransaction = useCallback(
    (hash: string, chainId: number | undefined, summary?: string) => {
      setTransactions((existingTransactions) => {
        const newTransaction = {
          hash,
          chainId,
          summary,
          addedTime: Date.now(),
          from: account,
        }
        emitter.emit("transaction.pending", newTransaction)
        return [...existingTransactions, newTransaction]
      })
    },
    [account, emitter],
  )

  const confirmTransaction = useCallback(
    (hash: string, receipt: any) => {
      setTransactions((existingTransactions) => {
        const updatedTransactions = existingTransactions.map((transaction) => {
          if (transaction.hash === hash) {
            const success = receipt.status === 1
            const updatedTransaction = {
              ...transaction,
              confirmedTime: Date.now(),
              receipt,
              success,
            }
            emitter.emit("transaction.confirmed", updatedTransaction)
            return updatedTransaction
          }
          return transaction
        })
        return updatedTransactions
      })
    },
    [emitter],
  )

  const getTransaction = useCallback(
    (hash: string) => {
      return transactions.find((transaction) => transaction.hash === hash)
    },
    [transactions],
  )

  const pendingTransactions = transactions.filter((tx) => !tx.confirmedTime)

  // Confirmation listener
  useEffect(() => {
    if (!library || !chainId) return

    const handleTransactionReceipt = async (hash: string) => {
      try {
        const receipt = await library.getTransactionReceipt(hash)
        if (receipt) {
          confirmTransaction(hash, receipt)
        } else {
          // Transaction not yet mined, try again after a delay
          setTimeout(() => {
            handleTransactionReceipt(hash)
          }, 2000) // Check every 2 seconds
        }
      } catch (error) {
        console.error("Error fetching transaction receipt:", error)
      }
    }

    transactions.forEach((transaction) => {
      if (transaction.chainId === chainId && !transaction.confirmedTime) {
        handleTransactionReceipt(transaction.hash)
      }
    })
  }, [transactions, library, chainId, confirmTransaction])

  return {
    addTransaction,
    confirmTransaction,
    getTransaction,
    pendingTransactions,
    emitter,
  }
}

export default useTransactionMonitor
