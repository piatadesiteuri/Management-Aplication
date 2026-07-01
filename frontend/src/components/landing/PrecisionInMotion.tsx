import { FiFileText, FiShield, FiSend, FiCheckSquare } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLandingLanguage } from './LanguageContext';
import { FractalDotGrid } from './FractalDotGrid';

const stepIcons = [FiFileText, FiShield, FiSend, FiCheckSquare];

export default function PrecisionInMotion() {
  const { t } = useLandingLanguage();
  const steps = t.precisionInMotion.steps.map((step, i) => ({
    icon: stepIcons[i],
    title: step.title,
    description: step.description,
  }));
  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-12">
      <FractalDotGrid
        dotColor="rgba(179, 197, 255, 1)"
        glowColor="rgba(179, 197, 255, 1)"
        dotOpacity={0.2}
        dotSpacing={25}
        waveIntensity={12}
        waveRadius={220}
        enableMouseGlow={false}
      />
      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"
        >
          <div>
            <h2
              className="text-2xl font-semibold text-[#d8e3fb] md:text-[28px]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t.precisionInMotion.title}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#c2c6d8]">
              {t.precisionInMotion.description}
            </p>
          </div>
        </motion.div>

        <div className="relative mt-16 grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-y-0">
          <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-[#424656] md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.12 }}
              className="group relative flex flex-col items-center text-center"
            >
              <div className="z-10 flex h-16 w-16 items-center justify-center rounded-full border border-[#424656] bg-[#152031] transition-all duration-500 group-hover:scale-110 group-hover:border-[#b3c5ff]/50">
                <step.icon className="h-7 w-7 text-[#b3c5ff]" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#d8e3fb]">{step.title}</h3>
              <p className="mt-1 max-w-[160px] text-xs leading-5 text-[#c2c6d8]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
