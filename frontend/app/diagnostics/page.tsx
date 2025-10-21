import MetaMaskDiagnostics from '@/components/metamask-diagnostics';

export default function DiagnosticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">MetaMask Diagnostics</h1>
      <MetaMaskDiagnostics />
      
      <div className="mt-8 max-w-2xl mx-auto bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">If you're experiencing circuit breaker errors:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Run diagnostics above to check your connection</li>
          <li>Open MetaMask → Settings → Advanced → Reset Account</li>
          <li>Clear your browser cache and cookies</li>
          <li>Restart your browser completely</li>
          <li>Reconnect to this dApp</li>
          <li>Make sure you're on Sepolia testnet</li>
          <li>Try creating an event again</li>
        </ol>
        
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
          <h3 className="font-semibold">Contract Information:</h3>
          <p className="text-sm">Contract Address: 0xED40813878aa8812C725eb1C7d27a395BD74Ccd3</p>
          <p className="text-sm">Network: Sepolia Testnet (Chain ID: 11155111)</p>
          <p className="text-sm">RPC: https://sepolia.infura.io/v3/35605c388dd44b6fbc84f4d829ba1732</p>
        </div>
      </div>
    </div>
  );
}