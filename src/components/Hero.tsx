import { motion } from 'framer-motion';
import { Linkedin, Facebook, Twitter, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '@/context/LanguageContext';

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/in/ranweinstock/', label: 'LinkedIn' },
  { icon: Facebook, href: 'https://www.facebook.com/Weinstock.Ran/', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/ranweinstock1', label: 'Twitter' },
];

export const Hero = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  return (
    <section className="relative min-h-screen bg-navy-gradient overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container-narrow relative z-10 min-h-screen flex items-center">
        <div
          className="grid lg:grid-cols-2 gap-12 items-center w-full py-32"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={isHebrew ? 'text-right' : 'text-left'}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gold font-medium mb-4 tracking-wide"
            >
              Senior Vice President
            </motion.p>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              {isHebrew ? (
                <>
                  רן
                  <br />
                  <span className="text-gold">וינשטוק</span>
                </>
              ) : (
                <>
                  Ran
                  <br />
                  <span className="text-gold">Weinstock</span>
                </>
              )}
            </h1>

            <p className="text-xl text-primary-foreground/80 mb-4 font-medium">
              {isHebrew ? 'סמנכ״ל בכיר | AON Israel' : 'Senior Vice President | AON Israel'}
            </p>

            <p className="text-lg text-primary-foreground/60 mb-8 max-w-md leading-relaxed">
              {isHebrew
                ? 'יותר מ-20 שנות ניסיון בפיתוח עסקי, ניהול סיכונים וביטוח סייבר עבור חברות היי-טק, ביו-טק וסטארט-אפים בישראל'
                : 'Over 20 years of experience in business development, risk management and cyber insurance for high-tech, biotech and start-up companies in Israel.'}
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Button
                variant="gold"
                size="xl"
                asChild
                className="relative shadow-[0_0_28px_rgba(228,0,43,0.45)] hover:shadow-[0_0_40px_rgba(228,0,43,0.55)]"
              >
                <motion.a
                  href="https://smart.fnx.co.il/Travel/landing.html?id=1XQQswJ%20GT8%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  animate={{ scale: [1, 1.05, 1], opacity: [1, 0.92, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                >
                  {isHebrew ? 'לקבלת הצעה ביטוח נסיעות לחו״ל' : 'Travel insurance quote'}
                </motion.a>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <a href="#about">
                  {isHebrew ? 'קרא עוד' : 'Read more'}
                </a>
              </Button>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-12 h-12 rounded-full border border-primary-foreground/20 flex items-center justify-center text-primary-foreground/60 hover:text-gold hover:border-gold transition-colors"
                  aria-label={label}
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative w-72 h-72 lg:w-80 lg:h-80 mx-auto">
              {/* Gold accent ring */}
              <div className="absolute -inset-4 rounded-full border-2 border-gold/30" />
              <div className="absolute -inset-8 rounded-full border border-gold/10" />

              <div className="w-full h-full rounded-full overflow-hidden border-4 border-gold shadow-2xl">
                <img
                  src="/ran.png"
                  alt="רן וינשטוק"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.a
          href="#about"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-primary-foreground/40 hover:text-gold transition-colors"
        >
          <ChevronDown size={32} />
        </motion.a>
      </motion.div>
    </section>
  );
};
