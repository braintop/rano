import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function Accessibility() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-16">
        <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isHebrew ? 'הצהרת נגישות' : 'Accessibility Statement'}
          </h1>
          <div className="w-24 h-1 bg-gold rounded-full mb-8" />

          <div className={`prose prose-neutral max-w-none ${isHebrew ? 'prose-p:text-right prose-li:text-right' : ''}`}>
            {isHebrew ? (
              <>
                <p>
                  אנו שואפים להנגיש את האתר לכלל המשתמשים, כולל אנשים עם מוגבלויות. אנו פועלים ככל האפשר בהתאם להנחיות
                  <strong> WCAG 2.1</strong> ברמת <strong>AA</strong>.
                </p>
                <p className="text-muted-foreground">
                  אם נתקלתם בקושי בגלישה או בצריכת תוכן באתר — נשמח שתעדכנו וננסה לסייע בהקדם.
                </p>

                <h2>מה כבר ביצענו באתר?</h2>
                <ul>
                  <li>מבנה כותרות ותוכן קריא.</li>
                  <li>טקסט חלופי לתמונות (כאשר רלוונטי).</li>
                  <li>רכיבים אינטראקטיביים ניתנים להפעלה במקלדת.</li>
                  <li>ניגודיות וצבעים שנבחרו לשמירה על קריאות.</li>
                </ul>

                <h2>פנייה בנושא נגישות</h2>
                <p>
                  ניתן לפנות אלינו דרך טופס יצירת הקשר באתר, ונשמח לקבל פירוט: כתובת העמוד, סוג הדפדפן/מכשיר, ומה לא עבד.
                </p>
              </>
            ) : (
              <>
                <p>
                  We strive to make this website accessible to all users, including people with disabilities. We aim, where possible,
                  to follow <strong>WCAG 2.1</strong> at the <strong>AA</strong> level.
                </p>
                <p className="text-muted-foreground">
                  If you encounter any accessibility issue, please let us know and we’ll do our best to help promptly.
                </p>

                <h2>What we’ve implemented</h2>
                <ul>
                  <li>Clear content structure and headings.</li>
                  <li>Alternative text for relevant images.</li>
                  <li>Keyboard-operable interactive elements.</li>
                  <li>Color/contrast choices designed for readability.</li>
                </ul>

                <h2>Accessibility contact</h2>
                <p>
                  Please reach out via the website’s contact form with details such as the page URL, your browser/device, and what didn’t work.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

