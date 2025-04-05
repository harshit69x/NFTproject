import { Github, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-12 bg-black border-t border-zinc-800">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">NFT Ticket Marketplace</h3>
            <p className="text-zinc-400">
              Buy, sell, and trade event tickets as NFTs with transparent pricing and authentic ownership verification.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#events" className="text-zinc-400 hover:text-white transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="#marketplace" className="text-zinc-400 hover:text-white transition-colors">
                  Marketplace
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  My Tickets
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-zinc-400">Email: info@nfttickets.com</li>
              <li className="text-zinc-400">Discord: NFTTickets</li>
              <li className="text-zinc-400">Telegram: @NFTTickets</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-500">
          <p>© {new Date().getFullYear()} NFT Ticket Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

