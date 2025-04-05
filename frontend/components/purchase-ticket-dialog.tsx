"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Ticket, Calendar, MapPin, CreditCard, Check, Loader2 } from "lucide-react"
import { useWeb3 } from "@/components/web3-provider"

type Event = {
  id: number
  name: string
  originalPrice: string
  maxResalePrice: string
  royaltyPercentage: number
  active: boolean
  organizer: string
  eventURI: string
}

type PurchaseTicketDialogProps = {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
  onPurchase: (eventId: number, price: string) => void
}

export function PurchaseTicketDialog({ event, open, onOpenChange, onPurchase }: PurchaseTicketDialogProps) {
  const { account } = useWeb3()
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handlePurchase = async () => {
    setIsProcessing(true)

    try {
      await onPurchase(event.id, event.originalPrice)
      setIsProcessing(false)
      setIsComplete(true)
      setStep(3)
    } catch (error) {
      setIsProcessing(false)
      console.error("Purchase error:", error)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after dialog closes
    setTimeout(() => {
      setStep(1)
      setIsComplete(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border border-purple-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl">Purchase Ticket</DialogTitle>
          <DialogDescription>
            {step === 1 && "Review the details of your ticket purchase"}
            {step === 2 && "Confirm your purchase and complete the transaction"}
            {step === 3 && "Your ticket has been successfully purchased!"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
              <h3 className="text-xl font-semibold">{event.name}</h3>

              <div className="flex items-center text-zinc-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Coming Soon</span>
              </div>

              <div className="flex items-center text-zinc-400">
                <MapPin className="h-4 w-4 mr-2" />
                <span>Virtual Event</span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm text-zinc-400">Price</p>
                  <p className="text-2xl font-bold">{event.originalPrice} ETH</p>
                  <p className="text-xs text-zinc-500">
                    ≈ ${(Number.parseFloat(event.originalPrice) * 3500).toFixed(2)} USD
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-400">Ticket Type</p>
                  <p className="text-lg font-medium">General Admission</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">What you get:</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  <span>NFT ticket with proof of ownership on the blockchain</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  <span>Ability to resell your ticket on the marketplace</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  <span>Secure and transparent transaction</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Transaction Summary</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Ticket Price</span>
                  <span>{event.originalPrice} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Gas Fee (est.)</span>
                  <span>0.0005 ETH</span>
                </div>
                <div className="border-t border-zinc-700 my-2 pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{(Number.parseFloat(event.originalPrice) + 0.0005).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-sm text-zinc-400">Ethereum Wallet</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium truncate w-28">
                    {account?.substring(0, 6)}...{account?.substring(38)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 py-4 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Purchase Complete!</h3>
              <p className="text-zinc-400 mt-2">Your NFT ticket has been minted and added to your wallet.</p>
            </div>

            <div className="bg-zinc-800 rounded-lg p-4 text-left">
              <h4 className="font-medium mb-2">Ticket Details:</h4>
              <p className="text-zinc-400">Event: {event.name}</p>
              <p className="text-zinc-400">Price: {event.originalPrice} ETH</p>
              <p className="text-zinc-400">
                Owner: {account?.substring(0, 6)}...{account?.substring(38)}
              </p>
            </div>

            <p className="text-sm text-zinc-400">
              You can view your ticket in the "My Tickets" section of your profile.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => setStep(2)}
            >
              Continue to Payment
            </Button>
          )}

          {step === 2 && (
            <div className="flex w-full gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isProcessing}>
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handlePurchase}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ticket className="mr-2 h-4 w-4" />
                    Confirm Purchase
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 3 && (
            <Button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={handleClose}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

