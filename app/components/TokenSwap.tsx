"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownUp, Loader2 } from "lucide-react"
import Image from "next/image"
import { MiniKit } from "@worldcoin/minikit-js"
import { enhancedTokenService } from "@/services/enhanced-token-service" // Importar o serviço de tokens

// Token addresses
const WLD_TOKEN_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003"
const TPF_TOKEN_ADDRESS = "0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45" // Endereço TPF atualizado
const PAIR_CONTRACT_ADDRESS = "0xEE08Cef6EbCe1e037fFdbDF6ab657E5C19E86FF3" // Endereço do contrato de Pair

// Interface para os tokens
interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoUrl: string
}

// Definição dos tokens
const tokens: Record<string, Token> = {
  TPF: {
    symbol: "TPF",
    name: "TPulseFi Token",
    address: TPF_TOKEN_ADDRESS,
    decimals: 18,
    logoUrl: "/logo.png",
  },
  WLD: {
    symbol: "WLD",
    name: "Worldcoin",
    address: WLD_TOKEN_ADDRESS,
    decimals: 18,
    logoUrl: "/placeholder.svg?height=32&width=32",
  },
}

export default function TokenSwap() {
  const [fromToken, setFromToken] = useState<string>("TPF")
  const [toToken, setToToken] = useState<string>("WLD")
  const [fromAmount, setFromAmount] = useState<string>("1")
  const [toAmount, setToAmount] = useState<string>("0")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [balances, setBalances] = useState<Record<string, string>>({
    TPF: "0",
    WLD: "0",
  })
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number | null>(null)

  // Obter endereço da carteira e saldos
  useEffect(() => {
    const loadWalletAndBalances = async () => {
      try {
        if (await MiniKit.isInstalled()) {
          const { finalPayload } = await MiniKit.commandsAsync.signMessage({
            message: "Get wallet address for swap",
          })

          if (finalPayload.status !== "error" && finalPayload.address) {
            setWalletAddress(finalPayload.address)
            await fetchRealBalances(finalPayload.address)
          }
        }
      } catch (error) {
        console.error("Failed to get wallet address or balances:", error)
        setError("Falha ao carregar dados da carteira. Tente novamente.")
      }
    }

    loadWalletAndBalances()
  }, [])

  // Buscar saldos reais usando enhancedTokenService
  const fetchRealBalances = async (address: string) => {
    try {
      const allBalances = await enhancedTokenService.getAllTokenBalances(address)
      setBalances({
        TPF: allBalances.TPF || "0",
        WLD: allBalances.WLD || "0",
      })
    } catch (error) {
      console.error("Error fetching real balances:", error)
      setError("Falha ao buscar saldos reais. Usando dados simulados.")
      // Fallback para dados simulados em caso de erro
      setBalances({
        TPF: "10000",
        WLD: "5",
      })
    }
  }

  // Calcular valor de saída e taxa de câmbio (simulado para demonstração)
  useEffect(() => {
    if (fromAmount && fromToken && toToken && fromToken !== toToken) {
      // Em uma implementação real, esta taxa viria de um contrato de DEX (Pair)
      // ou de uma API de provedor de liquidez.
      // Por exemplo, chamando uma função `getAmountsOut` de um router de DEX.
      const mockRate = fromToken === "TPF" ? 0.005 : 200 // 1 TPF = 0.005 WLD, 1 WLD = 200 TPF
      const calculatedAmount = Number.parseFloat(fromAmount) * mockRate
      setToAmount(calculatedAmount.toFixed(6))
      setCurrentExchangeRate(mockRate)
    } else {
      setToAmount("0")
      setCurrentExchangeRate(null)
    }
  }, [fromAmount, fromToken, toToken])

  // Trocar tokens de entrada e saída
  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount) // Define o valor de entrada como o valor de saída anterior
    // O toAmount será recalculado pelo useEffect
  }

  // Executar o swap (simulado)
  const handleSwap = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!walletAddress) {
        throw new Error("Carteira não conectada.")
      }
      if (Number.parseFloat(fromAmount) <= 0) {
        throw new Error("Por favor, insira um valor maior que zero.")
      }
      if (fromToken === toToken) {
        throw new Error("Selecione tokens diferentes para o swap.")
      }
      if (Number.parseFloat(fromAmount) > Number.parseFloat(balances[fromToken])) {
        throw new Error(
          `Saldo insuficiente de ${fromToken}. Você tem ${Number.parseFloat(balances[fromToken]).toLocaleString()} ${fromToken}.`,
        )
      }

      // Simular um atraso de rede
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Em produção, aqui você chamaria o contrato de swap real:
      // 1. Aprovar o token 'fromToken' para o contrato de Pair/Router (se necessário)
      // 2. Chamar a função de swap no contrato de Pair/Router

      // Atualizar saldos simulados após o swap
      const newBalances = { ...balances }
      newBalances[fromToken] = (Number.parseFloat(balances[fromToken]) - Number.parseFloat(fromAmount)).toString()
      newBalances[toToken] = (Number.parseFloat(balances[toToken]) + Number.parseFloat(toAmount)).toString()
      setBalances(newBalances)

      setSuccess(
        `Swap de ${Number.parseFloat(fromAmount).toLocaleString()} ${fromToken} para ${Number.parseFloat(toAmount).toLocaleString()} ${toToken} concluído com sucesso!`,
      )
    } catch (err: any) {
      setError(err.message || "Falha ao executar o swap. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Saldos */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-slate-800/40 border-slate-700/30">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-slate-400">Saldo TPF</p>
            <p className="text-sm font-bold text-slate-200">{Number.parseFloat(balances.TPF).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/40 border-slate-700/30">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-slate-400">Saldo WLD</p>
            <p className="text-sm font-bold text-slate-200">{Number.parseFloat(balances.WLD).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Token de entrada */}
      <Card className="bg-slate-800/40 border-slate-700/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">De</p>
            <p className="text-xs text-slate-400">
              Saldo: {Number.parseFloat(balances[fromToken]).toLocaleString()} {fromToken}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-sm"></div>
              <div className="relative w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center border border-slate-500/50 overflow-hidden">
                <Image
                  src={tokens[fromToken].logoUrl || "/placeholder.svg"}
                  alt={`${fromToken} Logo`}
                  width={20}
                  height={20}
                  className="object-cover"
                />
              </div>
            </div>

            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-sm text-slate-200 flex-shrink-0 w-20"
              disabled={isLoading}
            >
              <option value="TPF">TPF</option>
              <option value="WLD">WLD</option>
            </select>

            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-sm text-slate-200 w-full"
              placeholder="0.0"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão de swap */}
      <div className="flex justify-center -my-2 relative z-10">
        <Button
          onClick={handleSwapTokens}
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full bg-slate-700 border-slate-600 hover:bg-slate-600"
          disabled={isLoading}
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Token de saída */}
      <Card className="bg-slate-800/40 border-slate-700/30">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">Para</p>
            <p className="text-xs text-slate-400">
              Saldo: {Number.parseFloat(balances[toToken]).toLocaleString()} {toToken}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-sm"></div>
              <div className="relative w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center border border-slate-500/50 overflow-hidden">
                <Image
                  src={tokens[toToken].logoUrl || "/placeholder.svg"}
                  alt={`${toToken} Logo`}
                  width={20}
                  height={20}
                  className="object-cover"
                />
              </div>
            </div>

            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-sm text-slate-200 flex-shrink-0 w-20"
              disabled={isLoading}
            >
              <option value="WLD">WLD</option>
              <option value="TPF">TPF</option>
            </select>

            <input
              type="number"
              value={toAmount}
              readOnly
              className="bg-slate-700/50 border border-slate-600/50 rounded px-2 py-1 text-sm text-slate-200 w-full"
              placeholder="0.0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Taxa de câmbio */}
      {currentExchangeRate !== null && (
        <div className="text-xs text-slate-400 text-center">
          Taxa de câmbio: 1 {fromToken} = {currentExchangeRate.toFixed(6)} {toToken}
        </div>
      )}
      <div className="text-xs text-slate-500 text-center">
        {`(O endereço do contrato de Pair é: ${PAIR_CONTRACT_ADDRESS})`}
      </div>

      {/* Mensagens de erro/sucesso */}
      {error && <div className="bg-red-900/30 border border-red-700/30 rounded p-2 text-xs text-red-300">{error}</div>}

      {success && (
        <div className="bg-green-900/30 border border-green-700/30 rounded p-2 text-xs text-green-300">{success}</div>
      )}

      {/* Botão de swap */}
      <Button
        onClick={handleSwap}
        disabled={isLoading || !fromAmount || Number.parseFloat(fromAmount) <= 0 || fromToken === toToken}
        className="w-full h-10 elegant-button bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-semibold text-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processando...</span>
          </div>
        ) : fromToken === toToken ? (
          "Selecione tokens diferentes"
        ) : (
          `Trocar ${fromToken} por ${toToken}`
        )}
      </Button>

      {/* Informação de carteira */}
      {walletAddress && (
        <div className="text-xs text-slate-500 text-center">
          Carteira conectada: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
        </div>
      )}
    </div>
  )
}
