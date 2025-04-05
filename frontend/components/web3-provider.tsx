"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Web3 from "web3";
import { useToast } from "@/hooks/use-toast";
import TicketNFTAbi from "@/contracts/TicketNFT.json";

// Add this near the top of your file
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (event: string) => void;
    };
  }
}

type Web3ContextType = {
  account: string | null;
  displayAddress: string | null;
  contract: any | null;
  web3: Web3 | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
};

const Web3Context = createContext<Web3ContextType>({
  account: null,
  displayAddress: null,
  contract: null,
  web3: null,
  connectWallet: async () => {},
  isConnected: false,
  isLoading: false,
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Helper function to format wallet address
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const contractAddress = "0x9cbF13f1b40b27eD6623948F60BA175b185C263C"; // Replace with your contract address
  const requiredChainId = 5777; // Replace with your network's chain ID (e.g., 1337 for Ganache)

  const connectWallet = async () => {
    try {
      setIsLoading(true);

      let web3Instance: Web3;

      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
        // MetaMask is available
        console.log("MetaMask detected. Requesting account access...");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        web3Instance = new Web3(window.ethereum);
        console.log("Web3 initialized with MetaMask:", web3Instance);
      } else {
        // MetaMask is not available, fallback to Infura or another provider
        console.log("MetaMask not detected. Using fallback provider...");
        const provider = new Web3.providers.HttpProvider(
          "https://sepolia.infura.io/v3/35605c388dd44b6fbc84f4d829ba1732"
        );
        web3Instance = new Web3(provider);
        console.log("Web3 initialized with fallback provider:", web3Instance);
      }

      setWeb3(web3Instance);

      // Get accounts
      const accounts = await web3Instance.eth.getAccounts();
      if (accounts.length === 0) {
        toast({
          title: "No accounts found",
          description: "Please connect your wallet to MetaMask.",
          variant: "destructive",
        });
        return;
      }

      const userAccount = accounts[0];
      console.log("Connected account:", userAccount);
      
      // Format the address for display
      const formattedAddress = formatAddress(userAccount);
      setDisplayAddress(formattedAddress);

      // Check network
      const networkId = await web3Instance.eth.net.getId();
      if (networkId !== requiredChainId) {
        toast({
          title: "Wrong network",
          description: `Please switch to the correct network (Chain ID: ${requiredChainId}).`,
          variant: "destructive",
        });
        return;
      }

      // Initialize contract
      const ticketContract = new web3Instance.eth.Contract(TicketNFTAbi.abi, contractAddress);
      console.log("Contract initialized:", ticketContract);

      setAccount(userAccount);
      setContract(ticketContract);

      toast({
        title: "Wallet connected",
        description: `Connected to ${formattedAddress}`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const web3Instance = new Web3(window.ethereum);
          const accounts = await web3Instance.eth.getAccounts();

          if (accounts.length > 0) {
            const userAccount = accounts[0];
            const formattedAddress = formatAddress(userAccount);
            const ticketContract = new web3Instance.eth.Contract(TicketNFTAbi.abi, contractAddress);

            setAccount(userAccount);
            setDisplayAddress(formattedAddress);
            setWeb3(web3Instance);
            setContract(ticketContract);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setDisplayAddress(formatAddress(accounts[0]));
        } else {
          setAccount(null);
          setDisplayAddress(null);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload(); // Reload the page when the network changes
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        displayAddress,
        contract,
        web3,
        connectWallet,
        isConnected: !!account,
        isLoading,
      }}
    >
      {children}
      {/* Display the connected wallet address */}
      {displayAddress && (
        <div className="text-xs text-gray-500 mt-1">
          <strong>Wallet connected:</strong> {displayAddress}
        </div>
      )}
    </Web3Context.Provider>
  );
}

