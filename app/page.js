import Hero from "../components/Hero";
import About from "../components/About";
import Tokenomics from "../components/Tokenomics";
import Footer from "../components/Footer";
import SectionDivider from "../components/SectionDivider";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-[#E8F5E9]">
      <Hero />
      <SectionDivider />
      <About />
      <SectionDivider />
      <Tokenomics />
      <SectionDivider />
      <Footer />
    </main>
  );
}