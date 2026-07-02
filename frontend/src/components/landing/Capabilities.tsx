import { FiShare2, FiActivity, FiShield, FiArchive, FiCreditCard, FiCheck } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLandingLanguage } from './LanguageContext';

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' } as const,
  transition: { duration: 0.55, ease: 'easeOut', delay },
});

export default function Capabilities() {
  const { t } = useLandingLanguage();
  return (
    <section id="capabilities" className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div {...inView()} className="mx-auto max-w-2xl text-center">
          <h2
            className="text-[28px] font-semibold text-[#d8e3fb] md:text-[32px]"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t.capabilities.title}
          </h2>
          <p className="mt-3 text-base text-[#c2c6d8]">{t.capabilities.subtitle}</p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 32 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut', delay: 0.1 } },
              hover:   { y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 22 } },
            }}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true, margin: '-60px' }}
            className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-[#111c2d]/60 p-8 backdrop-blur-md hover:border-white/20 lg:row-span-2"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2a3548] transition-transform duration-300 group-hover:scale-110">
                <FiShare2 className="h-5 w-5 text-[#b3c5ff]" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-[#d8e3fb]">
                {t.capabilities.workflow.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#c2c6d8]">
                {t.capabilities.workflow.description}
              </p>
            </div>

            {/* Workflow visualiser */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0a1624] p-6">
              <div className="flex items-center gap-6">
                <div className="relative flex flex-col gap-0 py-2">
                  <div className="absolute left-[10px] top-6 h-[calc(100%-24px)] w-px bg-[#2a3548]" />
                  <div className="relative z-10 pb-9">
                    <div className="h-[22px] w-[22px] rounded-full bg-[#0066ff] shadow-[0_0_10px_rgba(0,102,255,0.7)]" />
                  </div>
                  <div className="relative z-10 pb-9">
                    <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[#0066ff] bg-[#0a1624]">
                      <div className="h-[7px] w-[7px] rounded-full bg-[#0066ff]" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[#24ffcd] bg-[#24ffcd]/20">
                      <FiCheck className="h-3.5 w-3.5 text-[#24ffcd]" />
                    </div>
                  </div>
                </div>
                <div className="ml-auto flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <svg width="110" height="110" viewBox="0 0 110 110">
                      <circle cx="55" cy="55" r="44" stroke="#1f2d42" strokeWidth="6" fill="none" />
                      <circle
                        cx="55" cy="55" r="44"
                        stroke="#24ffcd" strokeWidth="6" fill="none"
                        strokeLinecap="round" strokeDasharray="235 42"
                        transform="rotate(-90 55 55)"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(36,255,205,0.6))' }}
                      />
                    </svg>
                    <p className="absolute text-lg font-bold text-[#24ffcd]">85%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <CapabilityCard
            delay={0.2}
            icon={<FiActivity className="h-5 w-5 text-[#c0c1ff]" />}
            title={t.capabilities.fleet.title}
            description={t.capabilities.fleet.description}
            footer={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#24ffcd]">{t.capabilities.fleet.footerValue}</span>
              </div>
            }
          />

          <CapabilityCard
            delay={0.3}
            icon={<FiShield className="h-5 w-5 text-[#24ffcd]" />}
            title={t.capabilities.compliance.title}
            description={t.capabilities.compliance.description}
            footer={
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#d8e3fb]">{t.capabilities.compliance.footerValue}</span>
              </div>
            }
          />

          <CapabilityCard
            delay={0.2}
            icon={<FiArchive className="h-5 w-5 text-[#ffb4ab]" />}
            title={t.capabilities.supplyChain.title}
            description={t.capabilities.supplyChain.description}
            footer={
              <span className="inline-block rounded-full border border-[#93000a]/60 bg-[#93000a]/20 px-3 py-1 text-xs font-semibold text-[#ffb4ab]">
                {t.capabilities.supplyChain.alertLabel}
              </span>
            }
          />

          <CapabilityCard
            delay={0.3}
            icon={<FiCreditCard className="h-5 w-5 text-[#24ffcd]" />}
            title={t.capabilities.budget.title}
            description={t.capabilities.budget.description}
            footer={
              <div className="flex items-end gap-1">
                {[10, 16, 22, 14, 26].map((h, i) => (
                  <div key={i} className="w-2 rounded-sm bg-[#24ffcd]" style={{ height: `${h}px`, opacity: 0.4 + i * 0.12 }} />
                ))}
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}

function CapabilityCard({
  icon, title, description, footer, delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  footer: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut', delay } },
        hover:   { y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 22 } },
      }}
      initial="hidden"
      whileInView="visible"
      whileHover="hover"
      viewport={{ once: true, margin: '-60px' }}
      className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-[#111c2d]/60 p-6 backdrop-blur-md hover:border-white/20"
    >
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a3548] transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <h3 className="mt-4 text-base font-semibold text-[#d8e3fb]">{title}</h3>
        <p className="mt-2 text-sm leading-5 text-[#c2c6d8]">{description}</p>
      </div>
      <div className="mt-6">{footer}</div>
    </motion.div>
  );
}
