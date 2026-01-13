import { motion } from 'framer-motion';
import { Quote, Linkedin } from 'lucide-react';
import { Button } from './ui/button';

const testimonials = [
  {
    quote: 'רן הוא אחד האנשי מקצוע המוכשרים והמסורים שאיתם עבדתי. המומחיות שלו בתחום ביטוח הסייבר יוצאת דופן והוא תמיד נותן פתרונות יצירתיים ומותאמים אישית.',
    author: 'מנכ"ל חברת הייטק',
    position: 'לקוח',
  },
  {
    quote: 'הידע המשפטי והביטוחי של רן, בשילוב עם הגישה האישית והמקצועית שלו, הפכו אותו לשותף אסטרטגי בניהול הסיכונים של החברה שלנו.',
    author: 'סמנכ"ל כספים',
    position: 'חברת ביו-טק',
  },
  {
    quote: 'רן מביא איתו ניסיון בינלאומי רב וראייה גלובלית שעזרו לנו להבין את החשיפות שלנו בצורה מקיפה ולבנות תוכנית ביטוח מותאמת.',
    author: 'יו"ר דירקטוריון',
    position: 'סטארט-אפ',
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="section-padding bg-secondary/50">
      <div className="container-narrow" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            מה אומרים <span className="text-gold">עליי</span>
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6" />
          <p className="text-muted-foreground text-lg">
            המלצות מלקוחות ושותפים עסקיים
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="bg-card rounded-xl p-6 shadow-md relative"
            >
              <Quote className="absolute top-6 left-6 w-10 h-10 text-gold/20" />
              
              <p className="text-foreground/80 mb-6 leading-relaxed relative z-10">
                "{item.quote}"
              </p>
              
              <div className="border-t border-border pt-4">
                <p className="font-semibold text-foreground">{item.author}</p>
                <p className="text-sm text-muted-foreground">{item.position}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Button variant="navy" size="lg" asChild>
            <a
              href="https://www.linkedin.com/in/ranweinstock/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin size={20} />
              צפה בהמלצות נוספות ב-LinkedIn
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
