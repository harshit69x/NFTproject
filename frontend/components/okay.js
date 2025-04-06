import Web3 from "web3";

let instance;
let web3;

async function getContractInstance() {
  // Only initialize once
  if (instance) return instance;
  
  try {
    const response = await fetch("/api/contract");
    const { abi, address } = await response.json();

    // Use HTTP provider for read operations, but set up proper transaction handling
    web3 = new Web3("http://127.0.0.1:8545"); // Ganache RPC URL
    
    // Create contract instance
    instance = new web3.eth.Contract(abi, address);
    
    console.log("Contract initialized at:", address);
    return instance;
  } catch (error) {
    console.error("Error initializing contract:", error);
    throw error;
  }
}

// Helper to get the web3 instance as well
export const getWeb3 = () => web3;

export default getContractInstance;