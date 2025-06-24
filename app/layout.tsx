import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MiniKitProvider } from "@/components/minikit-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TPulseFi Staking",
  description: "Dual token staking on World Chain",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MiniKitProvider>{children}</MiniKitProvider>
      </body>
    </html>
  )
}
