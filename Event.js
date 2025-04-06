import fs from 'fs';
import path from 'path';
import Web3 from "web3";

// Read the JSON file dynamically
const TicketNFT = JSON.parse(
    fs.readFileSync(path.resolve('./build/contracts/TicketNFT.json'), 'utf-8')
);

// Use WebSocket provider instead of HTTP for event subscriptions
const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:8545"));
const contractAddress = "0xb07f3DA916A27f1F1C209d908d2Cb07503DDD462";

// Add connection handlers for WebSocket
web3.currentProvider.on('connect', () => {
  console.log("✅ WebSocket connected to Ganache");
});

web3.currentProvider.on('error', (error) => {
  console.error("❌ WebSocket error:", error);
});

web3.currentProvider.on('end', () => {
  console.error("❌ WebSocket connection closed");
});

const contract = new web3.eth.Contract(TicketNFT.abi, contractAddress);

const listenToEventCreated = () => {
  contract.events.EventCreated()
    .on("data", (event) => {
      const { eventId, name, price, eventURI } = event.returnValues;
      console.log("🎉 Event Created:");
      console.log(`  🆔 Event ID: ${eventId}`);
      console.log(`  📛 Name: ${name}`);
      console.log(`  💰 Price: ${web3.utils.fromWei(price, "ether")} ETH`);
      console.log(`  🔗 URI: ${eventURI}\n`);
    })
    .on("error", console.error);
};

const listenToEventDeleted = () => {
  contract.events.EventDeleted()
    .on("data", (event) => {
      const { eventId } = event.returnValues;
      console.log("❌ Event Deleted:");
      console.log(`  🆔 Event ID: ${eventId}\n`);
    })
    .on("error", console.error);
};

const listenToTicketMinted = () => {
  contract.events.TicketMinted()
    .on("data", (event) => {
      const { tokenId, eventId, owner } = event.returnValues;
      console.log("🎟️ Ticket Minted:");
      console.log(`  🪪 Token ID: ${tokenId}`);
      console.log(`  🎤 Event ID: ${eventId}`);
      console.log(`  👤 Owner: ${owner}\n`);
    })
    .on("error", console.error);
};

const listenToTicketListed = () => {
  contract.events.TicketListed()
    .on("data", (event) => {
      const { tokenId, owner, price } = event.returnValues;
      console.log("📢 Ticket Listed:");
      console.log(`  🪪 Token ID: ${tokenId}`);
      console.log(`  👤 Owner: ${owner}`);
      console.log(`  💵 Price: ${web3.utils.fromWei(price, "ether")} ETH\n`);
    })
    .on("error", console.error);
};

const listenToTicketSold = () => {
  contract.events.TicketSold()
    .on("data", (event) => {
      const { tokenId, from, to, price } = event.returnValues;
      console.log("💸 Ticket Sold:");
      console.log(`  🪪 Token ID: ${tokenId}`);
      console.log(`  🧑‍💼 From: ${from}`);
      console.log(`  👤 To: ${to}`);
      console.log(`  💰 Price: ${web3.utils.fromWei(price, "ether")} ETH\n`);
    })
    .on("error", console.error);
};

// Start all listeners
const listenToAllEvents = () => {
  console.log("📡 Listening to TicketNFT events...\n");
  listenToEventCreated();
  listenToEventDeleted();
  listenToTicketMinted();
  listenToTicketListed();
  listenToTicketSold();
};

listenToAllEvents();
