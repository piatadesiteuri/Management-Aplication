import { FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLandingLanguage } from './LanguageContext';

const featuredFlags = [false, true, false];

export default function Pricing() {
  const { t } = useLandingLanguage();
  const plans = t.pricing.plans.map((plan, i) => ({ ...plan, featured: featuredFlags[i] }));
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-[#00513f] bg-[#24ffcd]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-[#24ffcd]">
            {t.pricing.badge}
          </span>
          <h2
            className="mt-4 text-[28px] font-semibold text-[#d8e3fb] md:text-[32px]"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t.pricing.title}
          </h2>
          <p className="mt-3 text-base text-[#c2c6d8]">{t.pricing.subtitle}</p>
        </motion.div>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? 'border-2 border-[#b3c5ff] bg-[#152031] hover:shadow-[0_0_32px_rgba(179,197,255,0.25)]'
                  : 'border border-white/10 bg-[#111c2d]/60 hover:border-white/20'
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#b3c5ff] px-3 py-1 text-xs font-semibold text-[#002b75]">
                  {t.pricing.mostPopular}
                </span>
              )}

              <h3 className="text-sm font-medium text-[#c2c6d8]">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className="text-4xl font-semibold text-[#d8e3fb]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {plan.price}
                </span>
                {plan.period && <span className="text-sm text-[#c2c6d8]">{plan.period}</span>}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-[#c2c6d8]">
                    <FiCheck className="h-4 w-4 shrink-0 text-[#24ffcd]" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-8 w-full rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${
                  plan.featured
                    ? 'bg-[#0066ff] text-white shadow-[0_0_24px_rgba(0,102,255,0.35)] hover:bg-[#1a75ff]'
                    : 'border border-[#424656] bg-white/5 text-[#d8e3fb] hover:border-[#8c90a1] hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
