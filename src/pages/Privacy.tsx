import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function Privacy() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-28 pb-16">
        <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isHebrew ? 'מדיניות פרטיות' : 'Privacy Policy'}
          </h1>
          <div className="w-24 h-1 bg-gold rounded-full mb-8" />

          <div className={`prose prose-neutral max-w-none ${isHebrew ? 'prose-p:text-right prose-li:text-right' : ''}`}>
            {isHebrew ? (
              <>
                <p>
                  מסמך זה מסביר כיצד האתר אוסף ומשתמש במידע אישי. מטרתנו לשמור על פרטיות המשתמשים ולפעול בהתאם לעקרונות
                  <strong> חוק הגנת הפרטיות, התשמ״א‑1981</strong>.
                </p>
                <p className="text-muted-foreground">
                  הערה: זהו מידע כללי ואינו מהווה ייעוץ משפטי.
                </p>

                <h2>אילו נתונים נאספים?</h2>
                <ul>
                  <li>פרטים שתזינו בטופס יצירת קשר: שם, אימייל, טלפון, חברה ותוכן ההודעה.</li>
                  <li>ככלל, האתר אינו עושה שימוש בעוגיות/מעקב לצרכי פרסום או אנליטיקה (אלא אם יצוין אחרת בעתיד).</li>
                </ul>

                <h2>לשם מה נשתמש במידע?</h2>
                <ul>
                  <li>מענה לפניות ותיאום שיחה/פגישה.</li>
                  <li>שיפור חוויית האתר ותפעול תקין.</li>
                </ul>

                <h2>שיתוף מידע עם צדדים שלישיים</h2>
                <p>
                  לא נמכור או נשכיר מידע אישי. ייתכן שיתוף עם ספקי שירות טכניים רק ככל שנדרש לתפעול האתר/מענה לפניות, ובהתאם
                  להגבלות סודיות ואבטחה סבירות.
                </p>

                <h2>משך שמירת מידע</h2>
                <p>נשמור מידע אישי למשך הזמן הדרוש לצורך טיפול בפנייה, ובהתאם לדרישות דין רלוונטיות ככל שיחולו.</p>

                <h2>זכויות המשתמש</h2>
                <p>
                  ניתן לבקש לעיין, לתקן או למחוק מידע אישי הנוגע אליכם. ניתן לפנות אלינו דרך טופס יצירת הקשר באתר.
                </p>

                <h2>אבטחת מידע</h2>
                <p>
                  אנו נוקטים אמצעי אבטחה סבירים כדי להגן על המידע, אך אין אפשרות להבטיח אבטחה מוחלטת בכל מערכת מקוונת.
                </p>

                <h2>שינויים במדיניות</h2>
                <p>ייתכן שנעדכן מסמך זה מעת לעת. עדכון יפורסם בעמוד זה.</p>
              </>
            ) : (
              <>
                <p>
                  This document explains how the website collects and uses personal information. We aim to protect users’ privacy and
                  follow the principles of applicable privacy laws.
                </p>
                <p className="text-muted-foreground">Note: This is general information and not legal advice.</p>

                <h2>What data do we collect?</h2>
                <ul>
                  <li>Information you enter in the contact form: name, email, phone, company and message content.</li>
                  <li>As a rule, the website does not use advertising/analytics cookies (unless stated otherwise in the future).</li>
                </ul>

                <h2>How do we use the data?</h2>
                <ul>
                  <li>To respond to inquiries and coordinate a call/meeting.</li>
                  <li>To operate the website and improve the user experience.</li>
                </ul>

                <h2>Sharing with third parties</h2>
                <p>
                  We do not sell or rent personal information. We may share information with technical service providers only as needed
                  to operate the website or respond to inquiries, subject to reasonable confidentiality and security obligations.
                </p>

                <h2>Data retention</h2>
                <p>We keep personal information as long as needed to handle your inquiry and as required by applicable law.</p>

                <h2>Your rights</h2>
                <p>You may request to access, correct, or delete your personal information. Please contact us via the website’s contact form.</p>

                <h2>Security</h2>
                <p>We take reasonable security measures, but no online system can guarantee absolute security.</p>

                <h2>Updates</h2>
                <p>We may update this policy from time to time. Updates will be published on this page.</p>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

