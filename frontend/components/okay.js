import Web3 from "web3";

let instance;
let web3;

async function getContractInstance() {
  // Only initialize once
  if (instance) return instance;
  
  try {
    const response = await fetch("/api/contract");
    const { abi, address } = await response.json();

    // Use Sepolia Infura RPC for read operations
    web3 = new Web3("https://sepolia.infura.io/v3/35605c388dd44b6fbc84f4d829ba1732"); // Sepolia Infura RPC URL
    
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