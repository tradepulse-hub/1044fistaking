"use client"

import { generateMessageToSign } from "@dynamic-labs/multi-wallet"
import { VerifyRequestFromJSON } from "@dynamic-labs/sdk-api-core"
import { useRefreshUser, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { MiniKit } from "@worldcoin/minikit-js"
import { type FC, useState } from "react"
import { DYNAMIC_ENVIRONMENT_ID, dynamicApi } from "@/lib/utils"

const WorldDynamicSIWE: FC = () => {
  const refreshUser = useRefreshUser()
  const { user, primaryWallet } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [siweData, setSiweData] = useState<any>(null)

  // Safe JSON stringification to handle circular references
  const safeStringify = (obj: unknown): string => {
    const seen = new WeakSet()
    return JSON.stringify(
      obj,
      (_, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]"
          seen.add(value)
        }
        return value
      },
      2,
    )
  }

  // Nonce management functions
  const storeNonce = (nonce: string) => {
    localStorage.setItem("dynamic_nonce", JSON.stringify({ value: nonce }))
  }

  const consumeNonce = () => {
    const nonceString = localStorage.getItem("dynamic_nonce")
    if (nonceString) {
      const nonceObject = JSON.parse(nonceString)
      localStorage.removeItem("dynamic_nonce")
      return nonceObject.value
    }
    return null
  }

  const generateDynamicNonce = async (): Promise<string> => {
    const response = await fetch(`https://app.dynamicauth.com/api/v0/sdk/${DYNAMIC_ENVIRONMENT_ID}/nonce`, {
      method: "GET",
    })
    const data = await response.json()
    return data.nonce
  }

  // Verify user with Dynamic API
  const callVerifyUser = async (messageToSign: string, address: string, signedMessage: string) => {
    const verifyRequest = VerifyRequestFromJSON({
      chain: "EVM",
      messageToSign,
      network: "1",
      publicWalletAddress: address,
      signedMessage,
      walletName: "worldcoin",
      walletProvider: "browserExtension",
    })

    const response = await dynamicApi().verify({
      environmentId: DYNAMIC_ENVIRONMENT_ID,
      verifyRequest,
    })

    // Store authentication tokens
    window.localStorage.setItem("dynamic_authentication_token", JSON.stringify(response.jwt))
    window.localStorage.setItem("dynamic_min_authentication_token", JSON.stringify(response.jwt))

    return response
  }

  // Main authentication handler
  const handleWorldcoinSIWE = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!primaryWallet) {
        throw new Error("No wallet connected")
      }

      // Generate and store nonce
      const dynamicNonce = await generateDynamicNonce()
      storeNonce(dynamicNonce)

      // Initiate Worldcoin authentication
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: dynamicNonce,
      })

      // Generate message to sign
      const messageToSign = generateMessageToSign({
        blockchain: "EVM",
        chainId: 1,
        domain: window.location.host,
        nonce: consumeNonce(),
        publicKey: primaryWallet.address,
        requestId: DYNAMIC_ENVIRONMENT_ID,
        uri: window.location.href,
      })

      // Sign message and verify
      const signature = await primaryWallet.signMessage(messageToSign)
      const verifyResponse = await callVerifyUser(messageToSign, primaryWallet.address, signature)

      // Update user and store data
      await refreshUser()
      setSiweData({
        message: messageToSign,
        signature,
        address: primaryWallet.address,
        verifyResponse,
        worldcoinPayload: JSON.parse(safeStringify(finalPayload)),
        walletSource: primaryWallet.connector?.name || "Unknown",
        connectedDynamic: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "SIWE authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="world-dynamic-siwe">
      <h3>World ID SIWE Authentication</h3>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {!siweData ? (
        <button onClick={handleWorldcoinSIWE} disabled={isLoading || !primaryWallet} className="siwe-button">
          {isLoading ? "Authenticating..." : "Sign-In with Worldcoin"}
        </button>
      ) : (
        <div className="siwe-data">
          <h4>Authentication Success!</h4>
          <div className="data-display">
            <p>
              <strong>Wallet Source:</strong> {siweData.walletSource}
            </p>
            <p>
              <strong>Connected to Dynamic:</strong> {siweData.connectedDynamic ? "Yes" : "No"}
            </p>
            <p>
              <strong>Address:</strong> <code>{siweData.address}</code>
            </p>
            <details>
              <summary>View Complete SIWE Data</summary>
              <pre>{JSON.stringify(siweData, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorldDynamicSIWE
