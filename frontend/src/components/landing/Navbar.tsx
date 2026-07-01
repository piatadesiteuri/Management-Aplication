import { Link, useLocation } from 'react-router-dom';
import { useLandingLanguage, type Lang } from './LanguageContext';
import { useContactForm } from './ContactFormContext';
import logoCoreImg from '../../assets/landing/LogiCore_logo.png';

export default function Navbar() {
  const { pathname } = useLocation();
  const { t, lang, setLang } = useLandingLanguage();
  const { open: openContact } = useContactForm();

  const navLinks = [
    { label: t.nav.links.solutions,  to: '/',         href: null,             action: null },
    { label: t.nav.links.platform,   to: null,        href: '/#capabilities', action: null },
    { label: t.nav.links.enterprise, to: null,        href: '/#cta',          action: null },
    { label: t.nav.links.pricing,    to: '/pricing',  href: null,             action: null },
    { label: t.nav.contact,          to: null,        href: null,             action: openContact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#081425]/80 backdrop-blur-md px-6 md:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between py-3">
        <Link to="/" className="flex items-center">
          <img src={logoCoreImg} alt="LogiCore" className="h-12 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = link.to !== null && pathname === link.to;
            const className = `text-sm font-medium transition-colors ${
              isActive
                ? 'text-[#b3c5ff] underline decoration-2 underline-offset-8'
                : 'text-[#c2c6d8] hover:text-[#d8e3fb]'
            }`;

            if (link.action) {
              return (
                <button key={link.label} onClick={link.action} className={`${className} border-0 bg-transparent p-0 outline-none focus:outline-none`}>
                  {link.label}
                </button>
              );
            }

            return link.to !== null ? (
              <Link key={link.label} to={link.to} className={className}>
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href ?? '#'} className={className}>
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-[#0066ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(0,102,255,0.35)] transition-all hover:scale-105 hover:bg-[#1a75ff] active:scale-95"
          >
            {t.nav.login}
          </Link>
          <div className="flex items-center rounded-xl gap-1 border border-[#424656] bg-white/5 p-1">
            {(['ro', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-all ${
                  lang === l
                    ? 'bg-[#b3c5ff]/20 text-[#b3c5ff]'
                    : 'text-[#8c90a1] hover:text-[#c2c6d8]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
