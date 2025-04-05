import { HeroSection } from "@/components/hero-section"
import { EventsSection } from "@/components/events-section"
import { MarketplaceSection } from "@/components/marketplace-section"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-purple-950">
      <HeroSection />
      <EventsSection />
      <MarketplaceSection />
      <FeaturesSection />
      <Footer />
    </main>
  )
}

