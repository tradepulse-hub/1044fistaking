import EventEmitter2 from "eventemitter2"

class TransactionService {
  private eventEmitter: EventEmitter2

  constructor() {
    this.eventEmitter = new EventEmitter2()
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener)
  }

  public emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args)
  }

  public async processTransaction(transactionData: any): Promise<void> {
    // Simulate transaction processing
    console.log("Processing transaction:", transactionData)

    // Emit events during the transaction lifecycle
    this.emit("transaction.started", transactionData)

    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate processing time

    // Simulate success or failure
    const success = Math.random() > 0.2 // 80% success rate

    if (success) {
      this.emit("transaction.succeeded", transactionData)
      console.log("Transaction succeeded:", transactionData)
    } else {
      this.emit("transaction.failed", transactionData)
      console.log("Transaction failed:", transactionData)
    }

    this.emit("transaction.completed", transactionData, success)
  }
}

export default TransactionService
