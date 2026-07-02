import { Link } from 'react-router-dom';
import { BorderBeam } from 'border-beam';
import { motion } from 'framer-motion';
import { useLandingLanguage } from './LanguageContext';

export default function CTA() {
  const { t } = useLandingLanguage();
  return (
    <section id="cta" className="px-6 pb-24 md:px-12">
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 32 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
          hover:   { y: -4, scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 22 } },
        }}
        initial="hidden"
        whileInView="visible"
        whileHover="hover"
        viewport={{ once: true, margin: '-60px' }}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#111c2d] to-[#0a2a22] p-12 text-center backdrop-blur-md md:p-16"
      >
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#24ffcd]/15 blur-[100px]" />

        <h2
          className="relative text-2xl font-semibold text-[#d8e3fb] md:text-[32px]"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          {t.cta.title}
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-base text-[#c2c6d8]">
          {t.cta.description}
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-6">
          <BorderBeam size="line" theme="dark" colorVariant="ocean">
            <Link
              to="/pricing"
              className="block rounded-xl bg-transparent px-6 py-3 text-sm font-semibold text-[#d8e3fb] outline-none transition-all hover:scale-105 hover:bg-white/5 active:scale-95"
            >
              {t.cta.primary}
            </Link>
          </BorderBeam>
        </div>
      </motion.div>
    </section>
  );
}
