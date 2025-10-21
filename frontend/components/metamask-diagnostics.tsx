'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosticInfo {
  hasMetaMask: boolean;
  isConnected: boolean;
  accounts: string[];
  chainId: string | null;
  networkName: string;
  balance: string | null;
  isCorrectNetwork: boolean;
}

export default function MetaMaskDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    
    const info: DiagnosticInfo = {
      hasMetaMask: false,
      isConnected: false,
      accounts: [],
      chainId: null,
      networkName: 'Unknown',
      balance: null,
      isCorrectNetwork: false,
    };

    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && window.ethereum) {
        info.hasMetaMask = true;

        // Get accounts
        info.accounts = await window.ethereum.request({ method: 'eth_accounts' });
        info.isConnected = info.accounts.length > 0;

        // Get chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as unknown as string;
        info.chainId = chainId;
        
        const chainIdNum = parseInt(chainId, 16);
        info.isCorrectNetwork = chainIdNum === 11155111; // Sepolia
        
        // Convert chain ID to network name
        switch (chainIdNum) {
          case 1:
            info.networkName = 'Ethereum Mainnet';
            break;
          case 11155111:
            info.networkName = 'Sepolia Testnet';
            break;
          case 5:
            info.networkName = 'Goerli Testnet';
            break;
          default:
            info.networkName = `Unknown Network (${chainIdNum})`;
        }

        // Get balance if connected
        if (info.isConnected) {
          try {
            const balance = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [info.accounts[0], 'latest'],
            } as any);
            const balanceInEth = parseInt(balance as unknown as string, 16) / Math.pow(10, 18);
            info.balance = balanceInEth.toFixed(6);
          } catch (error) {
            console.error('Error getting balance:', error);
            info.balance = 'Error loading balance';
          }
        }
      }
    } catch (error) {
      console.error('Diagnostics error:', error);
    }

    setDiagnostics(info);
    setIsLoading(false);
  };

  const connectMetaMask = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        runDiagnostics(); // Refresh diagnostics
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
    }
  };

  const switchToSepolia = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
        } as any);
        runDiagnostics(); // Refresh diagnostics
      }
    } catch (error: any) {
      // Chain not added to MetaMask
      if (error.code === 4902) {
        try {
          if (window.ethereum) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              }],
            } as any);
          }
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
        }
      } else {
        console.error('Error switching to Sepolia:', error);
      }
    }
  };

  const resetAccount = () => {
    alert('To reset your MetaMask account:\n\n1. Open MetaMask\n2. Go to Settings → Advanced\n3. Click "Reset Account"\n4. Confirm the reset\n5. Reconnect to this dApp');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>MetaMask Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={isLoading} className="w-full">
          {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {diagnostics && (
          <div className="space-y-3">
            <div className={`p-3 rounded ${diagnostics.hasMetaMask ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <strong>MetaMask Installed:</strong> {diagnostics.hasMetaMask ? 'Yes' : 'No'}
            </div>

            <div className={`p-3 rounded ${diagnostics.isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              <strong>Connected:</strong> {diagnostics.isConnected ? 'Yes' : 'No'}
              {!diagnostics.isConnected && diagnostics.hasMetaMask && (
                <Button onClick={connectMetaMask} size="sm" className="ml-2">
                  Connect
                </Button>
              )}
            </div>

            {diagnostics.accounts.length > 0 && (
              <div className="p-3 bg-blue-50 text-blue-800 rounded">
                <strong>Account:</strong> {diagnostics.accounts[0]}
              </div>
            )}

            <div className={`p-3 rounded ${diagnostics.isCorrectNetwork ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <strong>Network:</strong> {diagnostics.networkName} ({diagnostics.chainId})
              <div className="text-sm mt-1">
                Correct Network: {diagnostics.isCorrectNetwork ? 'Yes' : 'No (Need Sepolia)'}
              </div>
              {!diagnostics.isCorrectNetwork && (
                <Button onClick={switchToSepolia} size="sm" className="mt-2">
                  Switch to Sepolia
                </Button>
              )}
            </div>

            {diagnostics.balance !== null && (
              <div className="p-3 bg-gray-50 text-gray-800 rounded">
                <strong>Balance:</strong> {diagnostics.balance} ETH
              </div>
            )}

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting Actions:</h4>
              <div className="space-y-2">
                <Button onClick={resetAccount} variant="outline" size="sm">
                  Guide: Reset MetaMask Account
                </Button>
                <div className="text-sm text-yellow-700">
                  <p>If experiencing circuit breaker errors:</p>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Reset your MetaMask account (button above)</li>
                    <li>Clear browser cache and cookies</li>
                    <li>Switch networks back and forth</li>
                    <li>Restart browser and reconnect</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}