# Deployment Instructions for Sepolia

## Prerequisites:
1. Update .env file with your actual MetaMask mnemonic phrase
2. Ensure your wallet has Sepolia ETH (get from faucet: https://sepoliafaucet.com/)
3. Make sure MetaMask is connected to Sepolia network

## Deploy Commands:
```bash
# Deploy to Sepolia network
truffle migrate --network sepolia

# Or if you need to redeploy
truffle migrate --network sepolia --reset
```

## After successful deployment:
1. Copy the contract address from the deployment output
2. Update the contractAddress in web3-provider.tsx
3. Start the frontend application

## Current Configuration:
- Network: Sepolia (Chain ID: 11155111)
- Infura URL: https://sepolia.infura.io/v3/35605c388dd44b6fbc84f4d829ba1732
- Gas Limit: 6,000,000
- Gas Price: 20 gwei