"use client"

import type React from "react"

import { EthereumWalletConnectors } from "@dynamic-labs/ethereum"
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core"
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider"
import { useEffect } from "react"
import { WagmiProvider } from "wagmi"
import { config } from "./wagmi"

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()

  // Initialize eruda for debugging in the World App environment
  useEffect(() => {
    import("eruda").then((eruda) => {
      eruda.default.init()
    })
  }, [])

  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "demo-environment",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <MiniKitProvider>{children}</MiniKitProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  )
}
