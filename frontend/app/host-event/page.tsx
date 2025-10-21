"use client";

import React, { useState } from "react";
import Web3 from "web3"; // Import Web3
import { useWeb3 } from "@/components/web3-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, Loader2 } from "lucide-react";

export default function HostEventPage() {
  const { account, web3, contract } = useWeb3();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    maxResalePrice: "",
    royaltyPercentage: "10",
    eventURI: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkMetaMaskConnection = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this dApp",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if MetaMask is connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        toast({
          title: "MetaMask Not Connected", 
          description: "Please connect your MetaMask wallet",
          variant: "destructive",
        });
        return false;
      }

      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as unknown as string;
      if (parseInt(chainId, 16) !== 11155111) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Sepolia testnet in MetaMask",
          variant: "destructive", 
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("MetaMask connection check failed:", error);
      return false;
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account || !web3 || !contract) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Check MetaMask connection before proceeding
    const isConnected = await checkMetaMaskConnection();
    if (!isConnected) {
      return;
    }

    try {
      setIsSubmitting(true);

      toast({
        title: "Creating event",
        description: "Please confirm the transaction in your wallet",
      });

      // Convert prices to Wei (the contract expects Wei values, not ETH)
      const priceInWei = web3.utils.toWei(formData.price, "ether");
      const maxResalePriceInWei = web3.utils.toWei(formData.maxResalePrice, "ether");
      
      console.log("Price in Wei:", priceInWei);
      console.log("Max resale price in Wei:", maxResalePriceInWei);
      
      // Estimate gas before sending transaction
      const gasEstimate = await contract.methods
        .createEvent(
          formData.name, 
          priceInWei,
          maxResalePriceInWei,
          parseInt(formData.royaltyPercentage), 
          formData.eventURI || ""
        )
        .estimateGas({ from: account });
      
      console.log("Estimated gas:", gasEstimate);
      
      // Add 20% buffer to gas estimate
      const gasLimit = Math.floor(Number(gasEstimate) * 1.2);
      
      const tx = await contract.methods
        .createEvent(
          formData.name, 
          priceInWei, // Pass Wei values directly
          maxResalePriceInWei, // Pass Wei values directly
          parseInt(formData.royaltyPercentage), 
          formData.eventURI || ""
        )
        .send({
          from: account,
          gas: gasLimit,
        });

      // Extract event data from transaction receipt
      const eventData = tx.events.EventCreated.returnValues;
      
      console.log("✅ Event created:", eventData);

      toast({
        title: "Success",
        description: `Event "${eventData.name}" created with ID: ${eventData.eventId}`,
      });

      // Show more detailed success message
      toast({
        title: "Event Details", 
        description: `Price: ${web3.utils.fromWei(eventData.price, "ether")} ETH`,
      });

      setIsSuccess(true);
      
      // Reset form after successful creation
      setFormData({
        name: "",
        price: "",
        maxResalePrice: "",
        royaltyPercentage: "10",
        eventURI: "",
      });
    } catch (error: any) {
      console.error("Error creating event:", error);
      
      // Handle specific MetaMask errors
      if (error.message?.includes("circuit breaker")) {
        toast({
          title: "MetaMask Circuit Breaker",
          description: "MetaMask blocked the request. Try resetting your MetaMask account in Settings → Advanced → Reset Account.",
          variant: "destructive",
        });
      } else if (error.message?.includes("User denied")) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the transaction.",
          variant: "destructive",
        });
      } else if (error.message?.includes("insufficient funds")) {
        toast({
          title: "Insufficient Funds", 
          description: "You don't have enough ETH to complete this transaction.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Transaction Failed",
          description: `Error: ${error.message || "Unknown error occurred"}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-purple-950 py-12">
      <div className="container px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-8">Host an Event</h1>
        <form onSubmit={handleCreateEvent} className="space-y-6">
          <div>
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g. Summer Music Festival"
            />
          </div>
          <div>
            <Label htmlFor="price">Ticket Price (ETH)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              required
              placeholder="e.g. 0.05"
            />
          </div>
          <div>
            <Label htmlFor="maxResalePrice">Max Resale Price (ETH)</Label>
            <Input
              id="maxResalePrice"
              name="maxResalePrice"
              type="number"
              step="0.01"
              value={formData.maxResalePrice}
              onChange={handleInputChange}
              required
              placeholder="e.g. 0.1"
            />
          </div>
          <div>
            <Label htmlFor="royaltyPercentage">Royalty Percentage (%)</Label>
            <Input
              id="royaltyPercentage"
              name="royaltyPercentage"
              type="number"
              max="25"
              value={formData.royaltyPercentage}
              onChange={handleInputChange}
              required
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <Label htmlFor="eventURI">Event URI (Optional)</Label>
            <Textarea
              id="eventURI"
              name="eventURI"
              value={formData.eventURI}
              onChange={handleInputChange}
              placeholder="e.g. ipfs://QmExample123456789"
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <CalendarPlus className="mr-2 h-5 w-5" />
                Create Event
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}