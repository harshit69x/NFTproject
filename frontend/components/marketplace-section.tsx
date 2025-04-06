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
import Web3 from "web3" // Change from ethers to Web3

type ListedTicket = {
  id: number
  eventId: number
  eventName: string
  price: string
  seller: string
}

// Export a function to properly fetch listed tickets
const fetchListedTickets = async (contract, web3, toast) => {
  try {
    console.log("Fetching listed tickets...");
    
    if (!contract || !web3) {
      console.log("Contract or web3 not initialized");
      return [];
    }
    
    // Get all listed ticket IDs
    const listedTicketIds = await contract.methods.showListedTickets().call();
    console.log("Listed ticket IDs:", listedTicketIds);
    
    if (!listedTicketIds || listedTicketIds.length === 0) {
      console.log("No tickets are currently listed");
      return [];
    }

    // Safely convert Wei to Ether
    const safeFromWei = (weiValue) => {
      try {
        const valueStr = String(weiValue || '0');
        return web3.utils.fromWei(valueStr, 'ether');
      } catch (error) {
        console.error('Error converting from Wei:', error);
        return '0';
      }
    };

    // Fetch details for each listed ticket
    const ticketsData = await Promise.all(
      listedTicketIds.map(async (id) => {
        const tokenId = parseInt(id);
        try {
          // Get ticket data
          const ticketData = await contract.methods.tickets(tokenId).call();
          
          // Skip invalid tickets
          if (!ticketData || !ticketData.eventId) {
            console.warn(`Invalid ticket data for ID ${tokenId}`);
            return null;
          }
          
          // Get event data
          const eventData = await contract.methods.events(ticketData.eventId).call();
          
          // Skip invalid events
          if (!eventData || !eventData.name) {
            console.warn(`Invalid event data for event ID ${ticketData.eventId}`);
            return null;
          }
          
          // Get owners list
          const owners = await contract.methods.getTicketOwners(tokenId).call();
          
          // Find the current owner who has listed the ticket
          const currentOwner = owners.find((owner) => owner.forSale);
          
          if (!currentOwner) {
            console.warn(`No listed owner found for ticket ${tokenId}`);
            return null;
          }
          
          // Return formatted ticket data
          return {
            id: tokenId,
            eventId: parseInt(ticketData.eventId),
            eventName: eventData.name,
            price: safeFromWei(currentOwner.price),
            seller: currentOwner.owner,
            maxResalePrice: safeFromWei(eventData.maxResalePrice),
            originalPrice: safeFromWei(ticketData.originalPrice),
          };
        } catch (error) {
          console.error(`Error fetching data for ticket ${tokenId}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    return ticketsData.filter(ticket => ticket !== null);
  } catch (error) {
    console.error("Error in fetchListedTickets:", error);
    if (toast) {
      toast({
        title: "Error",
        description: "Failed to fetch listed tickets. Please try again.",
        variant: "destructive",
      });
    }
    return [];
  }
};

export function MarketplaceSection() {
  const { contract, account, isConnected, web3 } = useWeb3()
  const [listedTickets, setListedTickets] = useState<ListedTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null)
  const [listPrice, setListPrice] = useState("")
  const { toast } = useToast()

  const [selectedTicketDetails, setSelectedTicketDetails] = useState<{
    maxResalePrice?: string;
    originalPrice?: string;
    eventId?: number;
  }>({});

  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })

  useEffect(() => {
    if (contract) {
      fetchListedTickets()
    }
  }, [contract])

  const checkTicketOwnership = async (ticketId: number): Promise<boolean> => {
    if (!contract || !account) return false;
    
    try {
      console.log(`Checking ownership of ticket ${ticketId} for account ${account}`);
      
      // Use direct ERC721 ownerOf call first (most accurate)
      try {
        const owner = await contract.methods.ownerOf(ticketId).call();
        if (owner.toLowerCase() === account.toLowerCase()) {
          console.log("User is confirmed owner via ERC721 ownerOf");
          return true;
        }
      } catch (error) {
        console.error("Error in ownerOf check:", error);
      }
      
      // Fallback to checking the owners array
      try {
        const owners = await contract.methods.getTicketOwners(ticketId).call();
        const isOwner = owners.some((ownerData: any) => 
          ownerData.owner.toLowerCase() === account.toLowerCase()
        );
        
        if (isOwner) {
          console.log("User is confirmed owner via getTicketOwners");
          return true;
        }
      } catch (error) {
        console.error("Error checking ticket owners array:", error);
      }
      
      return false;
    } catch (error) {
      console.error("Error in ownership check:", error);
      return false;
    }
  };

  // Add this function to handle numeric conversion safely
  const safeFromWei = (weiValue: any): string => {
    try {
      // Make sure the input is a valid string first
      const valueStr = String(weiValue || '0');
      return web3?.utils.fromWei(valueStr, 'ether') || '0';
    } catch (error) {
      console.error('Error converting from Wei:', error);
      return '0';
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    if (!contract || !web3) return;
    
    try {
      console.log(`Fetching details for ticket ID: ${ticketId}`);
      
      // Get ticket data
      const ticketData = await contract.methods.tickets(ticketId).call();
      console.log('Ticket data received:', ticketData);
      
      if (!ticketData || !ticketData.eventId) {
        toast({
          title: "Invalid Ticket",
          description: "This ticket does not exist.",
          variant: "destructive",
        });
        return;
      }
      
      // Get event data to check max resale price
      const eventId = parseInt(ticketData.eventId);
      console.log(`Getting event data for event ID: ${eventId}`);
      
      const eventData = await contract.methods.events(eventId).call();
      console.log('Event data received:', eventData);
      
      // Use the safe conversion function
      const maxResalePrice = safeFromWei(eventData.maxResalePrice);
      const originalPrice = safeFromWei(ticketData.originalPrice);
      
      setSelectedTicketDetails({
        maxResalePrice,
        originalPrice,
        eventId
      });
      
      console.log("Ticket details loaded:", {
        maxResalePrice,
        originalPrice,
        eventId
      });
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      toast({
        title: "Error",
        description: "Could not fetch ticket details.",
        variant: "destructive",
      });
    }
  };
  
  // Update when ticket ID changes
  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails(selectedTicket);
    } else {
      setSelectedTicketDetails({});
    }
  }, [selectedTicket, contract, web3]);

  const handleListTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract || !account || selectedTicket === null || !web3) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Check max resale price
    const maxResalePrice = selectedTicketDetails.maxResalePrice;
    if (maxResalePrice) {
      const priceValue = parseFloat(listPrice);
      const maxValue = parseFloat(maxResalePrice);
      
      if (priceValue > maxValue) {
        toast({
          title: "Price Error",
          description: `Price cannot exceed maximum resale price of ${maxResalePrice} ETH`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Convert from string to wei with safety checks
      let priceInWei;
      try {
        priceInWei = web3.utils.toWei(listPrice.toString(), "ether");
      } catch (error) {
        console.error("Error converting to Wei:", error);
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`Attempting to list ticket #${selectedTicket} for ${priceInWei} wei`);
      
      // Get gas estimate first - use try/catch specifically for this operation
      let gasEstimate;
      try {
        gasEstimate = await contract.methods
          .listTicket(selectedTicket, priceInWei)
          .estimateGas({ from: account });
        
        console.log(`Gas estimate: ${gasEstimate}`);
      } catch (error) {
        console.error("Gas estimation failed:", error);
        let errorMessage = "Failed to estimate gas. The transaction might fail.";
        
        // Check for specific error messages
        if (error.message && error.message.includes("max resale value")) {
          errorMessage = "Price exceeds maximum resale value for this ticket.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
      
      // Send transaction using web3 syntax
      console.log("Sending transaction with params:", { 
        selectedTicket, 
        priceInWei, 
        from: account,
        gas: Number(gasEstimate) + 100000
      });
      
      const tx = await contract.methods
        .listTicket(selectedTicket, priceInWei)
        .send({
          from: account,
          gas: Number(gasEstimate) + 100000, // Add buffer to gas estimate
        });

      toast({
        title: "Listing ticket",
        description: "Please wait while your transaction is being processed",
      });

      console.log("Transaction successful:", tx);

      toast({
        title: "Success",
        description: "Ticket listed successfully!",
      });

      setListDialogOpen(false);
      refreshListedTickets();
      setListPrice("");
    } catch (error) {
      console.error("Error listing ticket:", error);
      // Extract useful error message if possible
      let errorMsg = "Failed to list ticket. Please try again.";
      if (error.message) {
        if (error.message.includes("max resale value")) {
          errorMsg = "Price exceeds maximum resale value.";
        } else if (error.message.includes("not owner")) {
          errorMsg = "You do not own this ticket.";
        } else if (error.message.includes("already listed")) {
          errorMsg = "This ticket is already listed for sale.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleBuyTicket = async (tokenId: number, price: string) => {
    if (!contract || !account || !web3) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert from ethers to web3
      const priceInWei = web3.utils.toWei(price, "ether")
      
      // Implementation for buyTicket with web3
      const tx = await contract.methods.buyTicket(tokenId).send({
        from: account,
        value: priceInWei,
        gas: 1000000 // Estimate gas for buying a ticket
      })

      toast({
        title: "Buying ticket",
        description: "Please wait while your transaction is being processed",
      })

      console.log("Purchase transaction:", tx)

      toast({
        title: "Success",
        description: "Ticket purchased successfully!",
      })

      refreshListedTickets()
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

   // Add this helper function to safely interact with contract data
  const safeContractCall = async (method, fallbackValue = null) => {
    try {
      return await method();
    } catch (error) {
      console.error(`Contract call failed: ${error.message || 'Unknown error'}`);
      return fallbackValue;
    }
  };

  const refreshListedTickets = async () => {
    try {
      setLoading(true);
      
      if (!contract || !web3) {
        console.log("Contract or web3 not initialized");
        setLoading(false);
        return;
      }
      
      console.log("Fetching listed tickets...");
      
      // Safely get the listed ticket IDs
      const listedTicketIds = await safeContractCall(
        () => contract.methods.showListedTickets().call(),
        []
      );
      
      console.log("Listed ticket IDs:", listedTicketIds);
      
      if (!listedTicketIds || listedTicketIds.length === 0) {
        console.log("No tickets are currently listed");
        setListedTickets([]);
        setLoading(false);
        return;
      }

      // Process each ticket one by one to avoid batch errors
      const processedTickets: ListedTicket[] = [];
      
      for (const id of listedTicketIds) {
        try {
          const tokenId = parseInt(id);
          console.log(`Processing ticket ${tokenId}...`);
          
          // Get ticket data with error handling
          const ticketData = await safeContractCall(
            () => contract.methods.tickets(tokenId).call()
          );
          
          if (!ticketData || !ticketData.eventId) {
            console.warn(`Invalid ticket data for ID ${tokenId}`);
            continue;
          }
          
          // Get event data with error handling
          const eventId = parseInt(ticketData.eventId);
          const eventData = await safeContractCall(
            () => contract.methods.events(eventId).call()
          );
          
          if (!eventData || !eventData.name) {
            console.warn(`Invalid event data for ID ${eventId}`);
            continue;
          }
          
          // Get owners with error handling
          const owners = await safeContractCall(
            () => contract.methods.getTicketOwners(tokenId).call(),
            []
          );
          
          // Find the current owner who has listed the ticket
          const currentOwner = owners.find((owner: any) => owner.forSale);
          
          if (!currentOwner) {
            console.warn(`No listed owner found for ticket ${tokenId}`);
            continue;
          }
          
          // Add to processed tickets
          processedTickets.push({
            id: tokenId,
            eventId: eventId,
            eventName: eventData.name,
            price: safeFromWei(currentOwner.price),
            seller: currentOwner.owner,
          });
          
          console.log(`Successfully processed ticket ${tokenId}`);
        } catch (error) {
          console.error(`Failed to process ticket ${id}: ${error.message || 'Unknown error'}`);
        }
      }
      
      console.log(`Found ${processedTickets.length} valid tickets`);
      setListedTickets(processedTickets);
    } catch (error) {
      console.error("Error fetching listed tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch listed tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the useEffect to use the new function
  useEffect(() => {
    if (contract && web3) {
      refreshListedTickets();
      
      // Set up event listener for new listings
      if (contract.events) {
        const ticketListedListener = contract.events.TicketListed({
          fromBlock: 'latest'
        }, (error: any, event: any) => {
          if (error) {
            console.error("Error listening to TicketListed:", error);
          } else {
            console.log("Ticket listed event detected:", event.returnValues);
            refreshListedTickets();
          }
        });
        
        // Clean up listener on unmount
        return () => {
          if (ticketListedListener && ticketListedListener.unsubscribe) {
            ticketListedListener.unsubscribe();
          }
        };
      }
    }
  }, [contract, web3]);

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
                    {selectedTicketDetails.maxResalePrice && (
                      <p className="text-xs text-amber-400">
                        Maximum resale price: {selectedTicketDetails.maxResalePrice} ETH
                      </p>
                    )}
                    {selectedTicketDetails.originalPrice && (
                      <p className="text-xs text-zinc-400">
                        Original price: {selectedTicketDetails.originalPrice} ETH
                      </p>
                    )}
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
              : sampleTickets.map((ticket, index) => (
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

