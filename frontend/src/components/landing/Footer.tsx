import { Link } from 'react-router-dom';
import { useLandingLanguage } from './LanguageContext';
import { useContactForm } from './ContactFormContext';
import logoCoreImg from '../../assets/landing/LogiCore_logo.png';

export default function Footer() {
  const { t } = useLandingLanguage();
  const { open: openContact } = useContactForm();

  return (
    <footer className="border-t border-white/10 px-6 py-8 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <img src={logoCoreImg} alt="LogiCore" className="h-7 w-auto" />

        <nav className="flex items-center gap-6">
          <Link
            to="/privacy"
            className="text-xs text-[#8c90a1] transition-colors hover:text-[#c2c6d8]"
          >
            {t.footer.privacy}
          </Link>
          <Link
            to="/terms"
            className="text-xs text-[#8c90a1] transition-colors hover:text-[#c2c6d8]"
          >
            {t.footer.terms}
          </Link>
          <button
            onClick={openContact}
            className="border-0 bg-transparent p-0 text-xs text-[#8c90a1] outline-none transition-colors hover:text-[#c2c6d8]"
          >
            {t.footer.contact}
          </button>
        </nav>

        <p className="text-xs text-[#8c90a1]">
          {t.footer.copyright.replace('{year}', String(new Date().getFullYear()))}
        </p>
      </div>
    </footer>
  );
}
