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
import getContractInstance from "@/components/okay"; // Correct import

export default function HostEventPage() {
  const { account } = useWeb3();
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Get the contract instance dynamically
      const instance = await getContractInstance();

      // Convert prices to Wei
      const priceInWei = Web3.utils.toWei(formData.price, "ether");
      const maxResalePriceInWei = Web3.utils.toWei(formData.maxResalePrice, "ether");

      // Call the createEvent method
      const gasEstimate = await instance.methods
        .createEvent(formData.name, priceInWei, maxResalePriceInWei, formData.royaltyPercentage, formData.eventURI || "")
        .estimateGas({ from: account });

      const tx = await instance.methods
        .createEvent(formData.name, priceInWei, maxResalePriceInWei, formData.royaltyPercentage, formData.eventURI || "")
        .send({
          from: account,
          gas: Number(gasEstimate) + 100000, // Add buffer to gas estimate
        });

      toast({
        title: "Creating event",
        description: "Please wait while your transaction is being processed",
      });

      await tx;

      toast({
        title: "Success",
        description: "Event created successfully!",
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
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