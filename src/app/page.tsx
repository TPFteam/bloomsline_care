import { Navbar } from "@/components/landing/navbar";
import { MainHero } from "@/components/landing/main-hero";
import { ProblemSection } from "@/components/landing/problem-section";
import { ValidationSection } from "@/components/landing/validation-section";
import { BeliefSection } from "@/components/landing/belief-section";
import { GlimpseSection } from "@/components/landing/glimpse-section";
import { Footer } from "@/components/landing/footer";
import { TabProvider } from "@/lib/landing/tab-context";

export default function Home() {
  return (
    <TabProvider>
      <div className="bg-white text-gray-900">
        <Navbar />
        <main>
          <MainHero />
          <ProblemSection />
          <ValidationSection />
          <BeliefSection />
          <GlimpseSection />
        </main>
        <Footer />
      </div>
    </TabProvider>
  );
}
