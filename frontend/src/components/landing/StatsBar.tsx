import { FiTruck, FiFileText, FiCheckCircle, FiPieChart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLandingLanguage } from './LanguageContext';

const statsMeta = [
  { icon: FiTruck,        value: '24',  progress: 86, accent: '#b3c5ff' },
  { icon: FiFileText,     value: '142',              accent: '#24ffcd' },
  { icon: FiCheckCircle,  value: '12',               accent: '#c0c1ff' },
  { icon: FiPieChart,     value: '68%', progress: 68, accent: '#24ffcd' },
];

export default function StatsBar() {
  const { t } = useLandingLanguage();
  const stats = t.statsBar.stats.map((stat, i) => ({ ...stat, ...statsMeta[i] }));
  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-6 text-center text-xs font-medium uppercase tracking-[0.1em] text-[#8c90a1]"
        >
          {t.statsBar.subtitle}
        </motion.p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.1 }}
              className="rounded-2xl border-l-2 border border-white/10 bg-[#111c2d]/60 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
              style={{ borderLeftColor: stat.accent }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#8c90a1]">
                  {stat.label}
                </span>
                <stat.icon className="h-4 w-4 text-[#8c90a1]" />
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className="text-2xl font-semibold text-[#d8e3fb]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-[#c2c6d8]">{stat.suffix}</span>
              </div>

              {stat.helper && <p className="mt-1 text-xs text-[#8c90a1]">{stat.helper}</p>}

              {stat.progress !== undefined && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#2a3548]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${stat.progress}%`, backgroundColor: stat.accent }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
