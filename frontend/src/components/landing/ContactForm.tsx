import { useState, useEffect } from 'react';
import { Mail, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContactForm } from './ContactFormContext';
import { useLandingLanguage } from './LanguageContext';

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="contact-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 bg-[#081425]/80 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={e => e.stopPropagation()}
            className="absolute inset-4 flex flex-col overflow-y-auto rounded-3xl border border-white/10 bg-[#081425] shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:inset-8 md:inset-16 lg:inset-x-[20%] lg:inset-y-[8%]"
          >
            {/* Close */}
            <button
              onClick={close}
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[#8c90a1] transition-colors hover:bg-white/10 hover:text-[#d8e3fb]"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
              <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a3548] bg-[#111c2d]">
                    <Mail className="h-6 w-6 text-[#b3c5ff]" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#d8e3fb]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {c.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#8c90a1]">{c.subtitle}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.name} *</label>
                      <input
                        required type="text" value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full rounded-xl border border-[#2a3548] bg-[#111c2d] px-4 py-3 text-sm text-[#d8e3fb] outline-none placeholder:text-[#424656] transition-colors focus:border-[#b3c5ff]/50 focus:bg-[#152031]"
                        placeholder=""
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.email} *</label>
                      <input
                        required type="email" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl border border-[#2a3548] bg-[#111c2d] px-4 py-3 text-sm text-[#d8e3fb] outline-none placeholder:text-[#424656] transition-colors focus:border-[#b3c5ff]/50 focus:bg-[#152031]"
                        placeholder=""
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.company}</label>
                    <input
                      type="text" value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      className="w-full rounded-xl border border-[#2a3548] bg-[#111c2d] px-4 py-3 text-sm text-[#d8e3fb] outline-none placeholder:text-[#424656] transition-colors focus:border-[#b3c5ff]/50 focus:bg-[#152031]"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8c90a1]">{c.message} *</label>
                    <textarea
                      required rows={5} value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full resize-none rounded-xl border border-[#2a3548] bg-[#111c2d] px-4 py-3 text-sm text-[#d8e3fb] outline-none placeholder:text-[#424656] transition-colors focus:border-[#b3c5ff]/50 focus:bg-[#152031]"
                      placeholder={c.placeholder}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full rounded-xl px-6 py-3.5 text-sm font-semibold outline-none transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      sent
                        ? 'bg-[#24ffcd]/20 text-[#24ffcd]'
                        : 'bg-[#0066ff] text-white shadow-[0_0_24px_rgba(0,102,255,0.35)] hover:bg-[#1a75ff]'
                    }`}
                  >
                    {sent ? c.sent : c.submit}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
