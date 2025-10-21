import React from 'react';

const TestEventPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Event Metadata</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Sample Event Metadata Format</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "name": "Summer Music Festival 2025",
  "description": "The biggest music festival of the year",
  "image": "/placeholder.svg?height=400&width=600",
  "attributes": [
    {
      "trait_type": "Event Type",
      "value": "Music Festival"
    },
    {
      "trait_type": "Date",
      "value": "July 15-17, 2025"
    },
    {
      "trait_type": "Location", 
      "value": "Central Park, NY"
    },
    {
      "trait_type": "Capacity",
      "value": "50000"
    }
  ]
}`}
          </pre>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Valid Event URI Examples</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>✅ Valid URIs:</strong>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><code>https://example.com/event-metadata.json</code></li>
                <li><code>https://gateway.pinata.cloud/ipfs/Qm...</code></li>
                <li><code>ipfs://QmYourHashHere</code></li>
                <li><code>https://api.example.com/events/123</code></li>
              </ul>
            </div>
            
            <div className="mt-4">
              <strong>❌ Invalid URIs (will cause errors):</strong>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><code>erwer</code> ← Not a URL</li>
                <li><code>test123</code> ← Not a URL</li>
                <li><code>random-text</code> ← Not a URL</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">⚠️ Important Notes:</h2>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Always use valid HTTP/HTTPS URLs for event URIs</li>
          <li>The URI should return JSON metadata in the format shown above</li>
          <li>Invalid URIs like "erwer" will cause 404 errors in the console</li>
          <li>Use IPFS or a reliable hosting service for production</li>
          <li>Test your metadata URL before creating the event</li>
        </ul>
      </div>

      <div className="mt-8 bg-green-50 border border-green-200 p-6 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">🛠️ Quick Fix for Current Issues:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>The error you're seeing is because an event was created with URI "erwer" (not a valid URL)</li>
          <li>Your Web3 connection is working perfectly - you're connected to Sepolia!</li>
          <li>Contract address <code>0xED40813878aa8812C725eb1C7d27a395BD74Ccd3</code> is correct</li>
          <li>The transaction errors are now fixed with proper MetaMask integration</li>
          <li>Create new events with proper URLs to test the full functionality</li>
        </ol>
      </div>
    </div>
  );
};

export default TestEventPage;