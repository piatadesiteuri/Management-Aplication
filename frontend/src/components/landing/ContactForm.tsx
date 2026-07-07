import { useState, useEffect } from 'react';
import { Mail, X, Phone, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContactForm } from './ContactFormContext';
import { useLandingLanguage } from './LanguageContext';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#d8e3fb] outline-none placeholder:text-[#424656] backdrop-blur-sm transition-all focus:border-[#b3c5ff]/40 focus:bg-white/10 focus:shadow-[0_0_0_3px_rgba(179,197,255,0.08)]';

export default function ContactForm() {
  const { isOpen, close } = useContactForm();
  const { t } = useLandingLanguage();
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [sent, setSent] = useState(false);

  const c = t.contactForm;

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => { setSent(false); close(); }, 2000);
    setForm({ name: '', email: '', company: '', message: '' });
  };

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(c.locationFull.replace(/\n/g, ', '))}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="contact-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ background: 'rgba(4, 14, 31, 0.75)' }}
          onClick={close}
        >
          <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#0066ff]/20 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-[#24ffcd]/15 blur-[100px]" />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="relative flex w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.08] shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
            style={{
              background: 'rgba(17, 28, 45, 0.55)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Close */}
            <button
              onClick={close}
              className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#8c90a1] transition-all hover:border-white/20 hover:bg-white/10 hover:text-[#d8e3fb]"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* ── LEFT PANEL ── */}
            <div className="flex w-80 shrink-0 flex-col justify-between border-r border-white/[0.06] bg-white/[0.02] px-8 py-10">
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#b3c5ff]/20 bg-[#b3c5ff]/10">
                  <Mail className="h-5 w-5 text-[#b3c5ff]" />
                </div>
                <h2 className="text-xl font-semibold text-[#d8e3fb]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {c.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#8c90a1]">{c.subtitle}</p>

                <div className="mt-8 space-y-4">
                  {/* Phone */}
                  <a
                    href={`tel:${c.phone.replace(/\s/g, '')}`}
                    className="group flex items-center gap-3 text-sm text-[#c2c6d8] transition-colors hover:text-[#d8e3fb]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <Phone className="h-3.5 w-3.5 text-[#8c90a1] group-hover:text-[#b3c5ff] transition-colors" />
                    </span>
                    {c.phone}
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:${c.contactEmail}`}
                    className="group flex items-center gap-3 text-sm text-[#c2c6d8] transition-colors hover:text-[#d8e3fb]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <Mail className="h-3.5 w-3.5 text-[#8c90a1] group-hover:text-[#b3c5ff] transition-colors" />
                    </span>
                    {c.contactEmail}
                  </a>

                  {/* Location */}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 text-sm text-[#c2c6d8] transition-colors hover:text-[#d8e3fb]"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-[#8c90a1] group-hover:text-[#b3c5ff] transition-colors" />
                    </span>
                    <span className="whitespace-pre-line leading-5">{c.locationFull}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL — FORM ── */}
            <div className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.name} *</label>
                    <input required type="text" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={inputClass} placeholder={c.namePlaceholder} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.email} *</label>
                    <input required type="email" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={inputClass} placeholder={c.emailPlaceholder} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.company}</label>
                  <input type="text" value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className={inputClass} placeholder={c.companyPlaceholder} />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.message} *</label>
                  <textarea required rows={6} value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className={`${inputClass} resize-none`} placeholder={c.placeholder} />
                </div>

                <button
                  type="submit"
                  className={`w-full rounded-xl px-6 py-3.5 text-sm font-semibold outline-none transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    sent
                      ? 'bg-[#24ffcd]/20 text-[#24ffcd] shadow-[0_0_20px_rgba(36,255,205,0.15)]'
                      : 'bg-[#0066ff] text-white shadow-[0_0_24px_rgba(0,102,255,0.4)] hover:bg-[#1a75ff]'
                  }`}
                >
                  {sent ? c.sent : c.submit}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
