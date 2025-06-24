import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  cookies().delete("tpulsefi_session")
  cookies().delete("siwe")

  // Adicionar esta linha para garantir que o localStorage também seja limpo no lado do cliente
  // Isso será executado via script no lado do cliente
  cookies().set("clear_local_storage", "true", {
    maxAge: 1, // Curta duração, apenas para sinalizar ao cliente
    path: "/",
  })

  return NextResponse.json({ message: "Logged out" }, { status: 200 })
}
