import fs from 'fs';
import path from 'path';
import Web3 from "web3";

// Read the JSON file dynamically
const TicketNFT = JSON.parse(
    fs.readFileSync(path.resolve('./build/contracts/TicketNFT.json'), 'utf-8')
);

// Connect to Ganache's local blockchain
const web3 = new Web3("http://127.0.0.1:8545"); // Replace with your Ganache RPC URL if different

let instance;

if (web3) { // Check if web3 is defined
    instance = new web3.eth.Contract(
        TicketNFT.abi,
        '0x9cbF13f1b40b27eD6623948F60BA175b185C263C' // Replace with your deployed contract address
    );
} else {
    console.error("Web3 is not available.");
}

const gasEstimate = await instance.methods.createEvent("Harshit", 89, 100, 10, "").estimateGas({
    from: '0x6fF6e707315611EA7d64Aaa362b8887af7316317'
});

let eventId =  instance.methods.createEvent("Harshit", 80, 20, 10, "new")
    .send({
        from: '0x6fF6e707315611EA7d64Aaa362b8887af7316317',
        gas: Number(gasEstimate) + 100000 // Convert gasEstimate to a Number
    })
let showEvent = instance.methods.showEvents() // Correct method name
    .call({
        from: '0x6fF6e707315611EA7d64Aaa362b8887af7316317'
    })
    .then((result) => {
        console.log(result);
    });
    

export default instance;