import { Linkedin, Facebook, Twitter } from 'lucide-react';

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/in/ranweinstock/', label: 'LinkedIn' },
  { icon: Facebook, href: 'https://www.facebook.com/Weinstock.Ran/', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/ranweinstock1', label: 'Twitter' },
];

export const Footer = () => {
  return (
    <footer className="bg-navy-gradient text-primary-foreground py-12">
      <div className="container-narrow" dir="rtl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right">
            <p className="font-serif text-2xl font-bold mb-2">
              רן <span className="text-gold">ויינשטוק</span>
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
            © {new Date().getFullYear()} רן ויינשטוק. כל הזכויות שמורות.
          </p>
        </div>
      </div>
    </footer>
  );
};
