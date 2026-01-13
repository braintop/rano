import { motion } from 'framer-motion';
import { ExternalLink, Newspaper } from 'lucide-react';
import { Button } from './ui/button';

const articles = [
  {
    title: 'ההשלכות המשפטיות הבלתי צפויות של מתקפות סייבר',
    source: 'Globes Israel (English)',
    description: 'מאמר מקיף על ההשלכות המשפטיות של מתקפות סייבר על חברות ישראליות',
    link: 'http://www.globes.co.il/en/article-the-unexpected-legal-consequences-of-cyber-attacks-1001176111',
    date: '2023',
  },
  {
    title: 'סייבר וביטוח - מה כל מנהל חייב לדעת',
    source: 'Forbes Israel (Hebrew)',
    description: 'מדריך מקיף למנהלים בכירים בנושא ביטוח סייבר וניהול סיכונים דיגיטליים',
    link: 'http://m.forbes.co.il/news/new.aspx?Pn6VQ=EG&0r9VQ=EIHKM',
    date: '2023',
  },
  {
    title: 'D&O וחשיפות סייבר לחברות ציבוריות',
    source: 'הרצאה - אירוע חברות ציבוריות',
    description: 'מצגת מקצועית בנושא חבות דירקטורים ונושאי משרה וחשיפות סייבר',
    link: '#',
    date: '2022',
  },
  {
    title: 'חדשנות רפואית והשלכות ביטוחיות',
    source: 'Israel Bio-Executive Forum',
    description: 'הרצאה על ניהול סיכונים בתעשיית הביו-טק והמכשור הרפואי',
    link: '#',
    date: '2022',
  },
];

export const Articles = () => {
  return (
    <section id="articles" className="section-padding bg-background">
      <div className="container-narrow" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            מאמרים ו<span className="text-gold">פרסומים</span>
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            תובנות מקצועיות בנושאי סייבר, ביטוח וניהול סיכונים
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {articles.map((article, index) => (
            <motion.article
              key={article.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group card-elevated rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper className="w-5 h-5 text-gold" />
                  <span className="text-sm text-gold font-medium">{article.source}</span>
                  <span className="text-sm text-muted-foreground mr-auto">{article.date}</span>
                </div>
                
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3 group-hover:text-gold transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {article.description}
                </p>
                
                {article.link !== '#' && (
                  <Button variant="ghost" size="sm" className="text-gold hover:text-gold-dark p-0" asChild>
                    <a href={article.link} target="_blank" rel="noopener noreferrer">
                      קרא עוד
                      <ExternalLink size={16} className="mr-1" />
                    </a>
                  </Button>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
