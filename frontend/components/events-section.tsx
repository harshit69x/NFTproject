"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useWeb3 } from "@/components/web3-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Ticket, CalendarPlus } from "lucide-react";
import Web3 from "web3";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PurchaseTicketDialog } from "@/components/purchase-ticket-dialog";
import getContractInstance from "./okay"; // Updated import

type Event = {
  id: number;
  name: string;
  originalPrice: string;
  maxResalePrice: string;
  royaltyPercentage: number;
  active: boolean;
  organizer: string;
  eventURI: string;
};

export function EventsSection() {
  const { contract, account, isConnected, web3 } = useWeb3();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    maxResalePrice: "",
    royaltyPercentage: "",
    eventURI: "",
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Get the contract instance
      const instance = await getContractInstance();

      // Fetch events from the smart contract
      const eventsData = await instance.methods.showEvents().call({
        from: "0x6fF6e707315611EA7d64Aaa362b8887af7316317", // Replace with the correct address
      });

      // Transform the data into the Event type
      const formattedEvents = eventsData.map((event: any, index: number) => ({
        id: index + 1, // Assign a unique ID
        name: event.name,
        originalPrice: Web3.utils.fromWei(event.originalPrice, "ether"), // Convert price from Wei to Ether
        maxResalePrice: Web3.utils.fromWei(event.maxResalePrice, "ether"), // Convert max resale price from Wei to Ether
        royaltyPercentage: parseInt(event.royaltyPercentage, 10),
        active: event.active,
        organizer: event.organizer,
        eventURI: event.eventURI,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract || !account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { name, price, maxResalePrice, royaltyPercentage, eventURI } = formData;

      // Convert prices to Wei
      const priceInWei = web3.utils.toWei(price, "ether");
      const maxResalePriceInWei = web3.utils.toWei(maxResalePrice, "ether");

      const tx = await contract.methods
        .createEvent(name, priceInWei, maxResalePriceInWei, royaltyPercentage, eventURI)
        .send({ from: account });

      toast({
        title: "Creating event",
        description: "Please wait while your transaction is being processed",
      });

      await tx;

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      setCreateDialogOpen(false);
      fetchEvents();

      // Reset form
      setFormData({
        name: "",
        price: "",
        maxResalePrice: "",
        royaltyPercentage: "",
        eventURI: "",
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMintTicket = async (eventId: number, price: string) => {
    if (!contract || !account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const priceInWei = web3.utils.toWei(price, "ether");
      const tx = await contract.methods.mintTicket(eventId).send({
        from: account,
        value: priceInWei,
      });

      toast({
        title: "Minting ticket",
        description: "Please wait while your transaction is being processed",
      });

      await tx;

      toast({
        title: "Success",
        description: "Ticket minted successfully!",
      });
    } catch (error) {
      console.error("Error minting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to mint ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openPurchaseDialog = (event: Event) => {
    setSelectedEvent(event);
    setPurchaseDialogOpen(true);
  };

  const eventCards = [
    {
      id: 1,
      name: "Summer Music Festival",
      date: "July 15-17, 2023",
      location: "Central Park, NY",
      price: "0.05",
      image: "/placeholder.svg?height=400&width=600",
      featured: true,
      remaining: 42,
    },
    {
      id: 2,
      name: "Tech Conference 2023",
      date: "August 10-12, 2023",
      location: "Convention Center, SF",
      price: "0.08",
      image: "/placeholder.svg?height=400&width=600",
      featured: false,
      remaining: 156,
    },
    {
      id: 3,
      name: "Art Exhibition",
      date: "September 5, 2023",
      location: "Modern Art Museum, LA",
      price: "0.03",
      image: "/placeholder.svg?height=400&width=600",
      featured: false,
      remaining: 89,
    },
  ];

  return (
    <section id="events" className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black/50 to-black pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Upcoming <span className="text-gradient">Events</span>
            </h2>
            <p className="text-zinc-400 max-w-[600px]">
              Discover and purchase tickets for the hottest events. All tickets are minted as NFTs for secure ownership
              and easy transfers.
            </p>
          </motion.div>

          {isConnected && (
            <Link href="/host-event" passHref>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Host an Event
              </Button>
            </Link>
          )}
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3)
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
                ))
            : events.length > 0
              ? events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={`/placeholder.svg?height=400&width=600&text=${encodeURIComponent(event.name)}`}
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle>{event.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pb-4">
                        <div className="flex items-center text-zinc-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Coming Soon</span>
                        </div>
                        <div className="flex items-center text-zinc-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>Virtual Event</span>
                        </div>
                        <div className="flex items-center text-zinc-400">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>TBA</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-400">Price</p>
                            <p className="text-xl font-bold">{event.originalPrice} ETH</p>
                          </div>
                          <div>
                            <p className="text-sm text-zinc-400">Max Resale</p>
                            <p className="text-lg font-medium">{event.maxResalePrice} ETH</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-semibold py-6 shadow-lg shadow-purple-700/20 group-hover:shadow-purple-700/40 transition-all"
                          onClick={() => openPurchaseDialog(event)}
                          disabled={!isConnected}
                        >
                          <Ticket className="mr-2 h-5 w-5" />
                          {isConnected ? "Buy Ticket" : "Connect Wallet to Buy"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))
              : // Fallback to sample events if no events from contract
                eventCards.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden bg-zinc-900/50 border border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group relative">
                      {event.featured && (
                        <div className="absolute top-4 left-0 z-10">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 rounded-l-none rounded-r-full px-4 py-1 text-xs font-semibold">
                            Featured Event
                          </Badge>
                        </div>
                      )}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.image || "/placeholder.svg"}
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle>{event.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 pb-4">
                        <div className="flex items-center text-zinc-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center text-zinc-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{event.location}</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-400">Price</p>
                            <p className="text-xl font-bold">{event.price} ETH</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="border-green-500/30 text-green-400">
                              {event.remaining} tickets left
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg font-semibold py-6 shadow-lg shadow-purple-700/20 group-hover:shadow-purple-700/40 transition-all"
                          onClick={() =>
                            openPurchaseDialog({
                              id: event.id,
                              name: event.name,
                              originalPrice: event.price,
                              maxResalePrice: (Number.parseFloat(event.price) * 1.5).toString(),
                              royaltyPercentage: 10,
                              active: true,
                              organizer: "0x1234...5678",
                              eventURI: "",
                            })
                          }
                          disabled={!isConnected}
                        >
                          <Ticket className="mr-2 h-5 w-5" />
                          {isConnected ? "Buy Ticket" : "Connect Wallet to Buy"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
        </div>
      </div>

      {/* Purchase Ticket Dialog */}
      {selectedEvent && (
        <PurchaseTicketDialog
          event={selectedEvent}
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          onPurchase={(eventId, price) => handleMintTicket(eventId, price)}
        />
      )}
    </section>
  );
}

