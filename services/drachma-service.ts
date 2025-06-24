import { ethers } from "ethers"

// Drachma Token Contract Address
const DRACHMA_TOKEN_ADDRESS = "0x1234567890123456789012345678901234567890" // Replace with actual address
const DRACHMA_STAKING_ADDRESS = "0x0987654321098765432109876543210987654321" // Replace with actual address

// Drachma Token ABI (simplified)
const DRACHMA_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]

// Drachma Staking Contract ABI
const DRACHMA_STAKING_ABI = [
  "function getUserInfo(address user) view returns (uint256 tpfBalance, uint256 pendingRewards, uint256 lastClaimTime, uint256 totalClaimed)",
  "function claimRewards() external",
  "function canClaim(address user) view returns (bool)",
  "function calculatePendingRewards(address user) view returns (uint256)",
  "function getCurrentAPY() view returns (uint256)",
]

export class DrachmaService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private tokenContract: ethers.Contract | null = null
  private stakingContract: ethers.Contract | null = null

  async initialize() {
    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()

      this.tokenContract = new ethers.Contract(DRACHMA_TOKEN_ADDRESS, DRACHMA_TOKEN_ABI, this.signer)

      this.stakingContract = new ethers.Contract(DRACHMA_STAKING_ADDRESS, DRACHMA_STAKING_ABI, this.signer)
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.tokenContract) await this.initialize()
    if (!this.tokenContract) throw new Error("Contract not initialized")

    const balance = await this.tokenContract.balanceOf(address)
    return ethers.formatEther(balance)
  }

  async getUserInfo(address: string) {
    if (!this.stakingContract) await this.initialize()
    if (!this.stakingContract) throw new Error("Staking contract not initialized")

    const [tpfBalance, pendingRewards, lastClaimTime, totalClaimed] = await this.stakingContract.getUserInfo(address)

    return {
      tpfBalance: ethers.formatEther(tpfBalance),
      pendingRewards: ethers.formatEther(pendingRewards),
      lastClaimTime: Number(lastClaimTime),
      totalClaimed: ethers.formatEther(totalClaimed),
    }
  }

  async claimRewards(): Promise<string> {
    if (!this.stakingContract) await this.initialize()
    if (!this.stakingContract) throw new Error("Staking contract not initialized")

    const tx = await this.stakingContract.claimRewards()
    await tx.wait()
    return tx.hash
  }

  async canClaim(address: string): Promise<boolean> {
    if (!this.stakingContract) await this.initialize()
    if (!this.stakingContract) throw new Error("Staking contract not initialized")

    return await this.stakingContract.canClaim(address)
  }

  async getPendingRewards(address: string): Promise<string> {
    if (!this.stakingContract) await this.initialize()
    if (!this.stakingContract) throw new Error("Staking contract not initialized")

    const rewards = await this.stakingContract.calculatePendingRewards(address)
    return ethers.formatEther(rewards)
  }

  async getAPY(): Promise<number> {
    if (!this.stakingContract) await this.initialize()
    if (!this.stakingContract) throw new Error("Staking contract not initialized")

    const apy = await this.stakingContract.getCurrentAPY()
    return Number(apy) / 100 // Convert basis points to percentage
  }
}

export const drachmaService = new DrachmaService()
