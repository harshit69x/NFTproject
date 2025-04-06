import fs from 'fs';
import path from 'path';
import Web3 from "web3";

// Read the JSON file dynamically
const TicketNFT = JSON.parse(
    fs.readFileSync(path.resolve('./build/contracts/TicketNFT.json'), 'utf-8')
);



const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545"); // Ganache RPC
const web3 = new Web3(provider);

// Replace with deployed contract address from Ganache
const contractAddress = "0xb07f3DA916A27f1F1C209d908d2Cb07503DDD462";
const contract = new web3.eth.Contract(TicketNFT.abi, contractAddress);

// Sample account list (optional: replace with actual accounts from Ganache)
let accounts;

const init = async () => {
    accounts = await web3.eth.getAccounts();
    console.log("Connected accounts:", accounts);
};

const createEvent = async () => {
    const tx = await contract.methods.createEvent(
        "test",
        web3.utils.toWei("0.1", "ether"), // Convert to wei
        web3.utils.toWei("0.2", "ether"), // Convert to wei
        10,
        "xjgjvd"
    ).send({
        from: '0x63b7acCBeE71A6a026A0BdC3a0734D74384eD15C',
        gas: 3000000,
    });
    console.log("✅ Event created:", tx.events.EventCreated.returnValues);
};

const mintTicket = async () => {
  const tx = await contract.methods.mintTicket(1).send({ from:"0x63b7acCBeE71A6a026A0BdC3a0734D74384eD15C", value: web3.utils.toWei("0.1", "ether"),gas: 3000000 });
  console.log("🎟️ Ticket minted:", tx.events.TicketMinted.returnValues);
};

const listTicket = async () => {
  // Convert price to wei BEFORE sending to the contract
  const priceInWei = web3.utils.toWei("0.2", "ether");
  
  const tx = await contract.methods.listTicket(1, priceInWei).send({  
    from: "0x1889Bf41B0f6B598B66d5F8a08a1743c02277352", 
    gas: 3000000 
    // Don't include value parameter here - you're not sending ETH when listing
  });
  
  console.log("📌 Ticket listed:", tx.events.TicketListed.returnValues);
};

const buyTicket = async () => {
    const priceInWei = web3.utils.toWei("0.2", "ether");
  const tx = await contract.methods.buyTicket(1).send({ from:"0x1889Bf41B0f6B598B66d5F8a08a1743c02277352", value:priceInWei, gas: 3000000 });
  console.log("💸 Ticket bought:", tx.events.TicketSold.returnValues);
};

const getOwnedTickets = async () => {
  const tickets = await contract.methods.getOwnedTickets("0x63b7acCBeE71A6a026A0BdC3a0734D74384eD15C").call();
  console.log(`🎫 Owned tickets for ${"0x63b7acCBeE71A6a026A0BdC3a0734D74384eD15C"}:`, tickets);
  return tickets;
};
const getEventForToken = async (tokenId) => {
  try {
    const eventDetails = await contract.methods.getEventForTicket(tokenId).call();
    console.log(`📦 Event for token ID ${tokenId}:`, eventDetails);
    return eventDetails;
  } catch (error) {
    console.error(`❌ Failed to get event for token ID ${tokenId}:`, error.message);
  }
};

const deleteEvent = async () => {
    try {
      // Use .send() instead of .call() to modify state
      const receipt = await contract.methods.deleteEvent(2)
        .send({
          from: '0x63b7acCBeE71A6a026A0BdC3a0734D74384eD15C',
          gas: 3000000
        });
      
      console.log("Event deleted successfully");
      console.log("Transaction hash:", receipt.transactionHash);
      
      // Check if there's an EventDeleted event in the receipt
      if (receipt.events && receipt.events.EventDeleted) {
        console.log("Event deleted:", receipt.events.EventDeleted.returnValues);
      }
      
      return receipt;
    } catch (error) {
      console.error("Error deleting event:", error.message);
      throw error;
    }
  };
  

const showEvents = async () => {
  const events = await contract.methods.showEvents().call();
  console.log("📅 Active events:", events);
  return events;
};

const showListedTickets = async () => {
  const listed = await contract.methods.showListedTickets().call();
  console.log("🧾 Listed tickets:", listed);
  return listed;
};
// createEvent();
// mintTicket();
// getOwnedTickets();
//  listTicket()
// deleteEvent()
// showListedTickets();
//  buyTicket()
// showEvents();
// getEventForToken(1);

