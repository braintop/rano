import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

type ArticleDoc = {
  id: string;
  slug?: string;
  status?: 'draft' | 'published';
  titleHe?: string;
  subtitleHe?: string;
  bodyHe?: string;
  titleEn?: string;
  subtitleEn?: string;
  bodyEn?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '');

export const BlogArticles = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setIsLoading(true);
        const snap = await getDocs(collection(db, 'articles'));
        const docs: ArticleDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            slug: data.slug,
            status: data.status,
            titleHe: data.titleHe,
            subtitleHe: data.subtitleHe,
            bodyHe: data.bodyHe,
            titleEn: data.titleEn,
            subtitleEn: data.subtitleEn,
            bodyEn: data.bodyEn,
            createdAt: data.createdAt,
          };
        });

        const published = docs.filter(
          (a) => !a.status || a.status === 'published',
        );

        published.sort((a, b) => {
          const aTs = a.createdAt?.seconds ?? 0;
          const bTs = b.createdAt?.seconds ?? 0;
          return bTs - aTs;
        });

        setArticles(published);
      } catch (error) {
        console.error('Error loading articles for homepage:', error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadArticles();
  }, []);

  const heading = isHebrew ? 'מאמרים' : 'Articles';
  const description = isHebrew
    ? 'כל המאמרים המקצועיים שאתה מעלה במערכת הניהול, מרוכזים כאן במקום אחד.'
    : 'All the professional articles you publish in the back office, in one place.';

  return (
    <section id="blog-articles" className="section-padding bg-muted/30">
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {heading}
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {description}
          </p>
        </motion.div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">
            {isHebrew ? 'טוען מאמרים...' : 'Loading articles...'}
          </p>
        ) : articles.length === 0 ? (
          <p className="text-center text-muted-foreground">
            {isHebrew
              ? 'עדיין לא פורסמו מאמרים דרך המערכת.'
              : 'No articles have been published yet.'}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {articles.map((article, index) => {
              const title = isHebrew
                ? article.titleHe || article.titleEn || article.slug || ''
                : article.titleEn || article.titleHe || article.slug || '';
              const subtitle = isHebrew
                ? article.subtitleHe || ''
                : article.subtitleEn || '';
              const bodyHtml = isHebrew
                ? article.bodyHe || ''
                : article.bodyEn || '';
              const bodyText = stripHtml(bodyHtml);
              const excerpt =
                (subtitle || bodyText).slice(0, 220) +
                ((subtitle || bodyText).length > 220 ? '…' : '');

              const created =
                article.createdAt?.seconds != null
                  ? new Date(article.createdAt.seconds * 1000)
                  : null;

              const slugOrId = article.slug || article.id;

              return (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.05 * index }}
                  className="group card-elevated rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-card"
                >
                  <Link
                    to={`/articles/${slugOrId}`}
                    className="block p-6 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="w-4 h-4 text-gold" />
                      {created && (
                        <span>
                          {created.toLocaleDateString(
                            isHebrew ? 'he-IL' : 'en-GB',
                          )}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-gold transition-colors">
                      {title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {excerpt}
                    </p>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogArticles;

