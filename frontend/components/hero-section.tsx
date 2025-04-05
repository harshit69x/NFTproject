"use client"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { Ticket, Sparkles, ArrowRight, CalendarPlus } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  const { connectWallet, isConnected, isLoading } = useWeb3()
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-black/50 pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center text-center space-y-8"
        >
          <div className="inline-block p-2 bg-purple-500/10 backdrop-blur-sm rounded-xl mb-4">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter">
            <span className="text-gradient">NFT Ticket</span> Marketplace
          </h1>

          <p className="max-w-[700px] text-lg md:text-xl text-zinc-400">
            Buy, sell, and trade event tickets as NFTs with transparent pricing and authentic ownership verification.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {!isConnected ? (
              <Button
                onClick={connectWallet}
                size="lg"
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-8 animate-pulse"
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
                <Ticket className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-8"
                  onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Explore Events
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Link href="/host-event" passHref>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-8"
                  >
                    Host an Event
                    <CalendarPlus className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </>
            )}

            <Button
              variant="outline"
              size="lg"
              className="border-purple-500/20 text-white hover:bg-purple-500/10"
              onClick={() => document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" })}
            >
              View Marketplace
            </Button>
          </div>

          {isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-8 flex flex-col items-center"
            >
              <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-950/30 px-4 py-2 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span>Wallet Connected</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="absolute -bottom-48 left-0 right-0 h-96 bg-gradient-to-t from-purple-900/20 to-transparent blur-3xl transform -skew-y-3" />
    </section>
  )
}

