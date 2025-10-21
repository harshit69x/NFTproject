"use client";

import dynamic from "next/dynamic";
import React from "react";

// Create a client-only version of Web3Provider to prevent hydration issues
const Web3ProviderClient = dynamic(
  () => import("./web3-provider").then((mod) => mod.Web3Provider),
  {
    ssr: false,
    loading: () => <div>Loading Web3...</div>,
  }
);

export function Web3ProviderWrapper({ children }: { children: React.ReactNode }) {
  return <Web3ProviderClient>{children}</Web3ProviderClient>;
}