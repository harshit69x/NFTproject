"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Ticket, Tag, Calendar, MapPin } from "lucide-react"
import Web3 from "web3"

type OwnedTicket = {
  id: number
  eventId: number
  eventName: string
  originalPrice: string
  forSale: boolean
  listingPrice?: string
}

export default function MyTicketsPage() {
  const { contract, account, isConnected } = useWeb3()
  const [ownedTickets, setOwnedTickets] = useState<OwnedTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<OwnedTicket | null>(null)
  const [listPrice, setListPrice] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (contract && account) {
      fetchOwnedTickets()
    } else {
      setLoading(false)
    }
  }, [contract, account])

  const fetchOwnedTickets = async () => {
    try {
      setLoading(true)

      // This is a simplified approach - in a real app, you'd need to query all tickets
      // and filter for the ones owned by the current user
      // For demo purposes, we'll use sample data

      // Sample implementation (would need to be customized based on contract)
      /*
      const totalSupply = await contract.totalSupply()
      const ownedTicketsData = []
      
      for (let i = 1; i <= totalSupply; i++) {
        try {
          const owner = await contract.ownerOf(i)
          if (owner.toLowerCase() === account.toLowerCase()) {
            const ticketData = await contract.tickets(i)
            const eventData = await contract.events(ticketData.eventId)
            const owners = await contract.getTicketOwners(i)
            
            // Find the current owner's data
            const currentOwnerData = owners.find(
              (ownerData) => ownerData.owner.toLowerCase() === account.toLowerCase()
            )
            
            ownedTicketsData.push({
              id: i,
              eventId: ticketData.eventId.toNumber(),
              eventName: eventData.name,
              originalPrice: Web3.utils.fromWei(ticketData.originalPrice, "ether"),
              forSale: currentOwnerData.forSale,
              listingPrice: currentOwnerData.forSale 
                ? Web3.utils.fromWei(currentOwnerData.price, "ether") 
                : undefined
            })
          }
        } catch (error) {
          console.error(`Error checking ticket ${i}:`, error)
        }
      }
      
      setOwnedTickets(ownedTicketsData)
      */

      // For demo, use sample data
      setTimeout(() => {
        setOwnedTickets([
          {
            id: 1,
            eventId: 1,
            eventName: "Summer Music Festival",
            originalPrice: "0.05",
            forSale: false,
          },
          {
            id: 2,
            eventId: 2,
            eventName: "Tech Conference 2023",
            originalPrice: "0.08",
            forSale: true,
            listingPrice: "0.12",
          },
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching owned tickets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch your tickets. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleListTicket = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!contract || !account || !selectedTicket) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      const priceInWei = Web3.utils.toWei(listPrice, "ether")
      const tx = await contract.methods.listTicket(selectedTicket.id, priceInWei).send({
        from: account
      })

      toast({
        title: "Listing ticket",
        description: "Please wait while your transaction is being processed",
      })

      await tx

      toast({
        title: "Success",
        description: "Ticket listed successfully!",
      })

      setListDialogOpen(false)
      fetchOwnedTickets()
      setListPrice("")
      setSelectedTicket(null)
    } catch (error) {
      console.error("Error listing ticket:", error)
      toast({
        title: "Error",
        description: "Failed to list ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openListDialog = (ticket: OwnedTicket) => {
    setSelectedTicket(ticket)
    setListDialogOpen(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-purple-950 py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              My <span className="text-gradient">Tickets</span>
            </h1>
            <p className="text-zinc-400 max-w-[600px]">
              View and manage your NFT tickets. List them for sale on the marketplace or transfer them to others.
            </p>
          </div>
        </div>

        {!isConnected ? (
          <Card className="bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm p-8 text-center">
            <CardContent className="space-y-4">
              <Ticket className="h-16 w-16 mx-auto text-zinc-600" />
              <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
              <p className="text-zinc-400">Please connect your wallet to view your tickets.</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm animate-pulse">
                  <div className="h-48 bg-zinc-800 rounded-t-lg" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-zinc-800 rounded mb-4 w-3/4" />
                    <div className="h-4 bg-zinc-800 rounded mb-2 w-1/2" />
                    <div className="h-4 bg-zinc-800 rounded mb-2 w-2/3" />
                    <div className="h-4 bg-zinc-800 rounded w-1/4" />
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : ownedTickets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={`/placeholder.svg?height=400&width=600&text=${encodeURIComponent(ticket.eventName)}`}
                        alt={ticket.eventName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                      {ticket.forSale && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Listed for {ticket.listingPrice} ETH
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle>{ticket.eventName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-4">
                      <div className="flex items-center text-zinc-400">
                        <Ticket className="h-4 w-4 mr-2" />
                        <span>Ticket #{ticket.id}</span>
                      </div>
                      <div className="flex items-center text-zinc-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Coming Soon</span>
                      </div>
                      <div className="flex items-center text-zinc-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>Virtual Event</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-zinc-400">Original Price</p>
                        <p className="text-xl font-bold">{ticket.originalPrice} ETH</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {ticket.forSale ? (
                        <Button
                          variant="outline"
                          className="w-full border-purple-500/20 text-white hover:bg-purple-500/10"
                          onClick={() => {
                            // Cancel listing functionality would go here
                            toast({
                              title: "Not implemented",
                              description: "Canceling listings is not implemented in this demo",
                            })
                          }}
                        >
                          Cancel Listing
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => openListDialog(ticket)}
                        >
                          <Tag className="mr-2 h-4 w-4" />
                          List for Sale
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 border border-purple-500/20">
                <DialogHeader>
                  <DialogTitle>List Ticket for Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleListTicket} className="space-y-4 pt-4">
                  <div>
                    <p className="text-sm text-zinc-400">Ticket</p>
                    <p className="font-medium">
                      #{selectedTicket?.id} - {selectedTicket?.eventName}
                    </p>
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
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    List Ticket
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Card className="bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm p-8 text-center">
            <CardContent className="space-y-4">
              <Ticket className="h-16 w-16 mx-auto text-zinc-600" />
              <h2 className="text-xl font-semibold">No Tickets Found</h2>
              <p className="text-zinc-400">You don't have any tickets yet. Browse events to purchase tickets.</p>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mt-4"
                onClick={() => (window.location.href = "/#events")}
              >
                Browse Events
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

