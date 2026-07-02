import { FiPlay } from 'react-icons/fi';
import heroDashboard from '../../assets/landing/hero-dashboard.png';
import { useLandingLanguage } from './LanguageContext';
import { useContactForm } from './ContactFormContext';
import { BorderBeam } from 'border-beam';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut', delay },
});

export default function Hero() {
  const { t } = useLandingLanguage();
  const { open: openContact } = useContactForm();
  return (
    <section className="relative overflow-hidden px-6 pb-32 pt-20 md:px-12 md:pt-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-[#0066ff]/20 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div>
          <motion.h1
            {...fadeUp(0.1)}
            className="mt-6 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#d8e3fb] md:text-[48px] md:leading-[56px]"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t.hero.titlePrefix}{' '}
            <span className="text-[#b3c5ff]">{t.hero.titleHighlight}</span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="mt-6 max-w-md text-base leading-7 text-[#c2c6d8]">
            {t.hero.description}
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap items-center gap-4">
            <BorderBeam size="sm" theme="dark">
              <button
                onClick={openContact}
                className="rounded-xl bg-transparent px-6 py-3 text-sm font-semibold text-[#d8e3fb] outline-none transition-all hover:scale-105 hover:bg-white/5 active:scale-95"
              >
                {t.hero.ctaPrimary}
              </button>
            </BorderBeam>
          </motion.div>
        </div>

        <div className="group relative isolate">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#24ffcd]/10 blur-[100px]" />
          <motion.img
            src={heroDashboard}
            alt={t.hero.imageAlt}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08, rotate: -1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative w-full rounded-3xl"
          />
        </div>
      </div>
    </section>
  );
}
