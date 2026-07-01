import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Capabilities from '../components/landing/Capabilities';
import PrecisionInMotion from '../components/landing/PrecisionInMotion';
import StatsBar from '../components/landing/StatsBar';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import ContactForm from '../components/landing/ContactForm';
import { LandingLanguageProvider } from '../components/landing/LanguageContext';
import { ContactFormProvider } from '../components/landing/ContactFormContext';

export default function LandingPage() {
  return (
    <LandingLanguageProvider>
      <ContactFormProvider>
        <div className="min-h-screen bg-[#081425] font-['Inter',sans-serif] text-[#d8e3fb]">
          <Navbar />
          <Hero />
          <Capabilities />
          <PrecisionInMotion />
          <StatsBar />
          <CTA />
          <Footer />
          <ContactForm />
        </div>
      </ContactFormProvider>
    </LandingLanguageProvider>
  );
}
