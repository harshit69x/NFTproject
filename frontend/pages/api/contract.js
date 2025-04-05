// filepath: d:\NFTproject\frontend\pages\api\contract.js
import fs from "fs";
import path from "path";
import Web3 from "web3";

export default function handler(req, res) {
  // Correctly resolve the path to the TicketNFT.json file
  const TicketNFT = JSON.parse(
    fs.readFileSync(path.resolve("d:/NFTproject/frontend/contracts/TicketNFT.json"), "utf-8")
  );

  const web3 = new Web3("http://127.0.0.1:8545"); // Replace with your Ganache RPC URL

  const instance = new web3.eth.Contract(
    TicketNFT.abi,
    "0x9cbF13f1b40b27eD6623948F60BA175b185C263C" // Replace with your deployed contract address
  );

  res.status(200).json({ abi: TicketNFT.abi, address: "0x9cbF13f1b40b27eD6623948F60BA175b185C263C" });
}