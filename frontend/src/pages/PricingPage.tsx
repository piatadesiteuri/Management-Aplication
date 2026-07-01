import Navbar from '../components/landing/Navbar';
import Pricing from '../components/landing/Pricing';
import Footer from '../components/landing/Footer';
import ContactForm from '../components/landing/ContactForm';
import { LandingLanguageProvider } from '../components/landing/LanguageContext';
import { ContactFormProvider } from '../components/landing/ContactFormContext';

export default function PricingPage() {
  return (
    <LandingLanguageProvider>
      <ContactFormProvider>
        <div className="flex min-h-screen flex-col bg-[#081425] font-['Inter',sans-serif] text-[#d8e3fb]">
          <Navbar />
          <div className="flex-1 [&>section]:pb-10">
            <Pricing />
          </div>
          <Footer />
          <ContactForm />
        </div>
      </ContactFormProvider>
    </LandingLanguageProvider>
  );
}
