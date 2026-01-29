import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
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
import { Moon, Sun, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import public150Data from '@/data/public_150_json.json';

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

type PublicComment = {
  comment: string;
  email: string;
  date: string;
};

type PublicStatus = 'new' | 'in_progress' | 'partial' | 'full' | 'next_year';

type PublicRow = {
  [key: string]: any;
  _id?: string;
  comments?: PublicComment[];
  call_status?: PublicStatus;
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [segment, setSegment] = useState<'all' | 'public' | 'private' | 'invited_conference'>('all');
  const [topSection, setTopSection] = useState<'leads' | 'articles' | 'social' | 'seo'>('leads');
  const navigate = useNavigate();
  const [publicRows, setPublicRows] = useState<PublicRow[]>([]);
  const [publicExpandedIndex, setPublicExpandedIndex] = useState<number | null>(null);
  const [isUploadingPublicJson, setIsUploadingPublicJson] = useState(false);
  const [isLoadingPublicFromFirebase, setIsLoadingPublicFromFirebase] = useState(false);
  const [publicSearchQuery, setPublicSearchQuery] = useState('');
  const [publicNoteDrafts, setPublicNoteDrafts] =
    useState<Record<string, string[]>>({});
  const [publicEditDrafts, setPublicEditDrafts] =
    useState<Record<string, string>>({});

  const isAuthorized =
    !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const isDarkTheme = theme === 'dark';

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

  // normalize both header-style keys ("Company Full Name") and JSON keys ("company_full_name")
  // so that they can be matched regardless of spaces/underscores/case
  const normalizeKey = (key: string) =>
    key.replace(/[\s_]+/g, '').toLowerCase();

  const getField = (row: PublicRow, target: string) => {
    const targetKey = normalizeKey(target);
    const key = Object.keys(row).find((k) => normalizeKey(k) === targetKey);
    const value = key ? row[key] : '';
    if (value === null || value === undefined) return '';
    return typeof value === 'string' ? value : String(value);
  };

  const primaryPublicFields = [
    'Company Full Name',
    'No of Employees',
    'Website',
    'CEO',
    'Telephone',
  ];

  const primaryPublicFieldSet = new Set(
    primaryPublicFields.map((field) => normalizeKey(field)),
  );

  const publicStatusOptions: {
    id: PublicStatus;
    labelHe: string;
    labelEn: string;
    activeClass: string;
  }[] = [
    {
      id: 'new',
      labelHe: 'חדש',
      labelEn: 'New',
      activeClass: 'bg-emerald-600 text-white',
    },
    {
      id: 'in_progress',
      labelHe: 'בטיפול',
      labelEn: 'In progress',
      activeClass: 'bg-orange-500 text-white',
    },
    {
      id: 'partial',
      labelHe: 'נסגר חלקית',
      labelEn: 'Partial',
      activeClass: 'bg-pink-500 text-white',
    },
    {
      id: 'full',
      labelHe: 'נסגר מלא',
      labelEn: 'Full',
      activeClass: 'bg-sky-500 text-white',
    },
    {
      id: 'next_year',
      labelHe: 'לחזור בשנה הבאה',
      labelEn: 'Next year',
      activeClass: 'bg-red-500 text-white',
    },
  ];

  const trimmedPublicQuery = publicSearchQuery.trim().toLowerCase();

  const filteredPublicRows = trimmedPublicQuery
    ? publicRows.filter((row) => {
        const company =
          getField(row, 'Company Full Name') || getField(row, 'Company');
        const ceo = getField(row, 'CEO');
        return (
          normalizedIncludes(company, trimmedPublicQuery) ||
          normalizedIncludes(ceo, trimmedPublicQuery)
        );
      })
    : publicRows;

  const handlePublicCsvUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) return;

    const detectDelimiter = (line: string) => {
      const commaCount = (line.match(/,/g) ?? []).length;
      const semicolonCount = (line.match(/;/g) ?? []).length;
      const tabCount = (line.match(/\t/g) ?? []).length;
      if (semicolonCount > commaCount && semicolonCount >= tabCount) return ';';
      if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
      return ',';
    };

    const delimiter = detectDelimiter(lines[0]);

    const parseCsvLine = (line: string) => {
      const pattern = new RegExp(`("([^"]*)"|[^${delimiter}]+)`, 'g');
      const matches = line.match(pattern) ?? [];
      return matches.map((value) =>
        value.replace(/^"|"$/g, '').trim(),
      );
    };

    const headerValues = parseCsvLine(lines[0]);
    const rows: PublicRow[] = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row: PublicRow = {};
      headerValues.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      return row;
    });

    setPublicRows(rows);
    setPublicExpandedIndex(null);
    e.target.value = '';
  };

  const handleUploadPublicJson = async () => {
    if (isUploadingPublicJson) return;

    if (!Array.isArray(public150Data)) {
      window.alert(
        isHebrew
          ? 'קובץ ה-JSON של Public 150 לא נטען בצורה תקינה.'
          : 'Public 150 JSON file is not loaded correctly.',
      );
      return;
    }

    try {
      setIsUploadingPublicJson(true);

      const colRef = collection(db, 'public_150');

      // מחיקת כל הדוקומנטים הקיימים
      const existingSnap = await getDocs(colRef);
      const existingDocs = existingSnap.docs;

      const chunkSize = 400;
      for (let i = 0; i < existingDocs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const slice = existingDocs.slice(i, i + chunkSize);
        slice.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }

      // כתיבת הנתונים החדשים מתוך ה-JSON
      const dataArray = public150Data as PublicRow[];
      for (let i = 0; i < dataArray.length; i += chunkSize) {
        const batch = writeBatch(db);
        const slice = dataArray.slice(i, i + chunkSize);
        slice.forEach((item) => {
          const ref = doc(colRef); // id אקראי
          batch.set(ref, item);
        });
        await batch.commit();
      }

      window.alert(
        isHebrew
          ? 'הנתונים מ-public_150_json.json נרשמו בהצלחה ל-Firebase (collection public_150).'
          : 'Data from public_150_json.json was successfully written to Firebase collection public_150.',
      );
    } catch (error) {
      console.error('Error uploading public_150 JSON to Firestore:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בעת כתיבת הנתונים ל-Firebase. ראה קונסול לפרטים.'
          : 'An error occurred while writing data to Firebase. See console for details.',
      );
    } finally {
      setIsUploadingPublicJson(false);
    }
  };
  // Load public_150 collection automatically when in Public 150 view
  useEffect(() => {
    const loadFromFirebase = async () => {
      try {
        setIsLoadingPublicFromFirebase(true);
        const snap = await getDocs(collection(db, 'public_150'));
        const data: PublicRow[] = snap.docs.map((d) => ({
          _id: d.id,
          ...(d.data() as PublicRow),
        }));
        setPublicRows(data);
        setPublicExpandedIndex(null);
      } catch (error) {
        console.error('Error loading public_150 from Firestore:', error);
      } finally {
        setIsLoadingPublicFromFirebase(false);
      }
    };

    if (isAuthorized && topSection === 'leads' && segment === 'public') {
      loadFromFirebase();
    }
  }, [isAuthorized, topSection, segment]);

  const handleSavePublicNote = async (row: PublicRow, draftIndex: number) => {
    if (!row?._id) {
      window.alert(
        isHebrew
          ? 'לא נמצא מזהה לדוקומנט הזה ב-Firebase.'
          : 'No document ID found for this record in Firebase.',
      );
      return;
    }

    if (!user?.email) {
      window.alert(
        isHebrew
          ? 'יש להתחבר עם משתמש מורשה לפני הוספת הערות.'
          : 'You need to be signed in with an authorized user before adding notes.',
      );
      return;
    }

    const key = row._id;
    const drafts = publicNoteDrafts[key] ?? [];
    const text = (drafts[draftIndex] ?? '').trim();
    if (!text) return;

    const comment: PublicComment = {
      comment: text.trim(),
      date: new Date().toISOString(),
      email: user.email,
    };

    try {
      const ref = doc(db, 'public_150', row._id);
      // Add a new comment to the array in Firestore
      await updateDoc(ref, {
        comments: arrayUnion(comment),
      });

      // Update local state to include the new comment
      setPublicRows((current) =>
        current.map((r) =>
          r._id === row._id
            ? { ...r, comments: [...(r.comments ?? []), comment] }
            : r,
        ),
      );

      // Remove the saved draft line
      setPublicNoteDrafts((current) => {
        const copy = { ...current };
        const arr = [...(copy[key] ?? [])];
        arr.splice(draftIndex, 1);
        if (arr.length) {
          copy[key] = arr;
        } else {
          delete copy[key];
        }
        return copy;
      });
    } catch (error) {
      console.error('Error adding note to public_150 document:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בעת שמירת ההערה. ראה קונסול לפרטים.'
          : 'An error occurred while saving the note. See console for details.',
      );
    }
  };

  const handleUpdateExistingPublicComment = async (
    row: PublicRow,
    index: number,
  ) => {
    if (!row?._id) return;

    if (!user?.email) {
      window.alert(
        isHebrew
          ? 'יש להתחבר עם משתמש מורשה לפני עדכון הערות.'
          : 'You need to be signed in with an authorized user before updating comments.',
      );
      return;
    }

    const key = `${row._id}-${index}`;
    const text = (publicEditDrafts[key] ?? '').trim();
    if (!text) return;

    const existingComments = Array.isArray(row.comments)
      ? [...row.comments]
      : [];
    if (!existingComments[index]) return;

    const updatedComment: PublicComment = {
      ...existingComments[index],
      comment: text,
      date: new Date().toISOString(),
      email: user.email,
    };
    existingComments[index] = updatedComment;

    try {
      const ref = doc(db, 'public_150', row._id);
      await updateDoc(ref, { comments: existingComments });

      setPublicRows((current) =>
        current.map((r) =>
          r._id === row._id ? { ...r, comments: existingComments } : r,
        ),
      );

      setPublicEditDrafts((current) => {
        const copy = { ...current };
        delete copy[key];
        return copy;
      });
    } catch (error) {
      console.error('Error updating public_150 comment:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בעת עדכון ההערה. ראה קונסול לפרטים.'
          : 'An error occurred while updating the comment. See console for details.',
      );
    }
  };

  const handleDeletePublicComment = async (row: PublicRow, index: number) => {
    if (!row?._id) return;

    const existingComments = Array.isArray(row.comments)
      ? [...row.comments]
      : [];
    if (!existingComments[index]) return;

    existingComments.splice(index, 1);

    try {
      const ref = doc(db, 'public_150', row._id);
      await updateDoc(ref, { comments: existingComments });

      setPublicRows((current) =>
        current.map((r) =>
          r._id === row._id ? { ...r, comments: existingComments } : r,
        ),
      );

      const key = `${row._id}-${index}`;
      setPublicEditDrafts((current) => {
        const copy = { ...current };
        delete copy[key];
        return copy;
      });
    } catch (error) {
      console.error('Error deleting public_150 comment:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בעת מחיקת ההערה. ראה קונסול לפרטים.'
          : 'An error occurred while deleting the comment. See console for details.',
      );
    }
  };

  const handleUpdatePublicStatus = async (
    row: PublicRow,
    status: PublicStatus,
  ) => {
    if (!row?._id) return;

    try {
      const ref = doc(db, 'public_150', row._id);
      await updateDoc(ref, { call_status: status });

      setPublicRows((current) =>
        current.map((r) =>
          r._id === row._id ? { ...r, call_status: status } : r,
        ),
      );
    } catch (error) {
      console.error('Error updating public_150 status:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בעת עדכון הסטטוס. ראה קונסול לפרטים.'
          : 'An error occurred while updating the status. See console for details.',
      );
    }
  };

  return (
    <main
      className={cn(
        'min-h-screen py-24 transition-colors',
        isDarkTheme ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900',
      )}
    >
      <div className="container-narrow" dir={isHebrew ? 'rtl' : 'ltr'}>
        <header className="mb-8 flex flex-col gap-4">
          {/* Main admin navbar (Leads / Articles / Social / SEO) */}
          <nav
            className={cn(
              'inline-flex items-center self-start rounded-full border px-1 py-1 text-xs md:text-sm',
              isDarkTheme
                ? 'border-slate-700 bg-slate-900/80'
                : 'border-slate-200 bg-white',
            )}
          >
            {[
              { id: 'leads' as const, labelHe: 'לידים', labelEn: 'Leads' },
              { id: 'articles' as const, labelHe: 'מאמרים', labelEn: 'Articles' },
              {
                id: 'social' as const,
                labelHe: 'רשתות חברתיות',
                labelEn: 'Social',
              },
              { id: 'seo' as const, labelHe: 'SEO', labelEn: 'SEO' },
            ].map((item) => {
              const isActive = topSection === item.id;
              const isLeads = item.id === 'leads';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTopSection(item.id);
                    if (isLeads) {
                      navigate('/0522577194/admin');
                    }
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : isDarkTheme
                      ? 'text-slate-200 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-slate-100',
                    !isLeads && 'cursor-default',
                  )}
                >
                  {isHebrew ? item.labelHe : item.labelEn}
                </button>
              );
            })}
          </nav>

          {topSection === 'leads' && (
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">
                {isHebrew ? 'לידים מהאתר' : 'Website leads'}
              </h1>
              <p className="text-slate-400 mt-1">
                {isHebrew
                  ? 'כל הפניות מהטופס מגיעות לפה. ניתן לעדכן סטטוס ולהוסיף הערות.'
                  : 'All form submissions arrive here. You can update status and add notes.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 italic">
                From Tel Aviv to Silicon Valley: How to Raise from US Investors
              </p>
            </div>
          )}

          {topSection === 'leads' && (
            <>
              {segment === 'all' && (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3 w-full md:max-w-md">
                    <div className="relative flex-1">
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
                        className={cn(
                          'pr-3',
                          isDarkTheme
                            ? 'bg-slate-900 border-slate-700'
                            : 'bg-white border-slate-300',
                        )}
                      />
                      {searchFocused && suggestionValues.length > 0 && (
                        <div
                          className={cn(
                            'absolute z-20 mt-1 w-full rounded-md border shadow-lg max-h-56 overflow-auto',
                            isDarkTheme
                              ? 'border-slate-700 bg-slate-900'
                              : 'border-slate-200 bg-white',
                          )}
                        >
                          {suggestionValues.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSearchQuery(value);
                              }}
                              className={cn(
                                'w-full px-3 py-2 text-left text-sm',
                                isDarkTheme
                                  ? 'hover:bg-slate-800'
                                  : 'hover:bg-slate-100',
                              )}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
                      className={cn(
                        'h-9 w-9 rounded-full border',
                        isDarkTheme
                          ? 'bg-slate-900 border-slate-600 text-yellow-300'
                          : 'bg-white border-slate-300 text-slate-800',
                      )}
                      aria-label={
                        isHebrew
                          ? isDarkTheme
                            ? 'החלף למצב אור'
                            : 'החלף למצב כהה'
                          : isDarkTheme
                          ? 'Switch to light mode'
                          : 'Switch to dark mode'
                      }
                    >
                      {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
                    </Button>
                  </div>

                  <p className="text-xs text-slate-500">
                    {isHebrew
                      ? `${filteredLeads.length} לידים מוצגים מתוך ${leads.length}`
                      : `${filteredLeads.length} leads shown of ${leads.length}`}
                  </p>
                </div>
              )}

              {/* Segments navbar (public / private / invited) */}
              <nav
                className={cn(
                  'mt-2 inline-flex items-center rounded-full border px-1 py-1 text-xs md:text-sm',
                  isDarkTheme
                    ? 'border-slate-700 bg-slate-900/70'
                    : 'border-slate-200 bg-white',
                )}
              >
                {[
                  { id: 'all' as const, labelHe: 'לידים מהאתר', labelEn: 'All leads' },
                  { id: 'public' as const, labelHe: 'Public 150', labelEn: 'Public 150' },
                  { id: 'private' as const, labelHe: 'Private', labelEn: 'Private' },
                  {
                    id: 'invited_conference' as const,
                    labelHe: 'Invited Conference',
                    labelEn: 'Invited Conference',
                  },
                ].map((item) => {
                  const isActive = segment === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSegment(item.id)}
                      className={cn(
                        'px-3 py-1 rounded-full transition-colors',
                        isActive
                          ? 'bg-rose-500 text-white'
                          : isDarkTheme
                          ? 'text-slate-200 hover:bg-slate-800'
                          : 'text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      {isHebrew ? item.labelHe : item.labelEn}
                    </button>
                  );
                })}
              </nav>
            </>
          )}

        </header>

        {authLoading ? (
          <p className="text-slate-400">
            {isHebrew ? 'בודק הרשאות...' : 'Checking permissions...'}
          </p>
        ) : !user ? (
          <div
            className={cn(
              'max-w-md mx-auto rounded-xl p-6 space-y-4 border',
              isDarkTheme
                ? 'bg-slate-900/70 border-slate-700'
                : 'bg-white border-slate-200 shadow-sm',
            )}
          >
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
          <div
            className={cn(
              'max-w-md mx-auto rounded-xl p-6 space-y-4 border',
              isDarkTheme
                ? 'bg-slate-900/70 border-rose-700'
                : 'bg-white border-rose-300 shadow-sm',
            )}
          >
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
        ) : topSection !== 'leads' ? (
          <div className="mt-8 text-center text-sm text-slate-400">
            {topSection === 'articles' &&
              (isHebrew ? 'מאמרים' : 'Articles')}
            {topSection === 'social' &&
              (isHebrew ? 'רשתות חברתיות' : 'Social networks')}
            {topSection === 'seo' && (isHebrew ? 'SEO' : 'SEO')}
          </div>
        ) : segment === 'public' ? (
            <div className="mt-8 space-y-6">
            {/* Public search */}
            <div className="max-w-md">
              <Input
                type="text"
                value={publicSearchQuery}
                onChange={(e) => setPublicSearchQuery(e.target.value)}
                placeholder={
                  isHebrew
                    ? 'חיפוש לפי שם חברה או שם מנכ\"ל...'
                    : 'Search by company or CEO name...'
                }
                className={cn(
                  'pr-3',
                  isDarkTheme
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-300',
                )}
              />
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-400">
                {isHebrew
                  ? 'רשום את קובץ ה-JSON של 150 ה-Public לקולקציית public_150 ב-Firebase.'
                  : 'Write the Public 150 JSON file into the public_150 collection in Firebase.'}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUploadPublicJson}
                  disabled={isUploadingPublicJson}
                  className="rounded-full"
                >
                  {isUploadingPublicJson
                    ? isHebrew
                      ? 'מעלה JSON ל-Firebase...'
                      : 'Uploading JSON to Firebase...'
                    : isHebrew
                    ? 'רשום JSON ל-Firebase'
                    : 'Write JSON to Firebase'}
                </Button>
              </div>
            </div>

            {publicRows.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                {isHebrew
                  ? 'עדיין לא נטענו רשומות. טען קובץ CSV כדי לראות נתונים.'
                  : 'No records loaded yet. Upload a CSV file to see data.'}
              </p>
            ) : (
              <div className="space-y-3">
                    {/* Header row */}
                    <div className="hidden md:grid md:grid-cols-6 gap-3 text-xs text-slate-400 px-1">
                  <div className="font-medium">
                    {isHebrew ? 'Company Full Name' : 'Company Full Name'}
                  </div>
                  <div className="font-medium">
                    {isHebrew ? 'No of Employees' : 'No of Employees'}
                  </div>
                  <div className="font-medium">
                    {isHebrew ? 'Website' : 'Website'}
                  </div>
                  <div className="font-medium">
                    {isHebrew ? 'CEO' : 'CEO'}
                  </div>
                  <div className="font-medium">
                    {isHebrew ? 'Telephone' : 'Telephone'}
                      </div>
                      <div className="font-medium">
                        {isHebrew ? 'סטטוס' : 'Status'}
                  </div>
                </div>

                {filteredPublicRows.map((row, index) => {
                  const appearValue = getField(row, 'appear');
                  const isHidden =
                    appearValue &&
                    appearValue.toLowerCase() === 'no';

                  const company =
                    getField(row, 'Company Full Name') ||
                    getField(row, 'Company');
                  const employees = getField(row, 'No of Employees');
                  const website = getField(row, 'Website');
                  const ceo = getField(row, 'CEO');
                      const telephone = getField(row, 'Telephone');

                      const rowStatus: PublicStatus = row.call_status ?? 'new';
                      const statusDef = publicStatusOptions.find(
                        (opt) => opt.id === rowStatus,
                      );

                  const isExpanded = publicExpandedIndex === index;

                  return (
                    <section
                      key={index}
                      className={cn(
                        'rounded-xl border p-4 md:p-5 text-sm cursor-pointer transition-colors',
                        isDarkTheme
                          ? 'bg-slate-900/70 border-slate-800 hover:bg-slate-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm',
                        isHidden &&
                          (isDarkTheme
                            ? 'bg-rose-900/30 border-rose-600'
                            : 'bg-rose-50 border-rose-400'),
                      )}
                      onClick={() =>
                        setPublicExpandedIndex(
                          isExpanded ? null : index,
                        )
                      }
                    >
                          <div className="grid gap-3 md:grid-cols-6 md:items-center">
                        <div className="font-semibold truncate">
                          {company || (isHebrew ? 'ללא חברה' : 'No company')}
                        </div>
                        <div className="truncate">
                          {employees || '-'}
                        </div>
                        <div className="text-sky-400 text-xs md:text-sm break-all">
                          {website ? (
                            <a
                              href={
                                website.startsWith('http')
                                  ? website
                                  : `https://${website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {website}
                            </a>
                          ) : (
                            '-'
                          )}
                        </div>
                        <div className="truncate">
                          {ceo || (isHebrew ? 'לא צוין' : 'Not specified')}
                        </div>
                        <div className="truncate">
                          {telephone || '-'}
                            </div>
                            <div>
                              {statusDef ? (
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-full px-3 py-1 text-[11px] border',
                                    statusDef.activeClass,
                                  )}
                                >
                                  {isHebrew ? statusDef.labelHe : statusDef.labelEn}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 border-t border-slate-700/40 pt-3 text-xs md:text-sm space-y-4">
                          {/* Status buttons */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {publicStatusOptions.map((opt) => {
                              const currentStatus: PublicStatus =
                                row.call_status ?? 'new';
                              const isActive = currentStatus === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdatePublicStatus(row, opt.id);
                                  }}
                                  className={cn(
                                    'px-3 py-1 rounded-full text-[11px] border transition-colors',
                                    isActive
                                      ? opt.activeClass
                                      : isDarkTheme
                                      ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                                      : 'border-slate-300 text-slate-700 hover:bg-slate-100',
                                  )}
                                >
                                  {isHebrew ? opt.labelHe : opt.labelEn}
                                </button>
                              );
                            })}
                          </div>

                          {/* Comments at top of card */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-slate-400">
                                {isHebrew ? 'הערות' : 'Comments'}
                              </p>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-6 w-6 rounded-full bg-emerald-600 border-emerald-500 text-white flex items-center justify-center text-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!row._id) return;
                                  setPublicNoteDrafts((current) => {
                                    const key = row._id as string;
                                    const existing = current[key] ?? [];
                                    return {
                                      ...current,
                                      [key]: [...existing, ''],
                                    };
                                  });
                                }}
                                aria-label={isHebrew ? 'הוסף הערה חדשה' : 'Add new comment'}
                              >
                                +
                              </Button>
                            </div>

                            {row._id &&
                              Array.isArray(publicNoteDrafts[row._id]) &&
                              publicNoteDrafts[row._id].length > 0 && (
                                <div className="space-y-2">
                                  {publicNoteDrafts[row._id].map((draft, draftIndex) => (
                                    <div
                                      key={draftIndex}
                                      className="flex flex-col md:flex-row gap-2 items-center"
                                    >
                                      <Input
                                        type="text"
                                        value={draft}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          const key = row._id as string;
                                          setPublicNoteDrafts((current) => {
                                            const existing = current[key] ?? [];
                                            const copy = [...existing];
                                            copy[draftIndex] = value;
                                            return {
                                              ...current,
                                              [key]: copy,
                                            };
                                          });
                                        }}
                                        placeholder={
                                          isHebrew
                                            ? 'הוסף או עדכן הערה לטלפונים / שיחות...'
                                            : 'Add or edit a note for calls/phones...'
                                        }
                                        className={cn(
                                          'pr-3 flex-1',
                                          isDarkTheme
                                            ? 'bg-slate-900 border-slate-700'
                                            : 'bg-white border-slate-300',
                                        )}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSavePublicNote(row, draftIndex);
                                        }}
                                      >
                                        {isHebrew ? 'שמור' : 'Save'}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                            {Array.isArray(row.comments) &&
                              row.comments.length > 0 && (
                                <div className="space-y-2">
                                  {row.comments.map((note, idx) => {
                                    const editKey = row._id
                                      ? `${row._id}-${idx}`
                                      : `${idx}`;
                                    const isEditing =
                                      editKey in publicEditDrafts;
                                    const draftValue = isEditing
                                      ? publicEditDrafts[editKey]
                                      : note.comment;

                                    if (isEditing) {
                                      return (
                                        <div
                                          key={editKey}
                                          className="flex flex-col md:flex-row md:items-center gap-2"
                                        >
                                          <Input
                                            type="text"
                                            value={draftValue ?? ''}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              setPublicEditDrafts((current) => ({
                                                ...current,
                                                [editKey]: value,
                                              }));
                                            }}
                                            className={cn(
                                              'pr-3 flex-1',
                                              isDarkTheme
                                                ? 'bg-slate-900 border-slate-700'
                                                : 'bg-white border-slate-300',
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <div className="flex items-center gap-2">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="rounded-full"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateExistingPublicComment(
                                                  row,
                                                  idx,
                                                );
                                              }}
                                            >
                                              {isHebrew ? 'שמור' : 'Save'}
                                            </Button>
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="ghost"
                                              className="h-7 w-7 rounded-full text-slate-400 hover:text-slate-100"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPublicEditDrafts((current) => {
                                                  const copy = { ...current };
                                                  delete copy[editKey];
                                                  return copy;
                                                });
                                              }}
                                              aria-label={
                                                isHebrew ? 'ביטול עריכה' : 'Cancel edit'
                                              }
                                            >
                                              ×
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={editKey}
                                        className="flex items-center justify-between gap-3"
                                      >
                                        <div className="text-xs md:text-sm text-slate-300">
                                          {new Date(
                                            note.date,
                                          ).toLocaleString(
                                            isHebrew ? 'he-IL' : 'en-GB',
                                          )}{' '}
                                          · {note.email} — {note.comment}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-[11px] rounded-full bg-white text-slate-900 hover:bg-slate-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setPublicEditDrafts((current) => ({
                                                ...current,
                                                [editKey]: note.comment,
                                              }));
                                            }}
                                          >
                                            {isHebrew ? 'עריכה' : 'Edit'}
                                          </Button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeletePublicComment(row, idx);
                                            }}
                                            className="h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                                            aria-label={
                                              isHebrew ? 'מחק הערה' : 'Delete comment'
                                            }
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                          </div>

                          {/* Extra fields */}
                          <div className="grid gap-2 md:grid-cols-3">
                            {Object.entries(row).map(([key, value]) => {
                              const normalized = normalizeKey(key);
                              if (
                                primaryPublicFieldSet.has(normalized) ||
                                normalized === 'appear' ||
                                normalized === 'callstatus' ||
                                key === 'notes' ||
                                key === 'comments' ||
                                key === '_id'
                              ) {
                                return null;
                              }
                              return (
                                <div key={key}>
                                  <p className="text-slate-400">
                                    {key}
                                  </p>
                                  <p className="font-medium break-words">
                                    {value || '-'}
                                  </p>
                                </div>
                              );
                            })}
                            <div>
                              <p className="text-slate-400">
                                {isHebrew ? 'Appear' : 'Appear'}
                              </p>
                              <p className="font-medium">
                                {appearValue || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        ) : segment !== 'all' ? (
          <div className="mt-8 text-center text-sm text-slate-500">
            {isHebrew
              ? 'כאן תופיע בהמשך קומפוננטה ייעודית לקבוצה זו.'
              : 'This area will later show a dedicated component for this segment.'}
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
                  'rounded-xl border p-4 md:p-6 transition-colors',
                  isDarkTheme
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-white border-slate-200 shadow-sm',
                  lead.status === 'handled'
                    ? isDarkTheme
                      ? 'border-emerald-500/60'
                      : 'border-emerald-400/80'
                    : isDarkTheme
                    ? 'border-rose-500/60'
                    : 'border-rose-400/80',
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
                        'px-3 py-1 text-xs border',
                        lead.status === 'handled'
                          ? isDarkTheme
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-400'
                          : isDarkTheme
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/60'
                          : 'bg-rose-50 text-rose-700 border-rose-400',
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
                    className={cn(
                      'border',
                      isDarkTheme
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-300',
                    )}
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

