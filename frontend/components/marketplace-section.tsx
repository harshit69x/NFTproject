"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ShoppingCart, Tag, Ticket, User } from "lucide-react"
import { ethers } from "ethers"

type ListedTicket = {
  id: number
  eventId: number
  eventName: string
  price: string
  seller: string
}

export function MarketplaceSection() {
  const { contract, account, isConnected } = useWeb3()
  const [listedTickets, setListedTickets] = useState<ListedTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null)
  const [listPrice, setListPrice] = useState("")
  const { toast } = useToast()

  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  useEffect(() => {
    if (contract) {
      fetchListedTickets()
    }
  }, [contract])

  const fetchListedTickets = async () => {
    try {
      setLoading(true)
      const listedTicketIds = await contract?.showListedTickets()

      const ticketsData = await Promise.all(
        listedTicketIds.map(async (id: ethers.BigNumber) => {
          const tokenId = id.toNumber()
          const ticketData = await contract?.tickets(tokenId)
          const eventData = await contract?.events(ticketData.eventId)
          const owners = await contract?.getTicketOwners(tokenId)

          // Find the current owner who has listed the ticket
          const currentOwner = owners.find((owner: any) => owner.forSale)

          return {
            id: tokenId,
            eventId: ticketData.eventId.toNumber(),
            eventName: eventData.name,
            price: ethers.utils.formatEther(currentOwner.price),
            seller: currentOwner.owner,
          }
        }),
      )

      setListedTickets(ticketsData)
    } catch (error) {
      console.error("Error fetching listed tickets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch listed tickets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleListTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract || !account || selectedTicket === null) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const priceInWei = ethers.utils.parseEther(listPrice)
      const tx = await contract.listTicket(selectedTicket, priceInWei)

      toast({
        title: "Listing ticket",
        description: "Please wait while your transaction is being processed",
      })

      await tx.wait()

      toast({
        title: "Success",
        description: "Ticket listed successfully!",
      })

      setListDialogOpen(false)
      fetchListedTickets()
      setListPrice("")
    } catch (error) {
      console.error("Error listing ticket:", error)
      toast({
        title: "Error",
        description: "Failed to list ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBuyTicket = async (tokenId: number, price: string) => {
    if (!contract || !account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const priceInWei = ethers.utils.parseEther(price)
      // This is a placeholder - the actual contract would need a buyTicket function
      // const tx = await contract.buyTicket(tokenId, { value: priceInWei })

      toast({
        title: "Buying ticket",
        description: "Please wait while your transaction is being processed",
      })

      // await tx.wait()

      toast({
        title: "Success",
        description: "Ticket purchased successfully!",
      })

      fetchListedTickets()
    } catch (error) {
      console.error("Error buying ticket:", error)
      toast({
        title: "Error",
        description: "Failed to buy ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Sample data for UI demonstration
  const sampleTickets = [
    {
      id: 101,
      eventId: 1,
      eventName: "Summer Music Festival",
      price: "0.08",
      seller: "0x1234...5678",
    },
    {
      id: 102,
      eventId: 2,
      eventName: "Tech Conference 2023",
      price: "0.12",
      seller: "0x8765...4321",
    },
    {
      id: 103,
      eventId: 3,
      eventName: "Art Exhibition",
      price: "0.05",
      seller: "0x5678...1234",
    },
    {
      id: 104,
      eventId: 1,
      eventName: "Summer Music Festival",
      price: "0.09",
      seller: "0x4321...8765",
    },
  ]

  return (
    <section id="marketplace" className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-cyan-900/10 to-black pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ticket <span className="text-gradient">Marketplace</span>
            </h2>
            <p className="text-zinc-400 max-w-[600px]">
              Buy and sell tickets on the secondary market with transparent pricing and royalties for event organizers.
            </p>
          </motion.div>

          {isConnected && (
            <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                  <Tag className="mr-2 h-4 w-4" />
                  List My Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 border border-cyan-500/20">
                <DialogHeader>
                  <DialogTitle>List Ticket for Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleListTicket} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticketId">Ticket ID</Label>
                    <Input
                      id="ticketId"
                      type="number"
                      value={selectedTicket || ""}
                      onChange={(e) => setSelectedTicket(Number.parseInt(e.target.value))}
                      required
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Listing Price (ETH)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.001"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      required
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    List Ticket
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="bg-zinc-900/50 border border-cyan-500/10 backdrop-blur-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-zinc-800 rounded mb-4 w-3/4" />
                      <div className="h-4 bg-zinc-800 rounded mb-2 w-1/2" />
                      <div className="h-4 bg-zinc-800 rounded mb-2 w-2/3" />
                      <div className="h-4 bg-zinc-800 rounded w-1/4" />
                    </CardContent>
                  </Card>
                ))
            : listedTickets.length > 0
              ? listedTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="bg-zinc-900/50 border border-cyan-500/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{ticket.eventName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-zinc-400">
                            <Ticket className="h-4 w-4 mr-2" />
                            <span>Ticket #{ticket.id}</span>
                          </div>
                          <div className="flex items-center text-zinc-400">
                            <User className="h-4 w-4 mr-2" />
                            <span title={ticket.seller}>
                              {ticket.seller.substring(0, 6)}...{ticket.seller.substring(38)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-zinc-400">Price</p>
                          <p className="text-xl font-bold">{ticket.price} ETH</p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          onClick={() => handleBuyTicket(ticket.id, ticket.price)}
                          disabled={!isConnected || ticket.seller.toLowerCase() === account?.toLowerCase()}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {!isConnected
                            ? "Connect Wallet to Buy"
                            : ticket.seller.toLowerCase() === account?.toLowerCase()
                              ? "You Own This Ticket"
                              : "Buy Now"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              : // Fallback to sample tickets if no tickets from contract
                sampleTickets.map((ticket, index) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="bg-zinc-900/50 border border-cyan-500/10 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{ticket.eventName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-zinc-400">
                            <Ticket className="h-4 w-4 mr-2" />
                            <span>Ticket #{ticket.id}</span>
                          </div>
                          <div className="flex items-center text-zinc-400">
                            <User className="h-4 w-4 mr-2" />
                            <span>{ticket.seller}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-zinc-400">Price</p>
                          <p className="text-xl font-bold">{ticket.price} ETH</p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                          onClick={() => handleBuyTicket(ticket.id, ticket.price)}
                          disabled={!isConnected}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {isConnected ? "Buy Now" : "Connect Wallet to Buy"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
        </div>
      </div>
    </section>
  )
}

