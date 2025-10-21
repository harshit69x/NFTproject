// filepath: d:\NFTproject\frontend\pages\api\contract.js
import fs from "fs";
import path from "path";
import Web3 from "web3";

export default function handler(req, res) {
  try {
    // Use relative path that works in both local and Vercel deployment
    const contractPath = path.join(process.cwd(), "contracts", "TicketNFT.json");
    
    if (!fs.existsSync(contractPath)) {
      return res.status(404).json({ error: "Contract file not found" });
    }
    
    const TicketNFT = JSON.parse(fs.readFileSync(contractPath, "utf-8"));
    
    const infuraUrl = process.env.INFURA_URL || "https://sepolia.infura.io/v3/35605c388dd44b6fbc84f4d829ba1732";
    const contractAddress = process.env.CONTRACT_ADDRESS || "0xa76D945e17BaD6668681aFbC8576b6Cd44009C65";

    const web3 = new Web3(infuraUrl);

    const instance = new web3.eth.Contract(
      TicketNFT.abi,
      contractAddress
    );

    res.status(200).json({ abi: TicketNFT.abi, address: contractAddress });
  } catch (error) {
    console.error("Contract API error:", error);
    res.status(500).json({ error: "Failed to load contract", details: error.message });
  }
}