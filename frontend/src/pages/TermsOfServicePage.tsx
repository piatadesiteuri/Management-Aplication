import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { LandingLanguageProvider, useLandingLanguage } from '../components/landing/LanguageContext';
import { ContactFormProvider } from '../components/landing/ContactFormContext';
import ContactForm from '../components/landing/ContactForm';

const LAST_UPDATED = 'July 1, 2026';

function TermsContent() {
  const { t } = useLandingLanguage();
  const s = t.termsOfService;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:px-12 md:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#8c90a1]">
        {s.lastUpdated}: {LAST_UPDATED}
      </p>
      <h1 className="mb-10 text-4xl font-semibold text-[#d8e3fb]" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {s.title}
      </h1>

      <div className="space-y-10 text-sm leading-7 text-[#c2c6d8]">
        <Section title={s.s1title}>
          <p>{s.s1p1}</p>
          <p className="mt-3">{s.s1p2}</p>
        </Section>

        <Section title={s.s2title}>
          <p>{s.s2p1}</p>
        </Section>

        <Section title={s.s3title}>
          <p>{s.s3p1}</p>
          <p className="mt-3">{s.s3p2}</p>
        </Section>

        <Section title={s.s4title}>
          <p>{s.s4intro}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            {[s.s4i1, s.s4i2, s.s4i3, s.s4i4, s.s4i5].map(item => <li key={item}>{item}</li>)}
          </ul>
        </Section>

        <Section title={s.s5title}>
          <p>{s.s5p1}</p>
          <p className="mt-3">{s.s5p2}</p>
        </Section>

        <Section title={s.s6title}>
          <p>{s.s6p1}</p>
          <p className="mt-3">{s.s6p2}</p>
        </Section>

        <Section title={s.s7title}>
          <p>{s.s7p1}</p>
          <p className="mt-3">
            {s.s7see}{' '}
            <Link to="/privacy" className="text-[#b3c5ff] hover:underline">
              {s.s7link}
            </Link>.
          </p>
        </Section>

        <Section title={s.s8title}>
          <p>{s.s8p1}</p>
        </Section>

        <Section title={s.s9title}>
          <p>{s.s9p1}</p>
        </Section>

        <Section title={s.s10title}>
          <p>{s.s10p1}</p>
        </Section>

        <Section title={s.s11title}>
          <p>{s.s11p1}</p>
        </Section>

        <Section title={s.s12title}>
          <p>
            {s.s12p1}{' '}
            <a href="mailto:legal@logicore.ro" className="text-[#b3c5ff] hover:underline">
              legal@logicore.ro
            </a>
            {' '}— Bulevardul Gheorghe Chițu 45, Craiova, România.
          </p>
        </Section>
      </div>
    </main>
  );
}

export default function TermsOfServicePage() {
  return (
    <LandingLanguageProvider>
      <ContactFormProvider>
        <div className="flex min-h-screen flex-col bg-[#081425] font-['Inter',sans-serif] text-[#d8e3fb]">
          <Navbar />
          <TermsContent />
          <Footer />
          <ContactForm />
        </div>
      </ContactFormProvider>
    </LandingLanguageProvider>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-[#d8e3fb]" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
