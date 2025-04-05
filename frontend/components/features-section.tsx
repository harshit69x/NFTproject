"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Ticket, Repeat, Coins, BarChart, Lock } from "lucide-react"

export function FeaturesSection() {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  const features = [
    {
      icon: <Ticket className="h-10 w-10 text-purple-400" />,
      title: "NFT Tickets",
      description: "Each ticket is a unique NFT on the blockchain, providing proof of authenticity and ownership.",
    },
    {
      icon: <Shield className="h-10 w-10 text-pink-400" />,
      title: "Secure Ownership",
      description: "Blockchain technology ensures your tickets cannot be counterfeited or duplicated.",
    },
    {
      icon: <Repeat className="h-10 w-10 text-cyan-400" />,
      title: "Easy Transfers",
      description: "Transfer or resell your tickets with just a few clicks, all while respecting price limits.",
    },
    {
      icon: <Coins className="h-10 w-10 text-yellow-400" />,
      title: "Fair Royalties",
      description: "Event organizers receive royalties from secondary sales, creating a sustainable ecosystem.",
    },
    {
      icon: <BarChart className="h-10 w-10 text-green-400" />,
      title: "Price Controls",
      description: "Maximum resale prices prevent scalping while allowing legitimate resales.",
    },
    {
      icon: <Lock className="h-10 w-10 text-red-400" />,
      title: "Transparent History",
      description: "View the complete ownership history of any ticket, ensuring transparency.",
    },
  ]

  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-pink-900/10 to-black pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Why Choose <span className="text-gradient">NFT Tickets</span>
          </h2>
          <p className="text-zinc-400">
            Our blockchain-based ticketing system offers numerous advantages over traditional tickets, providing
            security, transparency, and new opportunities for both event organizers and attendees.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 h-full">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

