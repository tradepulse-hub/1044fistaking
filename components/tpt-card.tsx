"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface TPTCardProps {
  /** Saldo de TPT na carteira do usuário */
  balance?: number
  /** Recompensas pendentes em TPT */
  pendingRewards?: number
  /** Função chamada quando o usuário clica em “Claim” */
  onClaim?: () => void
}

/**
 * Card de staking do token TPT.
 * Mostra saldo, recompensas pendentes e botão de claim.
 */
export function TPTCard({ balance = 0, pendingRewards = 0, onClaim }: TPTCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg font-semibold">TPT</span>
          <span className="text-xs font-medium text-muted-foreground">1.00% APY</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Saldo:</span>
          <span className="font-medium">{balance.toLocaleString()} TPT</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Recompensas:</span>
          <span className="font-medium">{pendingRewards.toLocaleString()} TPT</span>
        </div>
        <Button className="w-full" disabled={pendingRewards === 0} onClick={onClaim}>
          Claim
        </Button>
      </CardContent>
    </Card>
  )
}
