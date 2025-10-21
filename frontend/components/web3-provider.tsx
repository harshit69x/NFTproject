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

    const contractAddress = "0xa76D945e17BaD6668681aFbC8576b6Cd44009C65";
  const requiredChainId = 11155111; // Sepolia chain ID

  const connectWallet = async () => {
    try {
      setIsLoading(true);

      let web3Instance: Web3;

      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
        // MetaMask is available
        console.log("MetaMask detected. Requesting account access...");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        web3Instance = new Web3(window.ethereum as any);
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
      const chainId = await web3Instance.eth.getChainId();
      if (Number(chainId) !== requiredChainId) {
        toast({
          title: "Wrong network",
          description: `Please switch to Sepolia (Chain ID: ${requiredChainId}) in MetaMask.`,
          variant: "destructive",
        });
        return;
      }

      // Initialize contract
      const ticketContract = new web3Instance.eth.Contract(
        TicketNFTAbi.abi as any,
        contractAddress
      );
      
      // Set default account for transactions
      web3Instance.eth.defaultAccount = userAccount;
      console.log("Contract initialized:", ticketContract);

      setAccount(userAccount);
      setContract(ticketContract);

      toast({
        title: "Wallet connected ",
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
      // Only run on client side to avoid hydration issues
      if (typeof window === "undefined") return;
      
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum as any);
          
          // Check if already connected
          const accounts = await web3Instance.eth.getAccounts();
          
          if (accounts.length > 0) {
            // Check if we're on the correct network
            const chainId = await web3Instance.eth.getChainId();
            
            if (Number(chainId) === requiredChainId) {
              const userAccount = accounts[0];
              const formattedAddress = formatAddress(userAccount);
              const ticketContract = new web3Instance.eth.Contract(
                TicketNFTAbi.abi as any, 
                contractAddress
              );

              setAccount(userAccount);
              setDisplayAddress(formattedAddress);
              setWeb3(web3Instance);
              setContract(ticketContract);
              
              console.log("Auto-connected to Sepolia with account:", userAccount);
            } else {
              console.log("Connected to wrong network. Current chain ID:", chainId, "Required:", requiredChainId);
              // Don't show toast immediately on page load to avoid hydration issues
              setTimeout(() => {
                toast({
                  title: "Wrong network",
                  description: `Please switch to Sepolia (Chain ID: ${requiredChainId}) in MetaMask.`,
                  variant: "destructive",
                });
              }, 1000);
            }
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      } else {
        console.log("MetaMask not detected. Please install MetaMask to use this dApp.");
      }
    };

    // Delay the connection check slightly
    const timer = setTimeout(checkConnection, 100);
    
    // Set up event listeners only on client side
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setDisplayAddress(formatAddress(accounts[0]));
        } else {
          setAccount(null);
          setDisplayAddress(null);
          setContract(null);
          setWeb3(null);
        }
      });

      window.ethereum.on("chainChanged", () => {
        // Clear the current connection and reload
        setAccount(null);
        setDisplayAddress(null);
        setContract(null);
        setWeb3(null);
        window.location.reload();
      });
    }

    return () => {
      clearTimeout(timer);
      if (typeof window !== "undefined" && window.ethereum) {
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
          <strong>Wallet connected: {displayAddress}</strong> 
        </div>
      )}
    </Web3Context.Provider>
  );
}

