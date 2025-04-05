import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/components/web3-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "NFT Ticket Marketplace",
  description: "Buy, sell, and trade event tickets as NFTs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <Web3Provider>
            {children}
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'