import { useRef, useState, useEffect } from 'react';
import { FiFileText, FiShield, FiSend, FiCheckSquare } from 'react-icons/fi';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useLandingLanguage } from './LanguageContext';
import { FractalDotGrid } from './FractalDotGrid';

const stepIcons = [FiFileText, FiShield, FiSend, FiCheckSquare];

export default function PrecisionInMotion() {
  const { t } = useLandingLanguage();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 85%', 'end 15%'],
  });

  const rawPathLength = useTransform(
    scrollYProgress,
    [0.13, 0.30, 0.47, 0.64],
    [0, 1 / 3, 2 / 3, 1],
  );
  const pathLength = useSpring(rawPathLength, { stiffness: 80, damping: 20 });

  const opacity0 = useTransform(scrollYProgress, [0.15, 0.28], [0, 1]);
  const y0       = useTransform(scrollYProgress, [0.15, 0.28], [24, 0]);
  const opacity1 = useTransform(scrollYProgress, [0.30, 0.43], [0, 1]);
  const y1       = useTransform(scrollYProgress, [0.30, 0.43], [24, 0]);
  const opacity2 = useTransform(scrollYProgress, [0.45, 0.58], [0, 1]);
  const y2       = useTransform(scrollYProgress, [0.45, 0.58], [24, 0]);
  const opacity3 = useTransform(scrollYProgress, [0.60, 0.73], [0, 1]);
  const y3       = useTransform(scrollYProgress, [0.60, 0.73], [24, 0]);

  const stepOpacities = [opacity0, opacity1, opacity2, opacity3];
  const stepYOffsets  = [y0, y1, y2, y3];

  const steps = t.precisionInMotion.steps.map((step, i) => ({
    icon: stepIcons[i],
    title: step.title,
    description: step.description,
  }));

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-6 py-24 md:px-12">
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

        <div className="relative mx-auto mt-16 max-w-3xl">
          {!isMobile && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M 25 12.5 C 25 25 75 25 75 37.5 C 75 50 25 50 25 62.5 C 25 75 75 75 75 87.5"
                fill="none"
                stroke="#b3c5ff"
                strokeOpacity={0.35}
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
                style={{ pathLength }}
              />
            </svg>
          )}

          {isMobile && (
            <motion.div
              className="absolute bottom-8 left-8 top-8 w-px origin-top bg-[#b3c5ff]/30"
              style={{ scaleY: pathLength }}
            />
          )}

          {steps.map((step, i) => {
            const isOdd = i % 2 !== 0;
            const opacity = stepOpacities[i];
            const y = stepYOffsets[i];

            const iconEl = (
              <div className="flex w-1/2 justify-center py-16">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#424656] bg-[#152031] transition-all duration-500 hover:scale-110 hover:border-[#b3c5ff]/50">
                  <step.icon className="h-10 w-10 text-[#b3c5ff]" />
                </div>
              </div>
            );

            const textEl = (
              <div
                className={`flex w-1/2 flex-col justify-center py-16 ${
                  isOdd ? 'pr-8 text-right' : 'pl-8 text-left'
                }`}
              >
                <h3 className="text-base font-semibold text-[#d8e3fb]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#c2c6d8]">{step.description}</p>
              </div>
            );

            return (
              <motion.div key={step.title} style={{ opacity, y }} className="w-full">
                {/* Mobile: icon left, text right */}
                <div className="flex flex-row items-center gap-6 md:hidden">
                  <div className="flex-shrink-0 pl-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#424656] bg-[#152031]">
                      <step.icon className="h-9 w-9 text-[#b3c5ff]" />
                    </div>
                  </div>
                  <div className="py-10">
                    <h3 className="text-base font-semibold text-[#d8e3fb]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#c2c6d8]">{step.description}</p>
                  </div>
                </div>

                {/* Desktop: zigzag */}
                <div className="hidden items-stretch md:flex">
                  {isOdd ? <>{textEl}{iconEl}</> : <>{iconEl}{textEl}</>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
