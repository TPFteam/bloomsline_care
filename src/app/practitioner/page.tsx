import { Navbar } from "@/components/landing/navbar";
import { MainHero } from "@/components/landing/main-hero";
import { GlimpseSection } from "@/components/landing/glimpse-section";
import { Personas } from "@/components/landing/personas";
import { CommunityNote } from "@/components/landing/community-note";
import { Footer } from "@/components/landing/footer";
import { TabProvider } from "@/lib/landing/tab-context";

export default function PractitionerLandingPage() {
  return (
    <TabProvider defaultTab="practitioner">
      <div className="bg-white text-gray-900">
        <Navbar />
        <main>
          <MainHero isPractitionerPage />
          <GlimpseSection isPractitionerPage />
          <Personas />
          <CommunityNote />
        </main>
        <Footer />
      </div>
    </TabProvider>
  );
}
