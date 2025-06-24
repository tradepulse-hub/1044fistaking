import { ethers } from "ethers"

// Configuração da rede Worldchain
const WORLDCHAIN_RPC = "https://worldchain-mainnet.g.alchemy.com/public"

// Contract addresses
const TPT_CONTRACT = "0x4c1f9CF3c5742c73a00864a32048988b87121e2f"
const PUF_CONTRACT = "0x00F7BE23621155D636562fe9eB44578507Ee7da4"

// ABI completo para análise
const FULL_ANALYSIS_ABI = [
  // Funções básicas
  "function claimRewards() external",
  "function calculatePendingRewards(address _user) external view returns (uint256)",
  "function getUserInfo(address _user) external view returns (uint256, uint256, uint256, uint256)",
  "function canClaim(address _user) external view returns (bool)",
  "function getCurrentAPY() external view returns (uint256)",
  "function getRewardBalance() external view returns (uint256)",
  "function getTokenAddresses() external view returns (address, address)",

  // Variáveis públicas
  "function tpfToken() external view returns (address)",
  "function rewardToken() external view returns (address)",
  "function apyRate() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function totalRewardsClaimed() external view returns (uint256)",

  // Constantes
  "function BASIS_POINTS() external view returns (uint256)",
  "function SECONDS_PER_YEAR() external view returns (uint256)",

  // Mappings
  "function users(address) external view returns (uint256, uint256)",
]

interface ContractAnalysis {
  address: string
  name: string
  isDeployed: boolean
  functions: {
    claimRewards: boolean
    calculatePendingRewards: boolean
    getUserInfo: boolean
    canClaim: boolean
    getCurrentAPY: boolean
  }
  variables: {
    tpfToken: string
    rewardToken: string
    apyRate: string
    owner: string
    totalRewardsClaimed: string
  }
  constants: {
    basisPoints: string
    secondsPerYear: string
  }
  userSpecific: {
    tpfBalance: string
    pendingRewards: string
    canClaim: boolean
    lastClaimTime: string
    totalClaimed: string
  }
  errors: string[]
}

class ContractComparisonService {
  private provider: ethers.JsonRpcProvider | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.provider = new ethers.JsonRpcProvider(WORLDCHAIN_RPC)
    }
  }

  async analyzeContract(contractAddress: string, name: string, userAddress: string): Promise<ContractAnalysis> {
    const analysis: ContractAnalysis = {
      address: contractAddress,
      name,
      isDeployed: false,
      functions: {
        claimRewards: false,
        calculatePendingRewards: false,
        getUserInfo: false,
        canClaim: false,
        getCurrentAPY: false,
      },
      variables: {
        tpfToken: "N/A",
        rewardToken: "N/A",
        apyRate: "N/A",
        owner: "N/A",
        totalRewardsClaimed: "N/A",
      },
      constants: {
        basisPoints: "N/A",
        secondsPerYear: "N/A",
      },
      userSpecific: {
        tpfBalance: "N/A",
        pendingRewards: "N/A",
        canClaim: false,
        lastClaimTime: "N/A",
        totalClaimed: "N/A",
      },
      errors: [],
    }

    if (!this.provider) {
      analysis.errors.push("Provider not initialized")
      return analysis
    }

    try {
      console.log(`🔍 Analyzing ${name} contract: ${contractAddress}`)

      // Verificar se o contrato existe
      const code = await this.provider.getCode(contractAddress)
      if (code === "0x") {
        analysis.errors.push("Contract not deployed")
        return analysis
      }
      analysis.isDeployed = true

      const contract = new ethers.Contract(contractAddress, FULL_ANALYSIS_ABI, this.provider)

      // Testar funções
      try {
        await contract.claimRewards.staticCall({ from: userAddress })
        analysis.functions.claimRewards = true
      } catch (error) {
        analysis.errors.push(`claimRewards: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        await contract.calculatePendingRewards(userAddress)
        analysis.functions.calculatePendingRewards = true
      } catch (error) {
        analysis.errors.push(`calculatePendingRewards: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const userInfo = await contract.getUserInfo(userAddress)
        analysis.functions.getUserInfo = true
        analysis.userSpecific.tpfBalance = ethers.formatEther(userInfo[0])
        analysis.userSpecific.pendingRewards = ethers.formatEther(userInfo[1])
        analysis.userSpecific.lastClaimTime = userInfo[2].toString()
        analysis.userSpecific.totalClaimed = ethers.formatEther(userInfo[3])
      } catch (error) {
        analysis.errors.push(`getUserInfo: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const canClaim = await contract.canClaim(userAddress)
        analysis.functions.canClaim = true
        analysis.userSpecific.canClaim = canClaim
      } catch (error) {
        analysis.errors.push(`canClaim: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const apy = await contract.getCurrentAPY()
        analysis.functions.getCurrentAPY = true
        analysis.variables.apyRate = apy.toString()
      } catch (error) {
        analysis.errors.push(`getCurrentAPY: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Testar variáveis
      try {
        const tpfToken = await contract.tpfToken()
        analysis.variables.tpfToken = tpfToken
      } catch (error) {
        analysis.errors.push(`tpfToken: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const rewardToken = await contract.rewardToken()
        analysis.variables.rewardToken = rewardToken
      } catch (error) {
        analysis.errors.push(`rewardToken: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const owner = await contract.owner()
        analysis.variables.owner = owner
      } catch (error) {
        analysis.errors.push(`owner: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const totalClaimed = await contract.totalRewardsClaimed()
        analysis.variables.totalRewardsClaimed = ethers.formatEther(totalClaimed)
      } catch (error) {
        analysis.errors.push(`totalRewardsClaimed: ${error instanceof Error ? error.message : String(error)}`)
      }

      // Testar constantes
      try {
        const basisPoints = await contract.BASIS_POINTS()
        analysis.constants.basisPoints = basisPoints.toString()
      } catch (error) {
        analysis.errors.push(`BASIS_POINTS: ${error instanceof Error ? error.message : String(error)}`)
      }

      try {
        const secondsPerYear = await contract.SECONDS_PER_YEAR()
        analysis.constants.secondsPerYear = secondsPerYear.toString()
      } catch (error) {
        analysis.errors.push(`SECONDS_PER_YEAR: ${error instanceof Error ? error.message : String(error)}`)
      }

      console.log(`✅ ${name} analysis completed:`, analysis)
      return analysis
    } catch (error) {
      analysis.errors.push(`General error: ${error instanceof Error ? error.message : String(error)}`)
      console.error(`❌ Error analyzing ${name}:`, error)
      return analysis
    }
  }

  async compareContracts(userAddress: string): Promise<{
    tpt: ContractAnalysis
    puf: ContractAnalysis
    differences: string[]
    recommendations: string[]
  }> {
    console.log("🔍 Starting detailed contract comparison...")

    const tptAnalysis = await this.analyzeContract(TPT_CONTRACT, "TPT", userAddress)
    const pufAnalysis = await this.analyzeContract(PUF_CONTRACT, "PUF", userAddress)

    const differences: string[] = []
    const recommendations: string[] = []

    // Comparar deployment
    if (tptAnalysis.isDeployed !== pufAnalysis.isDeployed) {
      differences.push(`Deployment: TPT=${tptAnalysis.isDeployed}, PUF=${pufAnalysis.isDeployed}`)
    }

    // Comparar funções
    Object.keys(tptAnalysis.functions).forEach((func) => {
      const tptHas = tptAnalysis.functions[func as keyof typeof tptAnalysis.functions]
      const pufHas = pufAnalysis.functions[func as keyof typeof pufAnalysis.functions]
      if (tptHas !== pufHas) {
        differences.push(`Function ${func}: TPT=${tptHas}, PUF=${pufHas}`)
      }
    })

    // Comparar variáveis importantes
    if (tptAnalysis.variables.apyRate !== pufAnalysis.variables.apyRate) {
      differences.push(`APY Rate: TPT=${tptAnalysis.variables.apyRate}, PUF=${pufAnalysis.variables.apyRate}`)
    }

    if (tptAnalysis.variables.tpfToken !== pufAnalysis.variables.tpfToken) {
      differences.push(`TPF Token: TPT=${tptAnalysis.variables.tpfToken}, PUF=${pufAnalysis.variables.tpfToken}`)
    }

    if (tptAnalysis.variables.rewardToken !== pufAnalysis.variables.rewardToken) {
      differences.push(
        `Reward Token: TPT=${tptAnalysis.variables.rewardToken}, PUF=${pufAnalysis.variables.rewardToken}`,
      )
    }

    // Comparar constantes
    if (tptAnalysis.constants.basisPoints !== pufAnalysis.constants.basisPoints) {
      differences.push(
        `Basis Points: TPT=${tptAnalysis.constants.basisPoints}, PUF=${pufAnalysis.constants.basisPoints}`,
      )
    }

    if (tptAnalysis.constants.secondsPerYear !== pufAnalysis.constants.secondsPerYear) {
      differences.push(
        `Seconds Per Year: TPT=${tptAnalysis.constants.secondsPerYear}, PUF=${pufAnalysis.constants.secondsPerYear}`,
      )
    }

    // Comparar dados do usuário
    if (tptAnalysis.userSpecific.canClaim !== pufAnalysis.userSpecific.canClaim) {
      differences.push(`Can Claim: TPT=${tptAnalysis.userSpecific.canClaim}, PUF=${pufAnalysis.userSpecific.canClaim}`)
    }

    // Gerar recomendações
    if (!pufAnalysis.isDeployed) {
      recommendations.push("❌ PUF contract is not deployed")
    }

    if (!pufAnalysis.functions.claimRewards) {
      recommendations.push("❌ PUF contract doesn't have claimRewards function")
    }

    if (pufAnalysis.variables.apyRate === "N/A") {
      recommendations.push("❌ PUF contract APY rate not accessible")
    }

    if (!pufAnalysis.userSpecific.canClaim && pufAnalysis.functions.canClaim) {
      recommendations.push("⚠️ PUF contract says user cannot claim")
    }

    if (pufAnalysis.errors.length > tptAnalysis.errors.length) {
      recommendations.push("❌ PUF contract has more errors than TPT")
    }

    if (differences.length === 0) {
      recommendations.push("✅ Contracts appear identical - issue may be elsewhere")
    }

    console.log("📊 Contract comparison completed:")
    console.log("Differences:", differences)
    console.log("Recommendations:", recommendations)

    return {
      tpt: tptAnalysis,
      puf: pufAnalysis,
      differences,
      recommendations,
    }
  }
}

export const contractComparisonService = new ContractComparisonService()
