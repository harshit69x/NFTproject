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
import getContractInstance from '@/components/okay.js';

type OwnedTicket = {
  id: number
  eventId: number
  eventName: string
  originalPrice: string
  forSale: boolean
  listingPrice?: string
  image?: string
}

export default function MyTicketsPage() {
  const { contract, account, isConnected } = useWeb3()
  const [ownedTickets, setOwnedTickets] = useState<OwnedTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<OwnedTicket | null>(null)
  const [listPrice, setListPrice] = useState("")
  const { toast } = useToast()
  const [contractInstance, setContractInstance] = useState<any>(null);
  const [listedTickets, setListedTickets] = useState<string[]>([]);
  const [marketplaceTickets, setMarketplaceTickets] = useState<any[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);

  useEffect(() => {
    const initContract = async () => {
      try {
        if (account) {
          // Get contract instance from okay.js
          const contractInst = await getContractInstance();
          setContractInstance(contractInst);
          
          // Fetch owned and listed tickets
          await fetchOwnedTickets(contractInst);
          await fetchListedTickets(contractInst);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing contract:", error);
        setLoading(false);
      }
    };

    initContract();
  }, [account]);

  // Add this helper function
  const safeContractCall = async (methodName: string, ...args: any[]) => {
    if (!contractInstance || !contractInstance.methods[methodName]) {
      console.error(`Method ${methodName} does not exist on contract`);
      throw new Error(`Contract method ${methodName} not found`);
    }
    
    return contractInstance.methods[methodName](...args);
  };

  const fetchOwnedTickets = async (contractInst = contractInstance) => {
    try {
      setLoading(true);
      
      if (!contractInst || !account) {
        setLoading(false);
        return;
      }
  
      // Get all owned ticket IDs
      const ownedTicketIds = await contractInst.methods.getOwnedTickets(account).call();
      console.log(`🎫 Owned tickets for ${account}:`, ownedTicketIds);
      
      if (!ownedTicketIds || !ownedTicketIds.length) {
        setOwnedTickets([]);
        setLoading(false);
        return;
      }
  
      // Fetch details for each ticket
      const ticketsPromises = ownedTicketIds.map(async (tokenId: string) => {
        try {
          // Get event details for this ticket
          const eventDetails = await contractInst.methods.getEventForTicket(tokenId).call();
          console.log(`📦 Event for token ID ${tokenId}:`, eventDetails);
          
          // Fetch image from eventURI
          let image = "";
          try {
            const response = await fetch(eventDetails.eventURI);
            if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
              const data = await response.json();
              if (data.image) {
                image = data.image.trim().replace(/\n/g, "");
              }
            } else {
              console.warn(`Invalid response or non-JSON content for eventURI: ${eventDetails.eventURI}`);
            }
          } catch (error) {
            console.error(`Error fetching or parsing eventURI for event ${eventDetails.name}:`, error);
          }

          // Get ticket details (check if it's for sale and listing price)
          const ticketOwners = await contractInst.methods.getTicketOwners(tokenId).call();
          const currentOwnerData = ticketOwners.find(
            (ownerData: any) => ownerData.owner.toLowerCase() === account.toLowerCase()
          );
          
          return {
            id: parseInt(tokenId),
            eventId: parseInt(eventDetails.eventId),
            eventName: eventDetails.name,
            originalPrice: Web3.utils.fromWei(eventDetails.originalPrice, "ether"),
            forSale: currentOwnerData?.forSale || false,
            listingPrice: currentOwnerData?.forSale 
              ? Web3.utils.fromWei(currentOwnerData.price, "ether") 
              : undefined,
            image, // Add the fetched image
          };
        } catch (error) {
          console.error(`Error fetching details for ticket ${tokenId}:`, error);
          return null;
        }
      });
      
      const ticketsData = await Promise.all(ticketsPromises);
      const validTickets = ticketsData.filter(ticket => ticket !== null) as OwnedTicket[];
      
      setOwnedTickets(validTickets);
      console.log("Formatted owned tickets:", validTickets);
    } catch (error) {
      console.error("Error fetching owned tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your tickets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Add this function to fetch listed tickets
  const fetchListedTickets = async (contractInst = contractInstance) => {
    try {
      setMarketplaceLoading(true);
      
      if (!contractInst) {
        setMarketplaceLoading(false);
        return;
      }
      
      // Fetch all listed tickets (IDs only)
      const listed = await contractInst.methods.showListedTickets().call();
      console.log("🧾 Listed tickets:", listed);
      setListedTickets(listed);
      
      // Fetch details for each listed ticket
      if (listed && listed.length > 0) {
        const ticketsPromises = listed.map(async (tokenId: string) => {
          try {
            // Get event details for this ticket
            const eventDetails = await contractInst.methods.getEventForTicket(tokenId).call();
            
            // Fetch image from eventURI
            let image = "";
            try {
              const response = await fetch(eventDetails.eventURI);
              if (response.ok && response.headers.get("Content-Type")?.includes("application/json")) {
                const data = await response.json();
                if (data.image) {
                  image = data.image.trim().replace(/\n/g, "");
                }
              } else {
                console.warn(`Invalid response or non-JSON content for eventURI: ${eventDetails.eventURI}`);
              }
            } catch (error) {
              console.error(`Error fetching or parsing eventURI for event ${eventDetails.name}:`, error);
            }

            // Get the ticket listing details
            let sellerAddress = "";
            let listingPriceWei = "0";
            try {
              const ticketOwners = await contractInst.methods.getTicketOwners(tokenId).call();
              const listedOwner = ticketOwners.find((owner: any) => owner.forSale === true);
              if (listedOwner) {
                sellerAddress = listedOwner.owner;
                listingPriceWei = listedOwner.price;
              }
            } catch (listingError) {
              console.error(`Error getting listing details for ticket ${tokenId}:`, listingError);
            }

            return {
              id: tokenId,
              eventId: eventDetails.eventId,
              eventName: eventDetails.name,
              originalPrice: Web3.utils.fromWei(eventDetails.originalPrice, "ether"),
              seller: sellerAddress || "Unknown",
              listingPrice: listingPriceWei ? Web3.utils.fromWei(listingPriceWei, "ether") : "Unknown",
              image, // Add the fetched image
            };
          } catch (error) {
            console.error(`Error fetching details for listed ticket ${tokenId}:`, error);
            return null;
          }
        });
        
        const ticketsData = await Promise.all(ticketsPromises);
        const validTickets = ticketsData.filter(ticket => ticket !== null);
        
        setMarketplaceTickets(validTickets);
        console.log("Formatted marketplace tickets:", validTickets);
      } else {
        setMarketplaceTickets([]);
      }
    } catch (error) {
      console.error("Error fetching listed tickets:", error);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const debugContract = async () => {
    try {
      if (!contractInstance) {
        console.error("Contract instance not available");
        return;
      }
      
      // Get contract address and methods
      console.log("Contract address:", contractInstance._address);
      console.log("Available methods:", Object.keys(contractInstance.methods));
      
      // Check if the user owns the ticket before attempting to list/cancel
      if (selectedTicket) {
        try {
          const owner = await contractInstance.methods.ownerOf(selectedTicket.id).call();
          console.log(`Ticket ${selectedTicket.id} owner:`, owner);
          console.log(`Current account:`, account);
          console.log(`Is owner:`, owner.toLowerCase() === account.toLowerCase());
        } catch (err) {
          console.error("Error checking ownership:", err);
        }
      }
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  const handleListTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractInstance || !account || !selectedTicket) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Basic validation check
      const priceValue = parseFloat(listPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid price greater than 0",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Processing",
        description: "Listing ticket for sale...",
      });

      const priceInWei = Web3.utils.toWei(listPrice, "ether");
      
      // Add debugging info
      console.log("Listing ticket with ID:", selectedTicket.id);
      console.log("Listing price (wei):", priceInWei);
      console.log("Sender address:", account);

      // List the ticket with proper parameters
      const tx = await contractInstance.methods.listTicket(selectedTicket.id, priceInWei).send({
        from: account,
        gas: 3000000
      });

      console.log("📌 Ticket listed:", tx.events?.TicketListed?.returnValues);

      toast({
        title: "Success",
        description: "Ticket listed successfully!",
      });

      // Reset UI state
      setListDialogOpen(false);
      setListPrice("");
      setSelectedTicket(null);
      
      // Refresh both ticket lists
      await fetchOwnedTickets();
      await fetchListedTickets();
    } catch (error) {
      console.error("Error listing ticket:", error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to list ticket. Please try again.";
      
      if (error.message?.includes("price exceeds")) {
        errorMessage = "The price exceeds the maximum allowed resale price.";
      } else if (error.message?.includes("already listed")) {
        errorMessage = "This ticket is already listed for sale.";
      } else if (error.message?.includes("not the owner")) {
        errorMessage = "You are not the owner of this ticket.";
      } else if (error.message?.includes("revert")) {
        errorMessage = "Transaction reverted: The contract rejected this listing.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCancelListing = async (ticketId: number) => {
    if (!contractInstance || !account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing",
        description: "Cancelling listing...",
      });

      // Call this before listing or cancelling
      await debugContract();

      // Add gas limit and proper error handling
      const tx = await contractInstance.methods.cancelListing(ticketId).send({
        from: account,
        gas: 3000000  // Explicitly set high gas limit
      });
  
      console.log("Cancel listing transaction:", tx);
  
      toast({
        title: "Success",
        description: "Listing cancelled successfully!",
      });
      // Refresh tickets after cancelling
      fetchOwnedTickets();
    } catch (error) {
      console.error("Error cancelling listing:", error);
      
      // Provide more specific error messages based on the error
      let errorMessage = "Failed to cancel listing. Please try again.";
      
      if (error.message?.includes("not listed")) {
        errorMessage = "This ticket is not currently listed for sale.";
      } else if (error.message?.includes("not the owner")) {
        errorMessage = "You are not the owner of this ticket.";
      } else if (error.message?.includes("revert")) {
        errorMessage = "Transaction reverted: You might not have permission to cancel this listing.";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleBuyTicket = async (ticket: any) => {
    if (!contractInstance || !account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
  
    try {
      toast({
        title: "Processing",
        description: "Buying ticket...",
      });
  
      // Convert price to wei
      const priceInWei = Web3.utils.toWei(ticket.listingPrice, "ether");
      
      // Call the buyTicket function on the contract
      const tx = await contractInstance.methods.buyTicket(ticket.id).send({
        from: account,
        value: priceInWei,
        gas: 3000000
      });
  
      console.log("Buy ticket transaction:", tx);
  
      toast({
        title: "Success",
        description: "Ticket purchased successfully!",
      });
      
      // Refresh tickets after purchase
      await fetchOwnedTickets();
      await fetchListedTickets();
    } catch (error) {
      console.error("Error buying ticket:", error);
      
      let errorMessage = "Failed to buy ticket. Please try again.";
      
      if (error.message?.includes("insufficient funds")) {
        errorMessage = "You don't have enough ETH to buy this ticket.";
      } else if (error.message?.includes("revert")) {
        errorMessage = "Transaction failed: The ticket may no longer be available.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const openListDialog = (ticket: OwnedTicket) => {
    setSelectedTicket(ticket);
    setListDialogOpen(true);   
  };    

  useEffect(() => {
    // Make the debugging function available globally
    if (typeof window !== 'undefined') {
      (window as any).debugNFTContract = async () => {
        if (!contractInstance) {
          console.error("Contract not initialized");
          return;
        }
        
        try {
          console.log("Contract methods:", Object.keys(contractInstance.methods));
          
          // Check some specific methods
          const methods = [
            "showListedTickets",
            "getTicketOwners", 
            "getEventForTicket",
            "listTicket",
            "buyTicket"
          ];
          
          for (const method of methods) {
            console.log(`Method '${method}' exists:`, 
              contractInstance.methods[method] !== undefined);
          }
          
          // Get listed tickets
          const listed = await contractInstance.methods.showListedTickets().call();
          console.log("Listed tickets:", listed);
          
          if (listed.length > 0) {
            // Try to get details for the first listed ticket
            const tokenId = listed[0];
            const eventDetails = await contractInstance.methods.getEventForTicket(tokenId).call();
            console.log(`Event for ticket ${tokenId}:`, eventDetails);
            
            const owners = await contractInstance.methods.getTicketOwners(tokenId).call();
            console.log(`Owners for ticket ${tokenId}:`, owners);
          }
        } catch (error) {
          console.error("Debug error:", error);
        }
      };
    }
  }, [contractInstance]);

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
          
          {isConnected && (
            <Button 
              variant="outline" 
              className="mt-4 md:mt-0" 
              onClick={() => fetchOwnedTickets()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh Tickets"}
            </Button>
          )}
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
                        src={ticket.image || `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(ticket.eventName)}`}
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
                          disabled={true}
                        >
                          Already Listed ({ticket.listingPrice} ETH)
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

        {isConnected && (
          <section className="mt-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Marketplace <span className="text-gradient">Listings</span>
              </h2>
              
              <Button 
                variant="outline" 
                className="mt-4 md:mt-0" 
                onClick={() => fetchListedTickets()}
                disabled={marketplaceLoading}
              >
                {marketplaceLoading ? "Loading..." : "Refresh Listings"}
              </Button>
            </div>
            
            {marketplaceLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(2)
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
            ) : marketplaceTickets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceTickets.map((ticket, index) => (
                  <motion.div
                    key={`marketplace-${ticket.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={ticket.image || `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(ticket.eventName || "Unknown Event")}`}
                          alt={ticket.eventName || "Unknown Event"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          For Sale
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle>{ticket.eventName || "Unknown Event"}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pb-4">
                        <div className="flex items-center text-zinc-400">
                          <Ticket className="h-4 w-4 mr-2" />
                          <span>Ticket #{ticket.id}</span>
                        </div>
                        <div className="flex items-center text-zinc-400">
                          <Tag className="h-4 w-4 mr-2" />
                          <span>Listed for {ticket.listingPrice} ETH</span>
                        </div>
                        <div className="flex items-center text-zinc-400">
                          <div className="h-4 w-4 mr-2" />
                          <span>Original price: {ticket.originalPrice} ETH</span>
                        </div>
                        {ticket.seller && (
                          <div className="flex items-center text-zinc-400">
                            <div className="h-4 w-4 mr-2" />
                            <span className="truncate w-full">Seller: {ticket.seller}</span>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        {ticket.seller && ticket.seller.toLowerCase() === account?.toLowerCase() ? (
                          <Button
                            variant="outline"
                            className="w-full border-purple-500/20 text-white hover:bg-purple-500/10"
                            disabled={true}
                          >
                            Your Listing
                          </Button>
                        ) : (
                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            onClick={() => handleBuyTicket(ticket)}
                          >
                            Buy Ticket
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm p-8 text-center">
                <CardContent className="space-y-4">
                  <Tag className="h-16 w-16 mx-auto text-zinc-600" />
                  <h2 className="text-xl font-semibold">No Tickets Listed</h2>
                  <p className="text-zinc-400">There are currently no tickets listed for sale on the marketplace.</p>
                </CardContent>
              </Card>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
