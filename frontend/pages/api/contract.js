// filepath: d:\NFTproject\frontend\pages\api\contract.js
import fs from "fs";
import path from "path";
import Web3 from "web3";

export default function handler(req, res) {
  // Correctly resolve the path to the TicketNFT.json file
  const TicketNFT = JSON.parse(
    fs.readFileSync(path.resolve("d:/NFTproject/frontend/contracts/TicketNFT.json"), "utf-8")
  );

  const web3 = new Web3("https://sepolia.infura.io/v3/35605c388dd44b6fbc84f4d829ba1732"); // Sepolia Infura RPC URL

  const instance = new web3.eth.Contract(
    TicketNFT.abi,
    "0xa76D945e17BaD6668681aFbC8576b6Cd44009C65" // Deployed Sepolia contract address
  );

  res.status(200).json({ abi: TicketNFT.abi, address: "0xa76D945e17BaD6668681aFbC8576b6Cd44009C65" });
}