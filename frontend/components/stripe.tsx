"use client"

import type React from "react"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useEffect, useState } from "react"

// Use a placeholder key for development
const stripePromise = loadStripe("pk_test_placeholder")

export function Stripe({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <Elements stripe={stripePromise}>{children}</Elements>
}

