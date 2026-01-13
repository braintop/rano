import { motion } from 'framer-motion';
import { ExternalLink, Shield, Users, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '@/context/LanguageContext';

const heContent = {
  heading: 'חלק מ-',
  headingHighlight: 'Aon',
  headingSuffix: ' העולמית',
  paragraphs: [
    'Aon plc הינה חברת הברוקרים הגדולה בעולם בתחום ניהול סיכונים, ביטוח וביטוח משנה ופתרונות משאבי אנוש. החברה נמנית על רשימת Fortune 500.',
    'סניפיה של Aon פרוסים ביותר מ-120 מדינות ברחבי העולם והיא מעסיקה מעל ל-60,000 אנשי מקצוע אשר מספקים ללקוחותיה פתרונות חדישים ויעילים.',
  ],
  cta: 'בקר באתר Aon Israel',
  features: [
    {
      icon: Shield,
      title: 'ניהול סיכונים',
      description: 'פתרונות מקיפים לניהול סיכונים עסקיים וביטוח',
    },
    {
      icon: Users,
      title: 'משאבי אנוש',
      description: 'ייעוץ פנסיוני וניהול משאבי אנוש',
    },
    {
      icon: TrendingUp,
      title: 'ביטוח משנה',
      description: 'פתרונות ביטוח משנה גלובליים',
    },
  ],
};

const enContent = {
  heading: 'Part of',
  headingHighlight: 'Aon',
  headingSuffix: ' Global',
  paragraphs: [
    'Aon plc is the world’s leading broker in risk management, insurance, reinsurance and human capital solutions, and is listed on the Fortune 500.',
    'With offices in more than 120 countries and over 60,000 professionals, Aon delivers innovative and effective solutions to clients worldwide.',
  ],
  cta: 'Visit Aon Israel website',
  features: [
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Comprehensive solutions for corporate risk and insurance programs.',
    },
    {
      icon: Users,
      title: 'Human Capital',
      description: 'Pension consulting and human capital advisory services.',
    },
    {
      icon: TrendingUp,
      title: 'Reinsurance',
      description: 'Global reinsurance solutions for complex portfolios.',
    },
  ],
};

export const AonSection = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const content = isHebrew ? heContent : enContent;

  return (
    <section className="section-padding bg-navy-gradient text-primary-foreground">
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
              {content.heading}{' '}
              <span className="text-gold">{content.headingHighlight}</span>
              {content.headingSuffix}
            </h2>
            {content.paragraphs.map((text, index) => (
              <p
                key={index}
                className={`text-primary-foreground/80 text-lg leading-relaxed ${
                  index === 0 ? 'mb-6' : 'mb-8'
                }`}
              >
                {text}
              </p>
            ))}
            
            <div className="flex flex-wrap gap-4">
                  <Button variant="gold" size="lg" asChild>
                    <a
                      href="https://www.aon.com/israel/default.jsp"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content.cta}
                      <ExternalLink size={18} />
                    </a>
                  </Button>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {content.features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4 p-6 rounded-xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-primary-foreground/70">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
