import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { payload, nonce } = body

    // Em uma implementação real, você deve:
    // 1. Verificar se o nonce corresponde ao armazenado
    // 2. Verificar a assinatura do payload com a chave pública da Worldcoin
    // 3. Verificar se o endereço da carteira é válido

    if (!payload || !payload.address) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    // Criar um objeto de usuário com os dados necessários
    const user = {
      id: payload.address,
      walletAddress: payload.address,
      authenticated: true,
      authTime: new Date().toISOString(),
    }

    // Definir um cookie de sessão
    cookies().set({
      name: "tpulsefi_session",
      value: JSON.stringify(user),
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro no processo de login" }, { status: 500 })
  }
}
