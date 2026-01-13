import { motion } from 'framer-motion';
import { Shield, Laptop, Building, Users, Scale, Plane } from 'lucide-react';

const expertiseAreas = [
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
    description: 'ליווי חברות ישראליות בפעילות גלובלית וניהול סיכונים בינלאומי',
  },
];

export const Expertise = () => {
  return (
    <section id="expertise" className="section-padding bg-secondary/30">
      <div className="container-narrow" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            תחומי <span className="text-gold">התמחות</span>
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            מומחיות רב-תחומית בניהול סיכונים ופתרונות ביטוח מתקדמים
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expertiseAreas.map((area, index) => (
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
