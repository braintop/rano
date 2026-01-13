import { motion } from 'framer-motion';
import { Shield, Laptop, Building, Users, Scale, Plane } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const heContent = {
  title: 'תחומי',
  highlight: 'התמחות',
  description: 'מומחיות רב-תחומית בניהול סיכונים ופתרונות ביטוח מתקדמים',
  expertiseAreas: [
    {
      icon: Shield,
      title: 'ביטוח סייבר',
      description: 'פתרונות ביטוח מקיפים להגנה מפני איומי סייבר ופריצות מידע',
    },
    {
      icon: Building,
      title: 'D&O - חבות דירקטורים',
      description: 'ביטוח אחריות דירקטורים ונושאי משרה בחברות ציבוריות ופרטיות',
    },
    {
      icon: Laptop,
      title: 'היי-טק וסטארט-אפים',
      description: 'פתרונות ביטוח ייחודיים לחברות טכנולוגיה וסטארט-אפים',
    },
    {
      icon: Users,
      title: 'ביו-טק ומכשור רפואי',
      description: 'ניהול סיכונים מקיף לתעשיית הביו-טכנולוגיה והמכשור הרפואי',
    },
    {
      icon: Scale,
      title: 'ייעוץ משפטי-ביטוחי',
      description: 'שילוב מומחיות משפטית עם ידע ביטוחי מעמיק',
    },
    {
      icon: Plane,
      title: 'פעילות בינלאומית',
      description:
        'ליווי חברות ישראליות בפעילות גלובלית וניהול סיכונים בינלאומי',
    },
  ],
};

const enContent = {
  title: 'Areas of',
  highlight: 'Expertise',
  description:
    'Multi-disciplinary expertise in risk management and advanced insurance solutions.',
  expertiseAreas: [
    {
      icon: Shield,
      title: 'Cyber Insurance',
      description:
        'Comprehensive insurance solutions to protect against cyber threats and data breaches.',
    },
    {
      icon: Building,
      title: 'D&O Liability',
      description:
        'Directors and Officers liability coverage for public and private companies.',
    },
    {
      icon: Laptop,
      title: 'High-Tech & Startups',
      description:
        'Tailored insurance programs for technology companies and startups.',
    },
    {
      icon: Users,
      title: 'Biotech & Medical Devices',
      description:
        'End-to-end risk management for the biotech and medical device industries.',
    },
    {
      icon: Scale,
      title: 'Legal & Insurance Advisory',
      description:
        'Combining legal expertise with deep insurance knowledge for better decision-making.',
    },
    {
      icon: Plane,
      title: 'International Operations',
      description:
        'Supporting Israeli companies in global expansion and international risk management.',
    },
  ],
};

export const Expertise = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const content = isHebrew ? heContent : enContent;

  return (
    <section id="expertise" className="section-padding bg-secondary/30">
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {content.title} <span className="text-gold">{content.highlight}</span>
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {content.description}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.expertiseAreas.map((area, index) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-border/50 hover:border-gold/30"
            >
              <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <area.icon className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2 group-hover:text-gold transition-colors">
                {area.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {area.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
