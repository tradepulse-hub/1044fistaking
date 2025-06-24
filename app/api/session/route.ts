import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Obter o cookie de sessão
    const sessionCookie = cookies().get("tpulsefi_session")

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Analisar os dados do usuário do cookie
    const user = JSON.parse(sessionCookie.value)

    // Verificar se o usuário está autenticado
    if (!user || !user.authenticated) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Retornar os dados do usuário (exceto informações sensíveis)
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        authTime: user.authTime,
      },
    })
  } catch (error) {
    console.error("Erro ao verificar sessão:", error)
    return NextResponse.json({ error: "Erro ao verificar sessão" }, { status: 500 })
  }
}
