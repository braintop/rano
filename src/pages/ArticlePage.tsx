import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { Share2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { ReadOnlyRichText } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';

type ArticleStatus = 'draft' | 'published';

type ArticleDoc = {
  id: string;
  slug?: string;
  status?: ArticleStatus;
  titleHe?: string;
  subtitleHe?: string;
  bodyHe?: string;
  titleEn?: string;
  subtitleEn?: string;
  bodyEn?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '');

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const [article, setArticle] = useState<ArticleDoc | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        console.log('ArticlePage: No slug provided');
        return;
      }
      
      console.log('ArticlePage: Loading article with slug:', slug);
      
      try {
        setIsLoading(true);

        // Query by slug field (works with Firebase Rules: allow list: if true)
        const q = query(
          collection(db, 'articles'),
          where('slug', '==', slug),
          limit(1),
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data() as any;
          console.log('ArticlePage: Found article:', data);
          
          // Firebase Rules already filter published articles, but double-check
          if (data.status === 'published') {
            setArticle({
              id: docSnap.id,
              ...data,
            });
          } else {
            console.log('ArticlePage: Article is not published, status:', data.status);
            setArticle(null);
          }
        } else {
          console.log('ArticlePage: Article not found with slug:', slug);
          setArticle(null);
        }
      } catch (error) {
        console.error('Error loading article page:', error);
        setArticle(null);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [slug]);

  const title =
    (isHebrew ? article?.titleHe : article?.titleEn) ??
    article?.titleHe ??
    article?.titleEn ??
    article?.slug ??
    '';

  const subtitle =
    (isHebrew ? article?.subtitleHe : article?.subtitleEn) ??
    article?.subtitleHe ??
    article?.subtitleEn ??
    '';

  const bodyHtml =
    (isHebrew ? article?.bodyHe : article?.bodyEn) ??
    article?.bodyHe ??
    article?.bodyEn ??
    '';

  // Debug log for mobile
  useEffect(() => {
    if (article) {
      console.log('ArticlePage: Article loaded, bodyHtml length:', bodyHtml?.length || 0);
      console.log('ArticlePage: bodyHe:', article.bodyHe?.substring(0, 100));
      console.log('ArticlePage: bodyEn:', article.bodyEn?.substring(0, 100));
    }
  }, [article, bodyHtml]);

  const created =
    article?.createdAt?.seconds != null
      ? new Date(article.createdAt.seconds * 1000)
      : null;

  const plainBody = stripHtml(bodyHtml);

  return (
    <main className="overflow-x-hidden">
      <Header />
      <section className="pt-32 pb-20 bg-background">
        <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
          {isLoading ? (
            <p className="text-muted-foreground">
              {isHebrew ? 'טוען מאמר...' : 'Loading article...'}
            </p>
          ) : !article ? (
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">
                {isHebrew ? 'המאמר לא נמצא או עדיין בטיוטה' : 'Article not found or still in draft'}
              </h1>
              <p className="text-muted-foreground">
                {isHebrew 
                  ? 'המאמר שחיפשת אינו זמין. ייתכן שהוא עדיין בטיוטה או שהקישור שגוי.'
                  : 'The article you are looking for is not available. It may still be a draft or the link is incorrect.'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Slug:</strong> {slug}
              </p>
              <Link
                to="/#blog-articles"
                className="text-sm text-gold hover:underline inline-block"
              >
                {isHebrew ? 'חזרה לרשימת המאמרים' : 'Back to articles'}
              </Link>
            </div>
          ) : (
            <article className="space-y-8">
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono text-[11px]">
                        /articles/{article.slug ?? article.id}
                      </span>
                    </p>
                    <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-lg text-muted-foreground">{subtitle}</p>
                    )}
                    {created && (
                      <p className="text-xs text-muted-foreground">
                        {isHebrew ? 'פורסם בתאריך ' : 'Published on '}
                        {created.toLocaleDateString(
                          isHebrew ? 'he-IL' : 'en-GB',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          },
                        )}
                      </p>
                    )}
                    {plainBody && (
                      <p className="text-xs text-muted-foreground">
                        {isHebrew
                          ? `${Math.max(
                              1,
                              Math.round(plainBody.length / 800),
                            )} דקות קריאה`
                          : `${Math.max(
                              1,
                              Math.round(plainBody.length / 800),
                            )} min read`}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      const url = window.location.href;
                      const text = encodeURIComponent(
                        `${title}\n\n${url}`
                      );
                      window.open(
                        `https://wa.me/?text=${text}`,
                        '_blank'
                      );
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
                    size="lg"
                    title={isHebrew ? 'שתף בוואטסאפ' : 'Share on WhatsApp'}
                  >
                    <Share2 className="h-5 w-5 ml-2" />
                    {isHebrew ? 'שתף' : 'Share'}
                  </Button>
                </div>
              </motion.header>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={cn(
                  'prose max-w-none text-foreground article-body',
                  isHebrew && 'prose-rtl',
                )}
                dir={isHebrew ? 'rtl' : 'ltr'}
              >
                {bodyHtml ? (
                  <ReadOnlyRichText value={bodyHtml} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {isHebrew ? '[תוכן המאמר ריק או לא נטען]' : '[Article body is empty or not loaded]'}
                  </p>
                )}
              </motion.div>

              <div className="pt-8">
                <Link
                  to="/#blog-articles"
                  className="text-sm text-gold hover:underline"
                >
                  {isHebrew ? '← חזרה למאמרים' : '← Back to articles'}
                </Link>
              </div>
            </article>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
};

export default ArticlePage;

