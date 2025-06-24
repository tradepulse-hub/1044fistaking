import { http } from "viem"
import { mainnet, arbitrum, base, optimism, polygon, zora } from "viem/chains"
import { createConfig } from "wagmi"

export const config = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon, zora],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [zora.id]: http(),
  },
})
