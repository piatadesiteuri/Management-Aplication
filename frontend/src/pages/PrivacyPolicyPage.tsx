import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { LandingLanguageProvider } from '../components/landing/LanguageContext';
import { ContactFormProvider } from '../components/landing/ContactFormContext';
import ContactForm from '../components/landing/ContactForm';
import { useLandingLanguage } from '../components/landing/LanguageContext';

const LAST_UPDATED = 'July 1, 2026';

function PrivacyPolicyContent() {
  const { t } = useLandingLanguage();
  const p = t.privacyPolicy;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:px-12 md:py-24">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#8c90a1]">
        {p.lastUpdated}: {LAST_UPDATED}
      </p>
      <h1 className="mb-10 text-4xl font-semibold text-[#d8e3fb]" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {p.title}
      </h1>

      <div className="space-y-10 text-sm leading-7 text-[#c2c6d8]">
        <Section title={p.s1title}>
          <p>{p.s1p1}</p>
          <p className="mt-3">{p.s1p2}</p>
        </Section>

        <Section title={p.s2title}>
          <p>{p.s2intro}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            {[p.s2i1, p.s2i2, p.s2i3, p.s2i4].map(item => <li key={item}>{item}</li>)}
          </ul>
        </Section>

        <Section title={p.s3title}>
          <p>{p.s3intro}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            {[p.s3i1, p.s3i2, p.s3i3, p.s3i4, p.s3i5].map(item => <li key={item}>{item}</li>)}
          </ul>
        </Section>

        <Section title={p.s4title}>
          <p>{p.s4p1}</p>
        </Section>

        <Section title={p.s5title}>
          <p>{p.s5p1}</p>
        </Section>

        <Section title={p.s6title}>
          <p>{p.s6p1}</p>
        </Section>

        <Section title={p.s7title}>
          <p>{p.s7p1}</p>
        </Section>

        <Section title={p.s8title}>
          <p>{p.s8intro}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            {[p.s8i1, p.s8i2, p.s8i3, p.s8i4, p.s8i5, p.s8i6].map(item => <li key={item}>{item}</li>)}
          </ul>
        </Section>

        <Section title={p.s9title}>
          <p>
            {p.s9p1}{' '}
            <a href="mailto:privacy@logicore.ro" className="text-[#b3c5ff] hover:underline">privacy@logicore.ro</a>
            {' '}or by post at Bulevardul Gheorghe Chițu 45, Craiova, România.
          </p>
        </Section>
      </div>
    </main>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LandingLanguageProvider>
      <ContactFormProvider>
        <div className="flex min-h-screen flex-col bg-[#081425] font-['Inter',sans-serif] text-[#d8e3fb]">
          <Navbar />
          <PrivacyPolicyContent />
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
