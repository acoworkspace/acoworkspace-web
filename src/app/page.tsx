import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Locations from "@/components/sections/Locations";
import Stats from "@/components/sections/Stats";
import Contact from "@/components/sections/Contact";
import { getSiteContent } from "@/lib/site-content";

export const revalidate = 60;

export default async function Home() {
  const content = await getSiteContent("hero", "stats", "services", "locations", "contact");
  return (
    <>
      <Navbar />
      <main>
        <Hero content={content} />
        <Stats content={content} />
        <Services content={content} />
        <Locations content={content} />
        <Contact content={content} />
      </main>
      <Footer />
    </>
  );
}
