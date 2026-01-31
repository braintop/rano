import { useEffect, useRef, useState } from 'react';
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
  addDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
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
import {
  Moon,
  Sun,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
} from 'lucide-react';
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

type PublicStatus =
  | 'new'
  | 'in_progress'
  | 'meeting_scheduled'
  | 'partial'
  | 'full'
  | 'next_year';

type InsuranceKey =
  | 'directors'
  | 'cyber'
  | 'professional_liability'
  | 'product'
  | 'property'
  | 'travel'
  | 'clinical_trials';

type InsuranceNeed = {
  interested?: boolean;
  renewalDate?: string;
};

type InsuranceNeeds = Record<InsuranceKey, InsuranceNeed>;

type PublicRow = {
  [key: string]: any;
  _id?: string;
  comments?: PublicComment[];
  call_status?: PublicStatus;
};

type ArticleStatus = 'draft' | 'published';

type Article = {
  id: string;
  slug: string;
  status: ArticleStatus;
  titleHe: string;
  subtitleHe: string;
  bodyHe: string;
  titleEn: string;
  subtitleEn: string;
  bodyEn: string;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
};

type SocialConfig = {
  linkedinUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  updatedAt?: { seconds: number; nanoseconds: number };
};

type SeoConfig = {
  titleHe: string;
  descriptionHe: string;
  keywordsHe: string;
  tagsHe: string;
  titleEn: string;
  descriptionEn: string;
  keywordsEn: string;
  tagsEn: string;
  updatedAt?: { seconds: number; nanoseconds: number };
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
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
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
  const [publicStatusPriority, setPublicStatusPriority] =
    useState<PublicStatus | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
    null,
  );
  const [suppressAutoSelectArticle, setSuppressAutoSelectArticle] =
    useState(false);
  const [socialConfig, setSocialConfig] = useState<SocialConfig>({
    linkedinUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
  });
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [seoConfig, setSeoConfig] = useState<SeoConfig>({
    titleHe: '',
    descriptionHe: '',
    keywordsHe: '',
    tagsHe: '',
    titleEn: '',
    descriptionEn: '',
    keywordsEn: '',
    tagsEn: '',
  });
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);
  const [isSavingSeo, setIsSavingSeo] = useState(false);
  const [articleLang, setArticleLang] = useState<'he' | 'en'>('he');
  const [articleForm, setArticleForm] = useState<{
    slug: string;
    status: ArticleStatus;
    titleHe: string;
    subtitleHe: string;
    bodyHe: string;
    titleEn: string;
    subtitleEn: string;
    bodyEn: string;
  }>({
    slug: '',
    status: 'draft',
    titleHe: '',
    subtitleHe: '',
    bodyHe: '',
    titleEn: '',
    subtitleEn: '',
    bodyEn: '',
  });
  const articleEditorRef = useRef<HTMLDivElement | null>(null);

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

  // Articles collection (מאמרים)
  useEffect(() => {
    if (!isAuthorized) {
      setArticles([]);
      setSelectedArticleId(null);
      return;
    }

    const colRef = collection(db, 'articles');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    setIsLoadingArticles(true);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Article[] = snapshot.docs.map((d) => {
          const raw = d.data() as any;
          return {
            id: d.id,
            slug: raw.slug ?? '',
            status: (raw.status as ArticleStatus) ?? 'draft',
            titleHe: raw.titleHe ?? '',
            subtitleHe: raw.subtitleHe ?? '',
            bodyHe: raw.bodyHe ?? '',
            titleEn: raw.titleEn ?? '',
            subtitleEn: raw.subtitleEn ?? '',
            bodyEn: raw.bodyEn ?? '',
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          };
        });
        setArticles(data);
        setIsLoadingArticles(false);
      },
      () => setIsLoadingArticles(false),
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  // Social config (public_config/social_links)
  useEffect(() => {
    if (!isAuthorized) {
      setSocialConfig({
        linkedinUrl: '',
        facebookUrl: '',
        twitterUrl: '',
        instagramUrl: '',
      });
      return;
    }

    const load = async () => {
      try {
        setIsLoadingSocial(true);
        const ref = doc(db, 'public_config', 'social_links');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          setSocialConfig({
            linkedinUrl: data.linkedinUrl ?? '',
            facebookUrl: data.facebookUrl ?? '',
            twitterUrl: data.twitterUrl ?? '',
            instagramUrl: data.instagramUrl ?? '',
            updatedAt: data.updatedAt,
          });
        } else {
          setSocialConfig({
            linkedinUrl: '',
            facebookUrl: '',
            twitterUrl: '',
            instagramUrl: '',
          });
        }
      } catch (error) {
        console.error('Error loading social config:', error);
      } finally {
        setIsLoadingSocial(false);
      }
    };

    void load();
  }, [isAuthorized]);

  // SEO config (public_config/site)
  useEffect(() => {
    if (!isAuthorized) {
      setSeoConfig({
        titleHe: '',
        descriptionHe: '',
        keywordsHe: '',
        tagsHe: '',
        titleEn: '',
        descriptionEn: '',
        keywordsEn: '',
        tagsEn: '',
      });
      return;
    }

    const loadSeo = async () => {
      try {
        setIsLoadingSeo(true);
        const ref = doc(db, 'public_config', 'site');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          setSeoConfig({
            titleHe: data.titleHe ?? '',
            descriptionHe: data.descriptionHe ?? '',
            keywordsHe: data.keywordsHe ?? '',
            tagsHe: data.tagsHe ?? '',
            titleEn: data.titleEn ?? '',
            descriptionEn: data.descriptionEn ?? '',
            keywordsEn: data.keywordsEn ?? '',
            tagsEn: data.tagsEn ?? '',
            updatedAt: data.updatedAt,
          });
        }
      } catch (error) {
        console.error('Error loading SEO config:', error);
      } finally {
        setIsLoadingSeo(false);
      }
    };

    void loadSeo();
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
      id: 'meeting_scheduled',
      labelHe: 'נקבעה פגישה',
      labelEn: 'Meeting scheduled',
      activeClass: 'bg-purple-500 text-white',
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

  const insuranceOptions: {
    id: InsuranceKey;
    labelHe: string;
    labelEn: string;
  }[] = [
    { id: 'directors', labelHe: 'דירקטורים', labelEn: 'Directors' },
    { id: 'cyber', labelHe: 'סייבר', labelEn: 'Cyber' },
    {
      id: 'professional_liability',
      labelHe: 'אחריות מקצועית',
      labelEn: 'Professional liability',
    },
    { id: 'product', labelHe: 'מוצר', labelEn: 'Product' },
    { id: 'property', labelHe: 'רכוש', labelEn: 'Property' },
    { id: 'travel', labelHe: 'נסיעות', labelEn: 'Travel' },
    {
      id: 'clinical_trials',
      labelHe: 'ניסויים קליניים',
      labelEn: 'Clinical trials',
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

  const handleUpdateInsuranceNeed = async (
    row: PublicRow,
    key: InsuranceKey,
    changes: Partial<InsuranceNeed>,
  ) => {
    if (!row?._id) return;

    const prev =
      (row.insurance_needs as InsuranceNeeds | undefined) ?? ({} as InsuranceNeeds);
    const updatedForKey: InsuranceNeed = {
      ...(prev[key] ?? {}),
      ...changes,
    };
    const updated: InsuranceNeeds = {
      ...prev,
      [key]: updatedForKey,
    };

    try {
      const ref = doc(db, 'public_150', row._id);
      await updateDoc(ref, { insurance_needs: updated });

      setPublicRows((current) =>
        current.map((r) =>
          r._id === row._id ? { ...r, insurance_needs: updated } : r,
        ),
      );
    } catch (error) {
      console.error('Error updating insurance needs for public_150:', error);
    }
  };

  const prioritizedPublicRows = publicStatusPriority
    ? [...filteredPublicRows].sort((a, b) => {
        const aStatus: PublicStatus = (a.call_status as PublicStatus) ?? 'new';
        const bStatus: PublicStatus = (b.call_status as PublicStatus) ?? 'new';

        const aMatch = aStatus === publicStatusPriority;
        const bMatch = bStatus === publicStatusPriority;

        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      })
    : filteredPublicRows;

  const cyclePublicStatusPriority = () => {
    const order = publicStatusOptions.map((opt) => opt.id);
    setPublicStatusPriority((current) => {
      if (current === null) {
        return order[0] ?? null;
      }
      const idx = order.indexOf(current);
      if (idx === -1 || idx === order.length - 1) {
        return null;
      }
      return order[idx + 1] ?? null;
    });
  };

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

  const resetArticleForm = () => {
    setArticleForm({
      slug: '',
      status: 'draft',
      titleHe: '',
      subtitleHe: '',
      bodyHe: '',
      titleEn: '',
      subtitleEn: '',
      bodyEn: '',
    });
    setArticleLang('he');
  };

  const loadArticleToForm = (article: Article) => {
    setSelectedArticleId(article.id);
    setArticleForm({
      slug: article.slug,
      status: article.status ?? 'draft',
      titleHe: article.titleHe ?? '',
      subtitleHe: article.subtitleHe ?? '',
      bodyHe: article.bodyHe ?? '',
      titleEn: article.titleEn ?? '',
      subtitleEn: article.subtitleEn ?? '',
      bodyEn: article.bodyEn ?? '',
    });
    setArticleLang('he');
  };

  useEffect(() => {
    // When switching to Articles tab, auto-select first article if none selected
    if (
      topSection === 'articles' &&
      articles.length > 0 &&
      !selectedArticleId &&
      !suppressAutoSelectArticle
    ) {
      loadArticleToForm(articles[0]);
    }
  }, [topSection, articles, selectedArticleId, suppressAutoSelectArticle]);

  const handleSelectArticle = (article: Article) => {
    setSuppressAutoSelectArticle(false);
    loadArticleToForm(article);
  };

  const handleNewArticle = () => {
    setSelectedArticleId(null);
    setSuppressAutoSelectArticle(true);
    resetArticleForm();
  };

  const handleArticleFieldChange = (field: keyof typeof articleForm, value: string) => {
    setArticleForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleArticleSave = async () => {
    if (!articleForm.slug.trim()) {
      window.alert(
        isHebrew ? 'חייבים להגדיר slug לכתובת המאמר.' : 'Slug is required.',
      );
      return;
    }

    const payload = {
      slug: articleForm.slug.trim(),
      status: articleForm.status,
      titleHe: articleForm.titleHe.trim(),
      subtitleHe: articleForm.subtitleHe.trim(),
      bodyHe: articleForm.bodyHe,
      titleEn: articleForm.titleEn.trim(),
      subtitleEn: articleForm.subtitleEn.trim(),
      bodyEn: articleForm.bodyEn,
      updatedAt: serverTimestamp(),
    };

    try {
      if (selectedArticleId) {
        const ref = doc(db, 'articles', selectedArticleId);
        await updateDoc(ref, payload);

        const { updatedAt: _ignore, ...rest } = payload;

        // עדכון מיידי גם ב־state המקומי
        setArticles((current) =>
          current.map((article) =>
            article.id === selectedArticleId
              ? {
                  ...article,
                  ...rest,
                }
              : article,
          ),
        );
      } else {
        const colRef = collection(db, 'articles');
        const ref = await addDoc(colRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSelectedArticleId(ref.id);

         // הוספה מיידית לרשימת המאמרים (לפני שה‑snapshot מביא עדכון)
         setArticles((current) => [
           {
             id: ref.id,
             slug: articleForm.slug.trim(),
             status: articleForm.status,
             titleHe: articleForm.titleHe.trim(),
             subtitleHe: articleForm.subtitleHe.trim(),
             bodyHe: articleForm.bodyHe,
             titleEn: articleForm.titleEn.trim(),
             subtitleEn: articleForm.subtitleEn.trim(),
             bodyEn: articleForm.bodyEn,
           },
           ...current,
         ]);
      }

      window.alert(
        isHebrew ? 'המאמר נשמר בהצלחה.' : 'Article saved successfully.',
      );
    } catch (error) {
      console.error('Error saving article:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בעת שמירת המאמר. ראה קונסול לפרטים.'
          : 'An error occurred while saving the article. See console for details.',
      );
    }
  };

  const handleDeleteArticle = async (article: Article) => {
    if (!window.confirm(isHebrew ? 'למחוק את המאמר?' : 'Delete this article?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'articles', article.id));
      setArticles((current) => current.filter((a) => a.id !== article.id));
      if (selectedArticleId === article.id) {
        resetArticleForm();
        setSelectedArticleId(null);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בעת מחיקת המאמר. ראה קונסול לפרטים.'
          : 'An error occurred while deleting the article. See console for details.',
      );
    }
  };

  const handleArticleCommand = (command: string) => {
    if (!articleEditorRef.current) return;
    articleEditorRef.current.focus();

    if (command === 'createLink') {
      const url = window.prompt(
        isHebrew ? 'הכנס כתובת קישור (URL)' : 'Enter link URL',
      );
      if (!url) return;
      document.execCommand('createLink', false, url);
      return;
    }

    if (command === 'removeFormat') {
      document.execCommand('removeFormat', false);
      return;
    }

    document.execCommand(command, false);
  };

  const handleSocialFieldChange = (
    field: keyof SocialConfig,
    value: string,
  ) => {
    setSocialConfig((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveSocial = async () => {
    try {
      setIsSavingSocial(true);
      const ref = doc(db, 'public_config', 'social_links');
      await setDoc(
        ref,
        {
          linkedinUrl: socialConfig.linkedinUrl.trim(),
          facebookUrl: socialConfig.facebookUrl.trim(),
          twitterUrl: socialConfig.twitterUrl.trim(),
          instagramUrl: socialConfig.instagramUrl.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      window.alert(
        isHebrew
          ? 'קישורי הרשתות החברתיות נשמרו בהצלחה.'
          : 'Social links saved successfully.',
      );
    } catch (error) {
      console.error('Error saving social config:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בשמירת הקישורים. ראה קונסול לפרטים.'
          : 'An error occurred while saving social links. See console for details.',
      );
    } finally {
      setIsSavingSocial(false);
    }
  };

  const handleSeoFieldChange = (field: keyof SeoConfig, value: string) => {
    setSeoConfig((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveSeo = async () => {
    try {
      setIsSavingSeo(true);
      const ref = doc(db, 'public_config', 'site');
      await setDoc(
        ref,
        {
          titleHe: seoConfig.titleHe.trim(),
          descriptionHe: seoConfig.descriptionHe.trim(),
          keywordsHe: seoConfig.keywordsHe.trim(),
          tagsHe: seoConfig.tagsHe.trim(),
          titleEn: seoConfig.titleEn.trim(),
          descriptionEn: seoConfig.descriptionEn.trim(),
          keywordsEn: seoConfig.keywordsEn.trim(),
          tagsEn: seoConfig.tagsEn.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      window.alert(
        isHebrew ? 'הגדרות ה‑SEO נשמרו בהצלחה.' : 'SEO settings saved successfully.',
      );
    } catch (error) {
      console.error('Error saving SEO config:', error);
      window.alert(
        isHebrew
          ? 'אירעה שגיאה בשמירת ה‑SEO. ראה קונסול לפרטים.'
          : 'An error occurred while saving SEO settings. See console for details.',
      );
    } finally {
      setIsSavingSeo(false);
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
        {user && isAuthorized && (
        <header className="mb-8 flex flex-col gap-4">
          {/* Main admin navbar (Leads / Articles / Social / SEO) + theme toggle */}
          <div className="flex items-center justify-between gap-3">
            <nav
              className={cn(
                'inline-flex items-center rounded-full border px-1 py-1 text-xs md:text-sm',
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

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 text-xs md:text-sm"
                onClick={handleLogout}
              >
                {isHebrew ? 'התנתקות' : 'Logout'}
              </Button>
              {/* Theme toggle */}
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
          </div>

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

              {segment === 'all' && (
                <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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
                  </div>

                  <p className="text-xs text-slate-500">
                    {isHebrew
                      ? `${filteredLeads.length} לידים מוצגים מתוך ${leads.length}`
                      : `${filteredLeads.length} leads shown of ${leads.length}`}
                  </p>
                </div>
              )}
            </>
          )}

        </header>
        )}

        {authLoading ? (
          <p className="text-slate-400">
            {isHebrew ? 'בודק הרשאות...' : 'Checking permissions...'}
          </p>
        ) : !user ? (
          <div
            className={cn(
              'max-w-md mx-auto rounded-xl p-6 space-y-4 border',
              isDarkTheme
                ? 'bg-slate-900/70 border-slate-700 text-slate-50'
                : 'bg-white border-slate-200 shadow-sm text-slate-900',
            )}
          >
            <h2 className="text-xl font-semibold">
              {isHebrew ? 'התחברות נדרשת' : 'Login required'}
            </h2>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <label
                  className={cn(
                    'text-sm',
                    isDarkTheme ? 'text-slate-200' : 'text-slate-700',
                  )}
                  htmlFor="admin-email"
                >
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
                  className={cn(
                    isDarkTheme
                      ? 'bg-slate-950 border-slate-700 text-slate-50 placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400',
                  )}
                />
              </div>
              <div className="space-y-1">
                <label
                  className={cn(
                    'text-sm',
                    isDarkTheme ? 'text-slate-200' : 'text-slate-700',
                  )}
                  htmlFor="admin-password"
                >
                  {isHebrew ? 'סיסמה' : 'Password'}
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className={cn(
                    isDarkTheme
                      ? 'bg-slate-950 border-slate-700 text-slate-50 placeholder:text-slate-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400',
                  )}
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
        ) : topSection === 'articles' ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,320px),minmax(0,1fr)]">
            {/* Articles list */}
            <section
              className={cn(
                'rounded-2xl border p-4 flex flex-col gap-4',
                isDarkTheme
                  ? 'bg-slate-900/70 border-slate-800'
                  : 'bg-white border-slate-200 shadow-sm',
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div>
                  <h2 className="text-base md:text-lg font-semibold">
                    {isHebrew ? 'מאמרים' : 'Articles'}
                  </h2>
                  <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">
                    {isHebrew
                      ? 'ניהול מאמרים + פרסום באתר'
                      : 'Manage articles and publish to the site'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-amber-400 text-black hover:bg-amber-300"
                  onClick={handleNewArticle}
                >
                  {isHebrew ? '+ הוסף מאמר' : '+ Add article'}
                </Button>
              </div>

              {isLoadingArticles ? (
                <p className="text-sm text-slate-400">
                  {isHebrew ? 'טוען מאמרים...' : 'Loading articles...'}
                </p>
              ) : articles.length === 0 ? (
                <p className="text-sm text-slate-400">
                  {isHebrew
                    ? 'עדיין אין מאמרים. לחץ על "+ הוסף מאמר" כדי להתחיל.'
                    : 'No articles yet. Click "+ Add article" to start.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {articles.map((article) => {
                    const isActive = selectedArticleId === article.id;
                    const statusLabel =
                      article.status === 'published'
                        ? isHebrew
                          ? 'מפורסם'
                          : 'Published'
                        : isHebrew
                        ? 'טיוטה'
                        : 'Draft';
                    return (
                      <div
                        key={article.id}
                        onClick={() => handleSelectArticle(article)}
                        className={cn(
                          'w-full rounded-2xl border px-3 py-3 text-right flex items-center justify-between gap-3 transition-colors cursor-pointer',
                          isActive
                            ? 'border-amber-400 bg-amber-50/10'
                            : isDarkTheme
                            ? 'border-slate-700 hover:bg-slate-900'
                            : 'border-slate-200 hover:bg-slate-50',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {article.titleHe || article.titleEn || article.slug}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {article.slug}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isHebrew ? 'סטטוס: ' : 'Status: '}
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-[10px] border',
                                article.status === 'published'
                                  ? 'border-emerald-500 text-emerald-500'
                                  : 'border-slate-400 text-slate-500',
                              )}
                            >
                              {statusLabel}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteArticle(article);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
                          aria-label={isHebrew ? 'מחק מאמר' : 'Delete article'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Article editor */}
            <section
              className={cn(
                'rounded-2xl border p-4 md:p-6 flex flex-col gap-4',
                isDarkTheme
                  ? 'bg-slate-900/70 border-slate-800'
                  : 'bg-white border-slate-200 shadow-sm',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base md:text-lg font-semibold">
                    {isHebrew ? 'עריכת מאמר' : 'Edit article'}
                  </h2>
                  <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">
                    URL: <span className="font-mono text-xs">/articles/slug</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-full border text-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setArticleLang('he')}
                      className={cn(
                        'px-3 py-1',
                        articleLang === 'he'
                          ? 'bg-slate-900 text-white'
                          : 'bg-transparent text-slate-500',
                      )}
                    >
                      עברית
                    </button>
                  </div>
                  <div className="flex rounded-full border text-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setArticleLang('en')}
                      className={cn(
                        'px-3 py-1',
                        articleLang === 'en'
                          ? 'bg-slate-900 text-white'
                          : 'bg-transparent text-slate-500',
                      )}
                    >
                      English
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)] items-center">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {isHebrew ? 'Slug (אנגלית)' : 'Slug (English)'}
                  </label>
                  <Input
                    dir="ltr"
                    value={articleForm.slug}
                    onChange={(e) =>
                      handleArticleFieldChange('slug', e.target.value)
                    }
                    placeholder="my-article-slug"
                    className={cn(
                      isDarkTheme
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-300',
                    )}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {isHebrew ? 'סטטוס' : 'Status'}
                  </label>
                  <select
                    value={articleForm.status}
                    onChange={(e) =>
                      handleArticleFieldChange(
                        'status',
                        e.target.value as ArticleStatus,
                      )
                    }
                    className={cn(
                      'w-full rounded-full border px-3 py-2 text-xs md:text-sm bg-transparent',
                      isDarkTheme
                        ? 'border-slate-700 text-slate-100'
                        : 'border-slate-300 text-slate-800',
                    )}
                  >
                    <option value="draft">
                      {isHebrew ? 'טיוטה' : 'Draft'}
                    </option>
                    <option value="published">
                      {isHebrew ? 'מפורסם' : 'Published'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Title / Subtitle / Body for current language */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {articleLang === 'he'
                      ? 'כותרת (עברית)'
                      : 'Title (English)'}
                  </label>
                  <Input
                    value={
                      articleLang === 'he'
                        ? articleForm.titleHe
                        : articleForm.titleEn
                    }
                    onChange={(e) =>
                      handleArticleFieldChange(
                        articleLang === 'he' ? 'titleHe' : 'titleEn',
                        e.target.value,
                      )
                    }
                    className={cn(
                      isDarkTheme
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-300',
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {articleLang === 'he'
                      ? 'תת־כותרת (עברית)'
                      : 'Subtitle (English)'}
                  </label>
                  <Input
                    value={
                      articleLang === 'he'
                        ? articleForm.subtitleHe
                        : articleForm.subtitleEn
                    }
                    onChange={(e) =>
                      handleArticleFieldChange(
                        articleLang === 'he' ? 'subtitleHe' : 'subtitleEn',
                        e.target.value,
                      )
                    }
                    className={cn(
                      isDarkTheme
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-300',
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">
                    {articleLang === 'he'
                      ? 'גוף המאמר (עברית)'
                      : 'Body (English)'}
                  </label>

                  {/* Rich text toolbar */}
                  <div
                    className={cn(
                      'inline-flex flex-wrap items-center gap-1 rounded-full border px-2 py-1 text-[11px]',
                      isDarkTheme
                        ? 'border-slate-700 bg-slate-900/80'
                        : 'border-slate-200 bg-slate-50',
                    )}
                  >
                    <span className="px-2 text-slate-400">
                      {isHebrew ? 'עיצוב טקסט' : 'Text style'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('bold')}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('italic')}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('underline')}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <Underline size={14} />
                    </button>
                    <span className="mx-1 h-4 w-px bg-slate-400/40" />
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('insertUnorderedList')}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <List size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('insertOrderedList')}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <ListOrdered size={14} />
                    </button>
                    <span className="mx-1 h-4 w-px bg-slate-400/40" />
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('justifyLeft')}
                      className="hidden md:flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('justifyCenter')}
                      className="hidden md:flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('justifyRight')}
                      className="hidden md:flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <AlignRight size={14} />
                    </button>
                    <span className="mx-1 h-4 w-px bg-slate-400/40" />
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('createLink')}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-800/10"
                    >
                      <Link2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArticleCommand('removeFormat')}
                      className="px-2 py-1 rounded-full text-[10px] text-slate-400 hover:bg-slate-800/10"
                    >
                      {isHebrew ? 'Tx' : 'Tx'}
                    </button>
                  </div>

                  <div
                    ref={articleEditorRef}
                    contentEditable
                    dir={articleLang === 'he' ? 'rtl' : 'ltr'}
                    className={cn(
                      'mt-1 min-h-[220px] rounded-2xl border px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                      isDarkTheme
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-white border-slate-300',
                    )}
                    onInput={(e) => {
                      const html = (e.currentTarget as HTMLDivElement).innerHTML;
                      handleArticleFieldChange(
                        articleLang === 'he' ? 'bodyHe' : 'bodyEn',
                        html,
                      );
                    }}
                    dangerouslySetInnerHTML={{
                      __html:
                        articleLang === 'he'
                          ? articleForm.bodyHe
                          : articleForm.bodyEn,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={handleNewArticle}
                >
                  {isHebrew ? 'מאמר חדש' : 'New article'}
                </Button>
                <Button
                  type="button"
                  className="rounded-full bg-amber-400 text-black hover:bg-amber-300"
                  onClick={handleArticleSave}
                >
                  {isHebrew ? 'שמירה' : 'Save'}
                </Button>
              </div>
            </section>
          </div>
        ) : topSection === 'social' ? (
          <section
            className={cn(
              'mt-8 rounded-2xl border p-4 md:p-6',
              isDarkTheme
                ? 'bg-slate-900/70 border-slate-800'
                : 'bg-white border-slate-200 shadow-sm',
            )}
          >
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {isHebrew ? 'רשתות חברתיות' : 'Social networks'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isHebrew
                    ? 'שמור קישורים לפרופילים הרשמיים שיופיעו באתר.'
                    : 'Save links to your official profiles that appear on the site.'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  path: <span className="font-semibold">public_config/social_links</span>
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400" htmlFor="social-linkedin">
                  LinkedIn URL
                </label>
                <Input
                  id="social-linkedin"
                  dir="ltr"
                  placeholder="https://www.linkedin.com/in/username"
                  value={socialConfig.linkedinUrl}
                  onChange={(e) =>
                    handleSocialFieldChange('linkedinUrl', e.target.value)
                  }
                  className={cn(
                    'text-xs md:text-sm',
                    isDarkTheme
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-white border-slate-300',
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400" htmlFor="social-facebook">
                  Facebook URL
                </label>
                <Input
                  id="social-facebook"
                  dir="ltr"
                  placeholder="https://www.facebook.com/username"
                  value={socialConfig.facebookUrl}
                  onChange={(e) =>
                    handleSocialFieldChange('facebookUrl', e.target.value)
                  }
                  className={cn(
                    'text-xs md:text-sm',
                    isDarkTheme
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-white border-slate-300',
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400" htmlFor="social-twitter">
                  X / Twitter URL
                </label>
                <Input
                  id="social-twitter"
                  dir="ltr"
                  placeholder="https://x.com/username"
                  value={socialConfig.twitterUrl}
                  onChange={(e) =>
                    handleSocialFieldChange('twitterUrl', e.target.value)
                  }
                  className={cn(
                    'text-xs md:text-sm',
                    isDarkTheme
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-white border-slate-300',
                  )}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400" htmlFor="social-instagram">
                  Instagram URL
                </label>
                <Input
                  id="social-instagram"
                  dir="ltr"
                  placeholder="https://www.instagram.com/username"
                  value={socialConfig.instagramUrl}
                  onChange={(e) =>
                    handleSocialFieldChange('instagramUrl', e.target.value)
                  }
                  className={cn(
                    'text-xs md:text-sm',
                    isDarkTheme
                      ? 'bg-slate-950 border-slate-800'
                      : 'bg-white border-slate-300',
                  )}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <Button
                type="button"
                className="rounded-full bg-amber-400 text-black hover:bg-amber-300"
                onClick={handleSaveSocial}
                disabled={isSavingSocial || isLoadingSocial}
              >
                {isSavingSocial
                  ? isHebrew
                    ? 'שומר...'
                    : 'Saving...'
                  : isHebrew
                  ? 'שמירה'
                  : 'Save'}
              </Button>
            </div>
          </section>
        ) : topSection === 'seo' ? (
          <section className="mt-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {isHebrew ? 'תגיות / תיאורי מטה / SEO' : 'SEO / Meta tags'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isHebrew
                    ? 'הגדרת כותרות ותיאורי מטה שיופיעו בגוגל ובשיתוף ברשתות.'
                    : 'Configure titles and meta descriptions used for SEO and social sharing.'}
                </p>
              </div>
              <div className="text-[10px] text-slate-500 text-left md:text-right font-mono">
                path: <span className="font-semibold">public_config/site</span>
              </div>
            </div>

            {isLoadingSeo ? (
              <p className="text-sm text-slate-400">
                {isHebrew ? 'טוען הגדרות SEO...' : 'Loading SEO settings...'}
              </p>
            ) : (
              <div
                className={cn(
                  'grid gap-4 md:grid-cols-2',
                  isDarkTheme ? 'text-slate-100' : 'text-slate-900',
                )}
              >
                {/* Hebrew column */}
                <div
                  className={cn(
                    'rounded-2xl border p-4 md:p-6 space-y-4',
                    isDarkTheme
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm',
                  )}
                >
                  <h3 className="text-base font-semibold mb-1">
                    {isHebrew ? 'עברית' : 'Hebrew'}
                  </h3>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      {isHebrew ? 'כותרת' : 'Title'}
                    </label>
                    <Input
                      value={seoConfig.titleHe}
                      onChange={(e) =>
                        handleSeoFieldChange('titleHe', e.target.value)
                      }
                      className={cn(
                        isDarkTheme
                          ? 'bg-slate-900 border-slate-700'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      {isHebrew ? 'תיאור' : 'Description'}
                    </label>
                    <Textarea
                      value={seoConfig.descriptionHe}
                      onChange={(e) =>
                        handleSeoFieldChange('descriptionHe', e.target.value)
                      }
                      rows={5}
                      className={cn(
                        'text-sm',
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      {isHebrew ? 'מילות מפתח (מופרד בפסיקים)' : 'Keywords (comma separated)'}
                    </label>
                    <Textarea
                      value={seoConfig.keywordsHe}
                      onChange={(e) =>
                        handleSeoFieldChange('keywordsHe', e.target.value)
                      }
                      rows={3}
                      className={cn(
                        'text-sm',
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      {isHebrew ? 'Tags (מופרד בפסיקים)' : 'Tags (comma separated)'}
                    </label>
                    <Textarea
                      value={seoConfig.tagsHe}
                      onChange={(e) =>
                        handleSeoFieldChange('tagsHe', e.target.value)
                      }
                      rows={3}
                      className={cn(
                        'text-sm',
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>
                </div>

                {/* English column */}
                <div
                  className={cn(
                    'rounded-2xl border p-4 md:p-6 space-y-4',
                    isDarkTheme
                      ? 'bg-slate-900/70 border-slate-800'
                      : 'bg-white border-slate-200 shadow-sm',
                  )}
                >
                  <h3 className="text-base font-semibold mb-1">English</h3>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Title</label>
                    <Input
                      dir="ltr"
                      value={seoConfig.titleEn}
                      onChange={(e) =>
                        handleSeoFieldChange('titleEn', e.target.value)
                      }
                      className={cn(
                        isDarkTheme
                          ? 'bg-slate-900 border-slate-700'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Description</label>
                    <Textarea
                      dir="ltr"
                      value={seoConfig.descriptionEn}
                      onChange={(e) =>
                        handleSeoFieldChange('descriptionEn', e.target.value)
                      }
                      rows={5}
                      className={cn(
                        'text-sm',
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Keywords (comma separated)
                    </label>
                    <Textarea
                      dir="ltr"
                      value={seoConfig.keywordsEn}
                      onChange={(e) =>
                        handleSeoFieldChange('keywordsEn', e.target.value)
                      }
                      rows={3}
                      className={cn(
                        'text-sm',
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">
                      Tags (comma separated)
                    </label>
                    <Textarea
                      dir="ltr"
                      value={seoConfig.tagsEn}
                      onChange={(e) =>
                        handleSeoFieldChange('tagsEn', e.target.value)
                      }
                      rows={3}
                      className={cn(
                        'text-sm',
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-white border-slate-300',
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
              <Button
                type="button"
                className="rounded-full bg-amber-400 text-black hover:bg-amber-300"
                onClick={handleSaveSeo}
                disabled={isSavingSeo}
              >
                {isSavingSeo
                  ? isHebrew
                    ? 'שומר...'
                    : 'Saving...'
                  : isHebrew
                  ? 'שמירה'
                  : 'Save'}
              </Button>
            </div>
          </section>
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
                    <div
                      className="font-medium cursor-pointer select-none flex items-center justify-center gap-1"
                      onClick={cyclePublicStatusPriority}
                      title={
                        isHebrew
                          ? 'לחץ כדי להחליף סינון לפי סטטוס (חדש → בטיפול → נקבעה פגישה וכו\')'
                          : 'Click to cycle status priority (New → In progress → Meeting scheduled etc.)'
                      }
                    >
                      <span>{isHebrew ? 'סטטוס' : 'Status'}</span>
                      {publicStatusPriority && (
                        <span className="text-[10px] text-slate-400">
                          {(
                            publicStatusOptions.find(
                              (opt) => opt.id === publicStatusPriority,
                            ) ?? publicStatusOptions[0]
                          )[isHebrew ? 'labelHe' : 'labelEn']}
                        </span>
                      )}
                  </div>
                </div>

                {prioritizedPublicRows.map((row, index) => {
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
                        <div
                          className="font-semibold truncate text-left"
                          dir="ltr"
                          title={company || (isHebrew ? 'ללא חברה' : 'No company')}
                        >
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
                              title={website}
                            >
                              {isHebrew ? 'אתר אינטרנט' : 'Website'}
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
                          <div className="flex flex-wrap gap-2 mb-3">
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

                          {/* Insurance needs under status buttons */}
                          <div className="space-y-2">
                            <p className="text-slate-400">
                              {isHebrew
                                ? 'חידושי ביטוח (סמן + תאריך חידוש)'
                                : 'Insurance renewals (check + renewal date)'}
                            </p>
                            <div className="grid gap-2 md:grid-cols-2">
                              {insuranceOptions.map((ins) => {
                                const needs =
                                  (row.insurance_needs as
                                    | InsuranceNeeds
                                    | undefined) ?? ({} as InsuranceNeeds);
                                const current = needs[ins.id] ?? {};
                                return (
                                  <div
                                    key={ins.id}
                                    className="flex items-center gap-2"
                                  >
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={!!current.interested}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleUpdateInsuranceNeed(
                                            row,
                                            ins.id,
                                            { interested: e.target.checked },
                                          );
                                        }}
                                      />
                                      <span className="text-xs md:text-sm">
                                        {isHebrew ? ins.labelHe : ins.labelEn}
                                      </span>
                                    </label>
                                    <Input
                                      type="date"
                                      value={current.renewalDate ?? ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleUpdateInsuranceNeed(row, ins.id, {
                                          renewalDate: e.target.value,
                                        });
                                      }}
                                      className={cn(
                                        'h-8 text-[11px] max-w-[140px]',
                                        isDarkTheme
                                          ? 'bg-slate-900 border-slate-700'
                                          : 'bg-white border-slate-300',
                                      )}
                                    />
                                  </div>
                                );
                              })}
                            </div>
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
                                key === '_id' ||
                                key === 'insurance_needs'
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

