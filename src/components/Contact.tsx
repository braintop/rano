import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, Phone, MapPin, Linkedin } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const Contact = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    serviceType: '',
    serviceTypeOther: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalServiceType =
        formData.serviceType === 'other'
          ? formData.serviceTypeOther ||
            (isHebrew ? 'אחר (לא צוין סוג)' : 'Other (not specified)')
          : formData.serviceType;

      await addDoc(collection(db, 'leads'), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        city: formData.city,
        serviceType: finalServiceType,
        serviceTypeKey: formData.serviceType,
        serviceTypeOther: formData.serviceTypeOther,
        message: formData.message,
        status: 'new',
        adminNotes: '',
        createdAt: serverTimestamp(),
        language: isHebrew ? 'he' : 'en',
      });

      toast.success(
        isHebrew
          ? 'ההודעה נשלחה בהצלחה! אחזור אליך בהקדם.'
          : 'Your message was sent successfully. I will get back to you soon.',
      );

      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        city: '',
        serviceType: '',
        serviceTypeOther: '',
        message: '',
      });
    } catch (error) {
      console.error('Error saving lead', error);
      toast.error(
        isHebrew
          ? 'אירעה שגיאה בשמירת ההודעה. נסה שוב מאוחר יותר.'
          : 'There was an error saving your message. Please try again later.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const serviceTypes = [
    {
      value: 'directors_officers',
      label: isHebrew ? 'דירקטורים ונושאי משרה' : 'Directors & Officers',
    },
    {
      value: 'travel',
      label: isHebrew ? 'נסיעות לחו״ל' : 'Travel insurance',
    },
    {
      value: 'cyber',
      label: isHebrew ? 'סייבר' : 'Cyber',
    },
    {
      value: 'professional_liability',
      label: isHebrew ? 'אחריות מקצועית' : 'Professional liability',
    },
    {
      value: 'clinical_trial',
      label: isHebrew ? 'ניסוי קליני' : 'Clinical trial',
    },
    {
      value: 'other',
      label: isHebrew ? 'אחר' : 'Other',
    },
  ];

  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {isHebrew ? 'בואו' : "Let's"}{' '}
            <span className="text-gold">
              {isHebrew ? 'נדבר' : 'talk'}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full mb-6" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isHebrew
              ? 'מעוניין לשמוע עוד על פתרונות ביטוח וניהול סיכונים? צור קשר ונקבע פגישה'
              : 'Interested in hearing more about insurance and risk management solutions? Reach out and we will schedule a meeting.'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="card-elevated rounded-xl p-6">
              <h3 className="font-serif text-2xl font-semibold mb-6">
                {isHebrew ? 'פרטי התקשרות' : 'Contact details'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isHebrew ? 'כתובת' : 'Address'}
                    </p>
                    <p className="font-medium">
                      {isHebrew ? 'AON Israel, תל אביב' : 'AON Israel, Tel Aviv'}
                    </p>
                  </div>
                </div>

                <a
                  href="https://www.linkedin.com/in/ranweinstock/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 hover:bg-secondary/50 p-2 rounded-lg -mr-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Linkedin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <p className="font-medium text-gold">ranweinstock</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="card-elevated rounded-xl p-6">
              <h4 className="font-serif text-lg font-semibold mb-3">
                {isHebrew ? 'תחומי התמחות' : 'Areas of expertise'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {(isHebrew
                  ? ['ביטוח סייבר', 'D&O', 'היי-טק', 'ביו-טק', 'ניהול סיכונים', 'סטארט-אפים']
                  : ['Cyber Insurance', 'D&O', 'High-tech', 'Biotech', 'Risk Management', 'Startups']
                ).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gold/10 text-gold rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="card-elevated rounded-xl p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    {isHebrew ? 'שם מלא *' : 'Full name *'}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={isHebrew ? 'השם שלך' : 'Your name'}
                    className={isHebrew ? 'text-right' : 'text-left'}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    {isHebrew ? 'אימייל *' : 'Email *'}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    {isHebrew ? 'טלפון' : 'Phone'}
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    {isHebrew ? 'חברה' : 'Company'}
                  </label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder={isHebrew ? 'שם החברה' : 'Company name'}
                    className={isHebrew ? 'text-right' : 'text-left'}
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-2">
                    {isHebrew ? 'עיר (אופציונלי)' : 'City (optional)'}
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={isHebrew ? 'לדוגמה: תל אביב' : 'e.g. Tel Aviv'}
                    className={isHebrew ? 'text-right' : 'text-left'}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="block text-sm font-medium">
                  {isHebrew ? 'סוג ביטוח מבוקש' : 'Requested insurance type'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {serviceTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          serviceType: type.value,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        formData.serviceType === type.value
                          ? 'bg-gold text-slate-900 border-gold'
                          : 'bg-transparent text-foreground border-border hover:bg-border/20'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                {formData.serviceType === 'other' && (
                  <div>
                    <label
                      htmlFor="serviceTypeOther"
                      className="block text-sm font-medium mb-2"
                    >
                      {isHebrew ? 'אחר – ציין איזה' : 'Other – please specify'}
                    </label>
                    <Input
                      id="serviceTypeOther"
                      name="serviceTypeOther"
                      value={formData.serviceTypeOther}
                      onChange={handleChange}
                      placeholder={
                        isHebrew
                          ? 'לדוגמה: ביטוח מיוחד אחר'
                          : 'For example: another specific insurance'
                      }
                      className={isHebrew ? 'text-right' : 'text-left'}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  {isHebrew ? 'הודעה *' : 'Message *'}
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder={isHebrew ? 'איך אוכל לעזור?' : 'How can I help?'}
                  rows={5}
                  className={`${isHebrew ? 'text-right' : 'text-left'} resize-none`}
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  isHebrew ? 'שולח...' : 'Sending...'
                ) : (
                  <>
                    <Send size={18} />
                    {isHebrew ? 'שלח הודעה' : 'Send message'}
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
