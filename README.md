# 🎟️ NFT-Based Event Ticketing System
https://www.linkedin.com/posts/harshit-mohanty-1100871a0_blockchain-nft-ethereum-activity-7314609976679809024-P5N8?utm_source=social_share_send&utm_medium=android_app&rcm=ACoAAC7_N9wBiZ39ogCmxZLZznO1IqS3diGWw44&utm_campaign=copy_link

A decentralized ticketing platform where event organizers can mint event tickets as NFTs (ERC-721), and users can securely buy, sell, or transfer these tickets—with royalty rules and resale limits enforced via smart contracts.

## 🔧 Technologies Used

- **Solidity** ^0.8.17
- **Truffle Suite** for development/deployment
- **OpenZeppelin Contracts** (ERC721, Ownable)
- **IPFS** for hosting NFT metadata/images
- **JavaScript** for interaction scripts

## 💡 Key Features

- 🎫 **NFT Ticket Minting** — Each ticket is a unique ERC-721 token
- 🏷️ **Resale Marketplace** — Ticket owners can list their ticket for resale with a max price limit
- 💸 **Royalty System** — Original organizers earn a royalty % on each resale
- 👥 **Ownership Tracking** — Every transfer of the ticket is logged on-chain
- 🖼️ **IPFS Metadata** — Ticket image & event details stored off-chain
- 📡 **Event Listeners** — `EventListner.js` actively listens to smart contract events

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/your-username/nft-ticketing-truffle.git
cd nft-ticketing-truffle
npm install
truffle compile
truffle migrate --reset
```
## 📜 Sample IPFS Metadata
```bash
{
  "name": "Live Concert Ticket",
  "description": "VIP Pass to the Music Festival",
  "image": "https://ipfs.io/ipfs/your-image-cid",
  "attributes": [
    {
      "trait_type": "Access",
      "value": "VIP"
    },
    {
      "trait_type": "Location",
      "value": "Mumbai"
    }
  ]
}
```
##📬 Smart Contract Events
Event Name	Description
EventCreated	Emitted when a new event is created
EventDeleted	Emitted when an event is deleted
TicketMinted	Emitted on minting a new ticket
TicketListed	Emitted when a ticket is listed for resale
TicketSold	Emitted when a ticket is successfully sold

## 📂 Files of Interest
contracts/TicketNFT.sol – main smart contract logic

EventListner.js – listens and logs emitted events from the contract

ExampleUsage.js – helper functions to mint, list, and buy tickets

