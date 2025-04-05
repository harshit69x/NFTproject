// filepath: d:\NFTproject\frontend\components\okay.js
import Web3 from "web3";

let instance;

async function getContractInstance() {
  const response = await fetch("/api/contract");
  const { abi, address } = await response.json();

  const web3 = new Web3("http://127.0.0.1:8545"); // Replace with your Ganache RPC URL
  instance = new web3.eth.Contract(abi, address);

  return instance;
}

export default getContractInstance;