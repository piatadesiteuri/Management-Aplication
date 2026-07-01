import { useLandingLanguage } from './LanguageContext';
import logoCoreImg from '../../assets/landing/LogiCore_logo.png';

export default function Footer() {
  const { t } = useLandingLanguage();
  return (
    <footer className="border-t border-white/10 px-6 py-8 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <img src={logoCoreImg} alt="LogiCore" className="h-7 w-auto" />
        <p className="text-xs text-[#8c90a1]">
          {t.footer.copyright.replace('{year}', String(new Date().getFullYear()))}
        </p>
      </div>
    </footer>
  );
}
