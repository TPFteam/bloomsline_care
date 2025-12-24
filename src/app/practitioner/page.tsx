import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Personas } from "@/components/landing/personas";
import { CommunityNote } from "@/components/landing/community-note";
import { Footer } from "@/components/landing/footer";

export default function PractitionerLandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Personas />
        <CommunityNote />
      </main>
      <Footer />
    </>
  );
}
