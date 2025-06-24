import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const transactionId = searchParams.get("id")

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${process.env.APP_ID}&type=transaction`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const transaction = await response.json()
    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error fetching transaction status:", error)
    return NextResponse.json({ error: "Failed to fetch transaction status" }, { status: 500 })
  }
}
