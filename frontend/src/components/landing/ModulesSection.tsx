import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiGitBranch, FiCheckSquare, FiCalendar, FiFileText, FiFolder,
  FiList, FiBell, FiBarChart2, FiPackage, FiShoppingCart,
  FiDollarSign, FiTrendingUp, FiMap, FiTruck, FiBook,
  FiLink, FiDroplet, FiArchive, FiUsers, FiUser, FiChevronDown,
  FiCheck,
} from 'react-icons/fi';
import { IconType } from 'react-icons';
import { Expandable, ExpandableTrigger, ExpandableContent } from '@/components/ui/expandable';
import { useLandingLanguage } from './LanguageContext';

const iconMap: Record<string, IconType> = {
  FiGitBranch, FiCheckSquare, FiCalendar, FiFileText, FiFolder,
  FiList, FiBell, FiBarChart2, FiPackage, FiShoppingCart,
  FiDollarSign, FiTrendingUp, FiMap, FiTruck, FiBook,
  FiLink, FiDroplet, FiArchive, FiUsers, FiUser,
};

const accentColors = [
  '#b3c5ff', '#24ffcd', '#c0c1ff', '#ffb4ab', '#b3c5ff',
  '#24ffcd', '#c0c1ff', '#b3c5ff', '#24ffcd', '#ffb4ab',
  '#b3c5ff', '#24ffcd', '#c0c1ff', '#b3c5ff', '#24ffcd',
  '#c0c1ff', '#ffb4ab', '#b3c5ff', '#24ffcd', '#c0c1ff',
];

export default function ModulesSection() {
  const { t } = useLandingLanguage();
  const modules = t.modules;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i));

  return (
    <section className="px-6 py-24 md:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            className="text-[28px] font-semibold text-[#d8e3fb] md:text-[32px]"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {modules.title}
          </h2>
        </motion.div>

        {/* items-start prevents grid row height equalization from making other cards stretch */}
        <div className="mt-12 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {modules.items.map((mod, i) => {
            const Icon = iconMap[mod.icon] ?? FiFileText;
            const accent = accentColors[i % accentColors.length];
            const isOpen = openIndex === i;

            return (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: (i % 4) * 0.07 }}
                className="relative overflow-hidden rounded-2xl border transition-colors duration-200"
                style={{
                  borderColor: isOpen ? `${accent}55` : 'rgba(255,255,255,0.08)',
                  background: isOpen
                    ? `linear-gradient(160deg, ${accent}08 0%, #09162300 60%), #0a1828`
                    : '#0a1828',
                }}
              >
                {/* Accent top strip — only visible when open */}
                {isOpen && (
                  <div
                    className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: `linear-gradient(90deg, ${accent}, ${accent}44)` }}
                  />
                )}

                <Expandable
                  expandDirection="vertical"
                  expandBehavior="push"
                  expanded={isOpen}
                  onToggle={() => toggle(i)}
                >
                  {() => (
                    <>
                      <ExpandableTrigger>
                        <div className="flex items-center gap-3.5 px-5 py-5">
                          {/* Icon badge */}
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: `${accent}18`, color: accent }}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </div>

                          <span className="flex-1 text-[15px] font-medium leading-snug text-[#d0dcf4]">
                            {mod.title}
                          </span>

                          <FiChevronDown
                            className="h-4 w-4 shrink-0 text-[#5a6478] transition-transform duration-300"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          />
                        </div>
                      </ExpandableTrigger>

                      <ExpandableContent preset="fade">
                        <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: `${accent}22` }}>
                          <p className="text-[13px] leading-[1.65] text-[#8c97b0]">
                            {mod.description}
                          </p>
                          <ul className="mt-4 space-y-2.5">
                            {mod.features.map((f) => (
                              <li key={f} className="flex items-start gap-2">
                                <FiCheck
                                  className="mt-[2px] h-3.5 w-3.5 shrink-0"
                                  style={{ color: accent }}
                                />
                                <span className="text-[13px] leading-[1.5] text-[#6b7894]">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </ExpandableContent>
                    </>
                  )}
                </Expandable>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
