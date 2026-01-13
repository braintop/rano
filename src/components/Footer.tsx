import { Linkedin, Facebook, Twitter } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/in/ranweinstock/', label: 'LinkedIn' },
  { icon: Facebook, href: 'https://www.facebook.com/Weinstock.Ran/', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/ranweinstock1', label: 'Twitter' },
];

export const Footer = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  return (
    <footer className="bg-navy-gradient text-primary-foreground py-12">
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className={`text-center ${isHebrew ? 'md:text-right' : 'md:text-left'}`}>
            <p className="font-serif text-2xl font-bold mb-2">
              {isHebrew ? (
                <>
                  רן <span className="text-gold">ויינשטוק</span>
                </>
              ) : (
                <>
                  Ran <span className="text-gold">Weinstock</span>
                </>
              )}
            </p>
            <p className="text-primary-foreground/60 text-sm">
              Senior Vice President | AON Israel
            </p>
          </div>

          <div className="flex gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/60 hover:text-gold hover:border-gold transition-colors"
                aria-label={label}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center">
          <p className="text-primary-foreground/40 text-sm">
            {isHebrew
              ? `© ${new Date().getFullYear()} רן ויינשטוק. כל הזכויות שמורות.`
              : `© ${new Date().getFullYear()} Ran Weinstock. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
};
