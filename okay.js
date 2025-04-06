import fs from 'fs';
import path from 'path';
import Web3 from "web3";

// Read the JSON file dynamically
const TicketNFT = JSON.parse(
    fs.readFileSync(path.resolve('./build/contracts/TicketNFT.json'), 'utf-8')
);

console.log("Showing events...");
const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:8545"));

// Setup connection handlers
web3.currentProvider.on('connect', () => {
  console.log("WebSocket successfully connected to Ganache");
});

web3.currentProvider.on('error', (error) => {
  console.error("WebSocket connection error:", error);
});

web3.currentProvider.on('end', () => {
  console.error("WebSocket connection closed");
});

let instance;

if (web3) {
    instance = new web3.eth.Contract(
        TicketNFT.abi,
        '0xEEfA3A9BB95FC323f918E3C334AF1290FF7aE950'
    );
} else {
    console.error("Web3 is not available.");
}

// Main function to handle all operations
async function main() {
    // Wait for connection to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Setting up event listeners...");
    
    // Setup TicketMinted event listener with better block range
    const ticketMintedListener = instance.events.TicketMinted({
        fromBlock: 0, // Listen from block 0 to catch all events
    })
    .on('data', (event) => {
        console.log("TicketMinted event detected!", {
            tokenId: event.returnValues.tokenId,
            eventId: event.returnValues.eventId,
            owner: event.returnValues.owner
        });
    })
    .on('connected', (subscriptionId) => {
        console.log("TicketMinted listener connected with subscription ID:", subscriptionId);
    })
    .on('error', (error) => {
        console.error("WebSocket error in TicketMinted:", error);
    });
    
    // Also setup past events check
    console.log("Checking for past TicketMinted events...");
    const pastEvents = await instance.getPastEvents('TicketMinted', {
        fromBlock: 0,
        toBlock: 'latest'
    });
    
    console.log(`Found ${pastEvents.length} past TicketMinted events`);
    pastEvents.forEach(event => {
        console.log("Past event:", {
            tokenId: event.returnValues.tokenId,
            eventId: event.returnValues.eventId,
            owner: event.returnValues.owner
        });
    });
    
    // Wait for listeners to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now mint the ticket
    try {
        console.log("Minting ticket...");
        
        // Choose an event ID that exists (based on your logs, 6 or 7 would work)
        const eventId = 9;
        
        // First check the price for this event
        const eventInfo = await instance.methods.events(eventId).call();
        console.log("Event info:", eventInfo);
        
        // Use originalPrice which is the property that exists in your contract
        const ticketPrice = eventInfo.originalPrice.toString();
        console.log("Ticket price:", web3.utils.fromWei(ticketPrice, "ether"), "ETH");
        
        // Use the same eventId for minting
        const receipt = await instance.methods.mintTicket(eventId)
            .send({
                from: '0x6fF6e707315611EA7d64Aaa362b8887af7316317',
                gas: 1000000,
                value: ticketPrice // Use the string version
            });
        
        console.log("Ticket minted successfully!");
        console.log("Transaction hash:", receipt.transactionHash);
        
        // Get transaction receipt to check logs/events
        const txReceipt = await web3.eth.getTransactionReceipt(receipt.transactionHash);
        console.log("Transaction logs:", txReceipt.logs);
        
        // Keep script running to catch events
        console.log("Waiting for events to be detected (10 seconds)...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log("Script execution complete.");
    } catch (error) {
        console.error("Error in ticket minting:", error);
    }
}

// Start the main process
main().catch(error => {
    console.error("Fatal error:", error);
});

export default instance;