import { motion } from 'framer-motion';
import { Award, Globe, GraduationCap, Briefcase } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const heContent = {
  stats: [
    { number: '18+', label: 'שנות ניסיון' },
    { number: '80+', label: 'מדינות שביקר' },
    { number: '6', label: 'מאמרים שפורסמו' },
    { number: '42.2', label: 'קילומטר מרתון' },
  ],
  highlights: [
    {
      icon: Briefcase,
      title: 'פיתוח עסקי',
      description:
        'מומחה בפיתוח עסקי, רכישת לקוחות ומשא ומתן ברמה בכירה עם מנהלי C-Level',
    },
    {
      icon: Award,
      title: 'התמחות בסייבר',
      description: 'יועץ מוביל בתחום ביטוח סייבר וניהול סיכונים דיגיטליים',
    },
    {
      icon: GraduationCap,
      title: 'השכלה משפטית',
      description: 'תואר שני במשפטים מאוניברסיטת בר-אילן',
    },
    {
      icon: Globe,
      title: 'ניסיון בינלאומי',
      description: 'גדל בירושלים, קניה ודנמרק, ניסיון גלובלי רחב',
    },
  ],
  heading: 'אודות',
  subTitleHighlight: 'רן',
  paragraphs: [
    'רן ויינשטוק הוא סמנכ״ל בכיר באיאון ישראל, חלק מ-Aon plc - חברת הברוקרים הגדולה בעולם בתחום ניהול סיכונים, ביטוח וביטוח משנה. לפני כן כיהן כסמנכ״ל ב-Marsh Israel.',
    'עם יותר מ-18 שנות ניסיון בפיתוח עסקי במחלקת סיכונים מיוחדים, מתמחה במתן פתרונות ביטוח וניהול סיכונים לתעשיית ההיי-טק, הביו-טק והסייבר הישראלית.',
    'בוגר תוכנית היזמות TMBA של מיקרוסופט ישראל ותוכנית להב לחדשנות טכנולוגית בתחום הבריאות. שימש כחבר דירקטוריון בחברות הזנק וכיועץ לסטארט-אפים.',
  ],
};

const enContent = {
  stats: [
    { number: '18+', label: 'Years of experience' },
    { number: '80+', label: 'Countries visited' },
    { number: '6', label: 'Published articles' },
    { number: '42.2', label: 'Marathon kilometers' },
  ],
  highlights: [
    {
      icon: Briefcase,
      title: 'Business Development',
      description:
        'Expert in business development, client acquisition and senior-level negotiations with C‑level executives.',
    },
    {
      icon: Award,
      title: 'Cyber Expertise',
      description:
        'Leading advisor in cyber insurance and digital risk management.',
    },
    {
      icon: GraduationCap,
      title: 'Legal Education',
      description: 'LL.M. in Law from Bar-Ilan University.',
    },
    {
      icon: Globe,
      title: 'International Experience',
      description:
        'Raised in Jerusalem, Kenya and Denmark with broad global perspective.',
    },
  ],
  heading: 'About',
  subTitleHighlight: 'Ran',
  paragraphs: [
    'Ran Weinstock is a Senior Vice President at AON Israel, part of Aon plc – the world’s largest broker in risk management, insurance and reinsurance. Previously, he served as a Vice President at Marsh Israel.',
    'With over 18 years of experience in business development within the special risks division, he specializes in providing insurance and risk management solutions for Israel’s high-tech, biotech and cyber industries.',
    'Graduate of Microsoft Israel’s TMBA entrepreneurship program and the Lahav program for technological innovation in healthcare. He has served as a board member in start-ups and as an advisor to early-stage companies.',
  ],
};

export const About = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const content = isHebrew ? heContent : enContent;

  return (
    <section id="about" className="section-padding bg-background">
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {content.heading} <span className="text-gold">{content.subTitleHighlight}</span>
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {content.stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="text-4xl md:text-5xl font-bold text-gold mb-2"
              >
                {stat.number}
              </motion.div>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card-elevated rounded-2xl p-8 md:p-12 mb-16"
        >
          {content.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-lg text-foreground/80 leading-relaxed ${
                index < content.paragraphs.length - 1 ? 'mb-6' : ''
              }`}
            >
              {paragraph}
            </p>
          ))}
        </motion.div>

        {/* Highlights */}
        <div className="grid md:grid-cols-2 gap-6">
          {content.highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="card-elevated rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
