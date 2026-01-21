import { Navbar } from "@/components/landing/navbar";
import { MainHero } from "@/components/landing/main-hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { HopeSection } from "@/components/landing/hope-section";
import { BeliefSection } from "@/components/landing/belief-section";
import { GlimpseSection } from "@/components/landing/glimpse-section";
import { EarlyAccessSection } from "@/components/landing/early-access-section";
import { Footer } from "@/components/landing/footer";
import { TabProvider } from "@/lib/landing/tab-context";
import { EarlyAccessModalProvider } from "@/lib/landing/early-access-modal-context";

export default function Home() {
  return (
    <TabProvider>
      <EarlyAccessModalProvider>
        <div className="bg-white text-gray-900">
          <Navbar />
          <main>
            <MainHero />
            <ProblemSection />
            <HopeSection />
            <BeliefSection />
            <GlimpseSection />
            <EarlyAccessSection />
          </main>
          <Footer />
        </div>
      </EarlyAccessModalProvider>
    </TabProvider>
  );
}
