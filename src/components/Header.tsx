import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '@/context/LanguageContext';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const navLinks =
    language === 'he'
      ? [
          { href: '#about', label: 'אודות' },
          { href: '#expertise', label: 'התמחויות' },
          { href: '#articles', label: 'מאמרים' },
          { href: '#testimonials', label: 'המלצות' },
          { href: '#contact', label: 'צור קשר' },
        ]
      : [
          { href: '#about', label: 'About' },
          { href: '#expertise', label: 'Expertise' },
          { href: '#articles', label: 'Articles' },
          { href: '#testimonials', label: 'Testimonials' },
          { href: '#contact', label: 'Contact' },
        ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHebrew = language === 'he';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-card/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container-narrow">
        <nav
          className="flex items-center justify-between h-20 gap-4"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          <a href="#" className="font-serif text-2xl font-bold text-primary">
            {isHebrew ? (
              <>
                רן <span className="text-gold">וינשטוק</span>
              </>
            ) : (
              <>
                Ran <span className="text-gold">Weinstock</span>
              </>
            )}
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div
              className="flex items-center gap-6"
              dir={isHebrew ? 'rtl' : 'ltr'}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground/80 hover:text-gold transition-colors duration-300 font-medium"
                >
                  {link.label}
                </a>
              ))}
              <Button variant="gold" size="sm" asChild>
                <a href="#contact">
                  {isHebrew ? 'בואו נדבר' : "Let's talk"}
                </a>
              </Button>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center gap-2 border border-border rounded-full px-2 py-1 bg-background/70">
              <button
                type="button"
                onClick={() => setLanguage('he')}
                className={`px-2 text-lg ${
                  isHebrew ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                }`}
                aria-label="עברית"
              >
                🇮🇱
              </button>
              <span className="h-4 w-px bg-border" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 text-lg ${
                  !isHebrew ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                }`}
                aria-label="English"
              >
                🇺🇸
              </button>
            </div>
          </div>

          {/* Mobile Menu + Language Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex items-center gap-1 border border-border rounded-full px-2 py-0.5 bg-background/70">
              <button
                type="button"
                onClick={() => setLanguage('he')}
                className={`text-base ${
                  isHebrew ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                }`}
                aria-label="עברית"
              >
                🇮🇱
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`text-base ${
                  !isHebrew ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                }`}
                aria-label="English"
              >
                🇺🇸
              </button>
            </div>

            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-card border-t border-border"
            >
              <div
                className="flex flex-col py-4 gap-4"
                dir={isHebrew ? 'rtl' : 'ltr'}
              >
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-foreground/80 hover:text-gold transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="px-4">
                  <Button variant="gold" className="w-full" asChild>
                    <a href="#contact">
                      {isHebrew ? 'בואו נדבר' : "Let's talk"}
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
