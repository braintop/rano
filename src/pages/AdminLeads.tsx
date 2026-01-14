import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type LeadStatus = 'new' | 'handled';

type Lead = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  serviceType?: string;
  city?: string;
  serviceTypeKey?: string;
  serviceTypeOther?: string;
  message: string;
  status: LeadStatus;
  adminNotes?: string;
  createdAt?: { seconds: number; nanoseconds: number };
};

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const AdminLeads = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [searchFocused, setSearchFocused] = useState(false);

  const isAuthorized =
    !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Lead[] = snapshot.docs.map((d) => ({
          id: d.id,
          status: 'new',
          adminNotes: '',
          ...d.data(),
        })) as Lead[];
        setLeads(data);
        setIsLoading(false);
      },
      () => setIsLoading(false),
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (error) {
      console.error('Login error', error);
      setLoginError(
        isHebrew
          ? 'פרטי ההתחברות שגויים או שאין לך הרשאה.'
          : 'Invalid credentials or you are not authorized.',
      );
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const updateLead = async (id: string, changes: Partial<Lead>) => {
    await updateDoc(doc(db, 'leads', id), changes);
  };

  const formatDate = (lead: Lead) => {
    if (!lead.createdAt?.seconds) return '-';
    const date = new Date(lead.createdAt.seconds * 1000);
    return date.toLocaleString(isHebrew ? 'he-IL' : 'en-GB');
  };

  const getServiceTypeLabel = (lead: Lead) => {
    // Prefer the explicit label we stored
    if (lead.serviceType && !lead.serviceTypeKey) {
      return lead.serviceType;
    }

    const key = lead.serviceTypeKey || lead.serviceType;
    if (!key) return '-';

    switch (key) {
      case 'directors_officers':
        return isHebrew ? 'דירקטורים ונושאי משרה' : 'Directors & Officers';
      case 'travel':
        return isHebrew ? 'נסיעות לחו״ל' : 'Travel insurance';
      case 'cyber':
        return isHebrew ? 'סייבר' : 'Cyber';
      case 'professional_liability':
        return isHebrew ? 'אחריות מקצועית' : 'Professional liability';
      case 'clinical_trial':
        return isHebrew ? 'ניסוי קליני' : 'Clinical trial';
      case 'other':
        return lead.serviceTypeOther || (isHebrew ? 'אחר' : 'Other');
      default:
        return lead.serviceType || key;
    }
  };

  const normalizedIncludes = (value: string | undefined, query: string) =>
    value?.toLowerCase().includes(query.toLowerCase()) ?? false;

  const trimmedQuery = searchQuery.trim();

  const filteredLeads = trimmedQuery
    ? leads.filter((lead) => {
        const q = trimmedQuery.toLowerCase();
        return (
          normalizedIncludes(lead.name, q) ||
          normalizedIncludes(lead.company, q) ||
          normalizedIncludes(lead.email, q)
        );
      })
    : leads;

  const suggestionValues = trimmedQuery
    ? Array.from(
        new Set(
          leads.flatMap((lead) =>
            [lead.name, lead.company, lead.email]
              .filter(Boolean)
              .map((v) => v!.toString()),
          ),
        ),
      )
        .filter((value) =>
          value.toLowerCase().includes(trimmedQuery.toLowerCase()),
        )
        .slice(0, 6)
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 py-24">
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <header className="mb-8 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">
              {isHebrew ? 'לידים מהאתר' : 'Website leads'}
            </h1>
            <p className="text-slate-400 mt-1">
              {isHebrew
                ? 'כל הפניות מהטופס מגיעות לפה. ניתן לעדכן סטטוס ולהוסיף הערות.'
                : 'All form submissions arrive here. You can update status and add notes.'}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 100)}
                placeholder={
                  isHebrew
                    ? 'חיפוש לפי שם, חברה או אימייל...'
                    : 'Search by name, company or email...'
                }
                className="bg-slate-900 border-slate-700 pr-3"
              />
              {searchFocused && suggestionValues.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-700 bg-slate-900 shadow-lg max-h-56 overflow-auto">
                  {suggestionValues.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(value);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-800"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500">
              {isHebrew
                ? `${filteredLeads.length} לידים מוצגים מתוך ${leads.length}`
                : `${filteredLeads.length} leads shown of ${leads.length}`}
            </p>
          </div>
        </header>

        {authLoading ? (
          <p className="text-slate-400">
            {isHebrew ? 'בודק הרשאות...' : 'Checking permissions...'}
          </p>
        ) : !user ? (
          <div className="max-w-md mx-auto bg-slate-900/70 border border-slate-700 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              {isHebrew ? 'התחברות נדרשת' : 'Login required'}
            </h2>
            <p className="text-sm text-slate-400">
              {isHebrew
                ? 'כדי לצפות בלידים, התחבר עם אימייל וסיסמה של אדמין שהוגדר ב־VITE_ADMIN_EMAILS וחשבון Firebase.'
                : 'To view leads, log in with an email/password admin account that exists in Firebase and is listed in VITE_ADMIN_EMAILS.'}
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-slate-200" htmlFor="admin-email">
                  {isHebrew ? 'אימייל' : 'Email'}
                </label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  dir="ltr"
                  required
                  className="bg-slate-950 border-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-200" htmlFor="admin-password">
                  {isHebrew ? 'סיסמה' : 'Password'}
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-700"
                />
              </div>
              {loginError && (
                <p className="text-sm text-rose-400">
                  {loginError}
                </p>
              )}
              <Button type="submit" className="w-full" variant="default">
                {isHebrew ? 'התחבר' : 'Log in'}
              </Button>
            </form>
          </div>
        ) : !isAuthorized ? (
          <div className="max-w-md mx-auto bg-slate-900/70 border border-rose-700 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-rose-300">
              {isHebrew ? 'אין לך הרשאה' : 'You do not have access'}
            </h2>
            <p className="text-sm text-slate-300">
              {isHebrew
                ? `המשתמש ${user.email ?? ''} לא מופיע ברשימת VITE_ADMIN_EMAILS.`
                : `User ${user.email ?? ''} is not listed in VITE_ADMIN_EMAILS.`}
            </p>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              {isHebrew ? 'התנתק והתחבר עם משתמש אחר' : 'Log out and try another user'}
            </Button>
          </div>
        ) : isLoading ? (
          <p className="text-slate-400">
            {isHebrew ? 'טוען לידים...' : 'Loading leads...'}
          </p>
        ) : filteredLeads.length === 0 ? (
          <p className="text-slate-400">
            {isHebrew ? 'אין עדיין לידים.' : 'No leads yet.'}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <section
                key={lead.id}
                className={cn(
                  'rounded-xl border p-4 md:p-6 bg-slate-900/60 border-slate-800',
                  lead.status === 'handled' ? 'border-emerald-500/60' : 'border-rose-500/60',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">
                        {lead.name || (isHebrew ? 'ללא שם' : 'No name')}
                      </h2>
                      {lead.serviceType && (
                        <Badge variant="outline" className="border-gold text-gold">
                          {lead.serviceType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(lead)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        'px-3 py-1 text-xs',
                        lead.status === 'handled'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/60',
                      )}
                    >
                      {lead.status === 'handled'
                        ? isHebrew
                          ? 'טופל'
                          : 'Handled'
                        : isHebrew
                        ? 'לא טופל'
                        : 'Not handled'}
                    </Badge>
                    <div className={isHebrew ? 'flex gap-2' : 'flex gap-2'}>
                      <Button
                        size="sm"
                        variant={lead.status === 'handled' ? 'outline' : 'default'}
                        className={cn(
                          'border-rose-500/70',
                          lead.status !== 'handled' && 'bg-rose-600 hover:bg-rose-700',
                        )}
                        onClick={() =>
                          updateLead(lead.id, {
                            status: lead.status === 'handled' ? 'new' : 'new',
                          })
                        }
                      >
                        {isHebrew ? 'סמן כלא טופל' : 'Mark not handled'}
                      </Button>
                      <Button
                        size="sm"
                        variant={lead.status === 'handled' ? 'default' : 'outline'}
                        className={cn(
                          'border-emerald-500/70',
                          lead.status === 'handled' && 'bg-emerald-600 hover:bg-emerald-700',
                        )}
                        onClick={() =>
                          updateLead(lead.id, {
                            status: 'handled',
                          })
                        }
                      >
                        {isHebrew ? 'סמן כטופל' : 'Mark handled'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-slate-400 mb-1">
                      {isHebrew ? 'טלפון' : 'Phone'}
                    </p>
                    <p className="font-medium">{lead.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">Email</p>
                    <p className="font-medium break-all">{lead.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">
                      {isHebrew ? 'חברה' : 'Company'}
                    </p>
                    <p className="font-medium">{lead.company || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-1">
                      {isHebrew ? 'עיר' : 'City'}
                    </p>
                    <p className="font-medium">{lead.city || '-'}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-slate-400 mb-1">
                    {isHebrew ? 'סוג ביטוח' : 'Insurance type'}
                  </p>
                  <p className="text-sm font-medium">
                    {getServiceTypeLabel(lead)}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-slate-400 mb-1">
                    {isHebrew ? 'הודעה' : 'Message'}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {lead.message}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isHebrew ? 'הערות אדמין' : 'Admin notes'}
                  </label>
                  <Textarea
                    value={lead.adminNotes || ''}
                    onChange={(e) =>
                      setLeads((current) =>
                        current.map((l) =>
                          l.id === lead.id ? { ...l, adminNotes: e.target.value } : l,
                        ),
                      )
                    }
                    onBlur={() =>
                      updateLead(lead.id, {
                        adminNotes: lead.adminNotes || '',
                      })
                    }
                    placeholder={
                      isHebrew
                        ? 'רשום סיכום שיחה, שלבים הבאים וכו׳...'
                        : 'Write call summary, next steps, etc...'
                    }
                    className="bg-slate-900 border-slate-700"
                    rows={3}
                  />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminLeads;

