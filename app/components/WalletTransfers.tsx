"use client"

import type React from "react"

import { isEthereumWallet } from "@dynamic-labs/ethereum"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js"
import { type FC, useEffect, useState } from "react"
import { parseEther } from "viem"
import { ForwardABI } from "@/consts/ForwardABI"

export enum TokenSymbol {
  ETH = "ETH",
  WLD = "WLD",
  USDC = "USDC",
}

// Token contract addresses
const WLD_TOKEN_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003"
const USDC_TOKEN_ADDRESS = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1"

export interface FundingFormState {
  amount: string
  tokenSymbol: TokenSymbol
  recipientAddress: string
  direction: "dynamic-to-world" | "world-to-dynamic"
}

const WalletTransfers: FC = () => {
  const { user, primaryWallet } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [worldIdWalletAddress, setWorldIdWalletAddress] = useState<string | null>(null)

  const [fundingForm, setFundingForm] = useState<FundingFormState>({
    amount: "0.001",
    tokenSymbol: TokenSymbol.ETH,
    recipientAddress: "",
    direction: "world-to-dynamic",
  })

  // Get World ID wallet address
  const getWorldIdWallet = async () => {
    try {
      if (!(await MiniKit.isInstalled())) {
        return null
      }

      const { finalPayload } = await MiniKit.commandsAsync.signMessage({
        message: "Get wallet address",
      })

      if (finalPayload.status === "error") {
        setError("Failed to get World ID wallet address")
        return null
      }

      setWorldIdWalletAddress(finalPayload.address)
      return finalPayload.address
    } catch (error) {
      setError("Failed to get World ID wallet address")
      return null
    }
  }

  useEffect(() => {
    getWorldIdWallet()

    if (user?.verifiedCredentials?.[0]?.address) {
      setFundingForm((prev) => ({
        ...prev,
        recipientAddress: user.verifiedCredentials[0].address || "",
      }))
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFundingForm((prev) => {
      if (name === "direction") {
        const direction = value as "world-to-dynamic" | "dynamic-to-world"
        const recipientAddress =
          direction === "world-to-dynamic" ? user?.verifiedCredentials?.[0]?.address || "" : worldIdWalletAddress || ""
        return { ...prev, direction, recipientAddress }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleTransfer = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const { amount, tokenSymbol, direction } = fundingForm

      if (!amount || Number.parseFloat(amount) <= 0) {
        setError("Please provide a valid amount greater than 0")
        return
      }

      const finalRecipientAddress =
        direction === "world-to-dynamic" ? user?.verifiedCredentials?.[0]?.address : worldIdWalletAddress

      if (!finalRecipientAddress) {
        setError(direction === "world-to-dynamic" ? "Dynamic wallet not connected" : "World ID wallet not connected")
        return
      }

      if (direction === "world-to-dynamic" && !(await MiniKit.isInstalled())) {
        setError("MiniKit not installed")
        return
      }

      const paymentReference = `payment-${Date.now()}`

      if (tokenSymbol === TokenSymbol.ETH) {
        await handleETHTransfer(amount, finalRecipientAddress, direction)
      } else {
        await handleTokenTransfer(tokenSymbol, amount, finalRecipientAddress, direction, paymentReference)
      }
    } catch (error: any) {
      setError(error instanceof Error ? error.message : "Failed to transfer funds")
    } finally {
      setIsLoading(false)
    }
  }

  const handleETHTransfer = async (amount: string, recipient: string, direction: string) => {
    if (direction === "dynamic-to-world") {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        throw new Error("Dynamic wallet not connected or not Ethereum compatible")
      }

      const walletClient = await primaryWallet.getWalletClient()
      const publicClient = await primaryWallet.getPublicClient()

      const hash = await walletClient.sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      setResult(
        `Successfully sent ${amount} ETH to ${recipient.substring(0, 8)}...${recipient.substring(
          recipient.length - 6,
        )}. TX: ${receipt.transactionHash.substring(0, 12)}...`,
      )
    } else {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: "0x087d5449a126e4e439495fcBc62A853eB3257936",
            abi: ForwardABI,
            functionName: "pay",
            args: [recipient],
            value: `0x${parseEther(amount).toString(16)}`,
          },
        ],
      })

      if (finalPayload.status === "error") {
        throw new Error("Transaction failed")
      }

      setResult(
        `Successfully sent ${amount} ETH to ${recipient.substring(0, 8)}...${recipient.substring(
          recipient.length - 6,
        )}. TX: ${finalPayload.transaction_id.substring(0, 12)}...`,
      )
    }
  }

  const handleTokenTransfer = async (
    tokenSymbol: TokenSymbol,
    amount: string,
    recipient: string,
    direction: string,
    paymentReference: string,
  ) => {
    if (direction === "dynamic-to-world") {
      if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
        throw new Error("Dynamic wallet not connected or not Ethereum compatible")
      }

      const walletClient = await primaryWallet.getWalletClient()
      const publicClient = await primaryWallet.getPublicClient()

      const tokenAddress = tokenSymbol === TokenSymbol.WLD ? WLD_TOKEN_ADDRESS : USDC_TOKEN_ADDRESS
      const decimals = tokenSymbol === TokenSymbol.WLD ? 18 : 6
      const amountInWei = BigInt(Number.parseFloat(amount) * Math.pow(10, decimals))

      const transferABI = [
        {
          name: "transfer",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
      ]

      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: transferABI,
        functionName: "transfer",
        args: [recipient, amountInWei],
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      setResult(
        `Successfully sent ${amount} ${tokenSymbol} to ${recipient.substring(0, 8)}...${recipient.substring(
          recipient.length - 6,
        )}. TX: ${receipt.transactionHash.substring(0, 12)}...`,
      )
    } else {
      const { finalPayload } = await MiniKit.commandsAsync.pay({
        reference: paymentReference,
        to: recipient,
        tokens: [
          {
            symbol: tokenSymbol === TokenSymbol.WLD ? Tokens.WLD : Tokens.USDCE,
            token_amount: tokenToDecimals(
              Number.parseFloat(amount),
              tokenSymbol === TokenSymbol.WLD ? Tokens.WLD : Tokens.USDCE,
            ).toString(),
          },
        ],
        description: `Transfer ${amount} ${tokenSymbol} to ${recipient.substring(0, 8)}...`,
      })

      if (finalPayload.status === "error") {
        throw new Error("Transaction failed")
      }

      setResult(
        `Successfully sent ${amount} ${tokenSymbol} to ${recipient.substring(0, 8)}...${recipient.substring(
          recipient.length - 6,
        )}. TX: ${finalPayload.transaction_id.substring(0, 12)}...`,
      )
    }
  }
  return (
    <div className="world-funding">
      <div className="wallets-container">
        {worldIdWalletAddress ? (
          <div className="wallet-info">
            <div className="wallet-header">
              <span className="wallet-icon">🌎</span>
              <div className="wallet-details">
                <span className="wallet-label">World ID Wallet</span>
                <code className="wallet-address">
                  {worldIdWalletAddress.substring(0, 8)}...
                  {worldIdWalletAddress.substring(worldIdWalletAddress.length - 6)}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(worldIdWalletAddress)
                    setResult("World ID wallet address copied to clipboard!")
                  }}
                  className="copy-button"
                  title="Copy Address"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="wallet-connect-prompt">
            <p>World ID wallet not detected. Open in World App to connect.</p>
          </div>
        )}

        {user?.verifiedCredentials?.[0]?.address && (
          <div className="wallet-info connected-dynamic">
            <div className="wallet-header">
              <span className="wallet-icon">💼</span>
              <div className="wallet-details">
                <span className="wallet-label">Connected Wallet</span>
                <code className="wallet-address">
                  {user.verifiedCredentials[0].address.substring(0, 8)}...
                  {user.verifiedCredentials[0].address.substring(user.verifiedCredentials[0].address.length - 6)}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {result && (
        <div className="success-message">
          <p>{result}</p>
        </div>
      )}

      <div className="funding-form">
        <h4>Transfer Funds</h4>

        <div className="form-group">
          <label htmlFor="direction">Transfer Direction:</label>
          <select
            id="direction"
            name="direction"
            value={fundingForm.direction}
            onChange={handleInputChange}
            className="direction-select"
          >
            <option value="world-to-dynamic">World ID → Dynamic Wallet</option>
            <option value="dynamic-to-world">Dynamic → World ID Wallet</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount:</label>
          <div className="input-with-select">
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.0001"
              value={fundingForm.amount}
              onChange={handleInputChange}
              min="0.0001"
            />
            <select id="tokenSymbol" name="tokenSymbol" value={fundingForm.tokenSymbol} onChange={handleInputChange}>
              <option value={TokenSymbol.ETH}>ETH</option>
              <option value={TokenSymbol.WLD}>WLD</option>
              <option value={TokenSymbol.USDC}>USDC</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recipientAddress">Recipient Address:</label>
          <input
            type="text"
            id="recipientAddress"
            name="recipientAddress"
            placeholder="0x..."
            value={fundingForm.recipientAddress}
            onChange={handleInputChange}
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={isLoading || !fundingForm.recipientAddress || !worldIdWalletAddress}
          className="transfer-button"
        >
          {isLoading ? "Processing..." : "Transfer Funds"}
        </button>
      </div>
    </div>
  )
}

export default WalletTransfers
