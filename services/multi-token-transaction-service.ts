import { EventEmitter } from "events"
import { ethers } from "ethers"
import Moralis from "moralis"
import { EvmChain } from "@moralisweb3/common-evm-utils"
import type { MultiTokenTransaction } from "../entities/multi-token-transaction.entity"

export class MultiTokenTransactionService {
  private readonly provider: ethers.providers.JsonRpcProvider
  private readonly contract: ethers.Contract
  private readonly chain: EvmChain
  private readonly emitter = new EventEmitter()
  private readonly store: Map<string, MultiTokenTransaction> = new Map()

  constructor(
    private readonly rpcUrl: string,
    private readonly contractAddress: string,
    private readonly contractAbi: any[],
    private readonly chainId: number,
    private readonly startBlock: number,
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl)
    this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.provider)
    this.chain = EvmChain.fromId(this.chainId)
  }

  async processTransaction(transactionHash: string): Promise<void> {
    try {
      const transaction = await this.provider.getTransaction(transactionHash)

      if (!transaction) {
        this.emitter.emit("transaction.failed", transactionHash, "Transaction not found")
        return
      }

      const receipt = await this.provider.getTransactionReceipt(transactionHash)

      if (!receipt) {
        this.emitter.emit("transaction.failed", transactionHash, "Transaction receipt not found")
        return
      }

      if (receipt.status === 0) {
        this.emitter.emit("transaction.failed", transactionHash, "Transaction reverted")
        return
      }

      const parsedLog = this.parseTransferBatchLog(receipt.logs)

      if (!parsedLog) {
        this.emitter.emit("transaction.failed", transactionHash, "No TransferBatch log found")
        return
      }

      const { from, to, tokenIds, amounts } = parsedLog

      const multiTokenTransaction = {
        transactionHash,
        from,
        to,
        tokenIds,
        amounts,
        status: TransactionStatus.SUCCESS,
      }

      this.store.set(transactionHash, multiTokenTransaction)
      // await this.multiTokenTransactionRepository.save(multiTokenTransaction)

      this.emitter.emit("transaction.processed", multiTokenTransaction)
    } catch (error) {
      this.emitter.emit("transaction.failed", transactionHash, error.message)
    }
  }

  private parseTransferBatchLog(logs: ethers.providers.Log[]): {
    from: string
    to: string
    tokenIds: string[]
    amounts: string[]
  } | null {
    for (const log of logs) {
      try {
        const parsedLog = this.contract.interface.parseLog(log)

        if (parsedLog && parsedLog.name === "TransferBatch") {
          const from = parsedLog.args["from"]
          const to = parsedLog.args["to"]
          const tokenIds = parsedLog.args["ids"].map((id: ethers.BigNumber) => id.toString())
          const amounts = parsedLog.args["values"].map((value: ethers.BigNumber) => value.toString())

          return { from, to, tokenIds, amounts }
        }
      } catch (error) {
        // Ignore errors when parsing logs, as not all logs will be TransferBatch events.
      }
    }
    return null
  }

  async syncPastEvents(fromBlock: number, toBlock: number): Promise<void> {
    try {
      const filter = this.contract.filters.TransferBatch()
      const logs = await this.contract.queryFilter(filter, fromBlock, toBlock)

      for (const log of logs) {
        const transactionHash = log.transactionHash
        const existingTransaction = this.store.get(transactionHash)

        if (!existingTransaction) {
          await this.processTransaction(transactionHash)
        }
      }
    } catch (error) {
      console.error("Error syncing past events:", error)
    }
  }

  async getMoralisBlockNumber(): Promise<number> {
    const block = await Moralis.EvmApi.block.getBlock({
      chain: this.chain,
      blockNumber: this.startBlock,
    })

    return block.result.number.valueOf()
  }
}
