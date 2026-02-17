import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type DebugInfo = {
  slug: string;
  foundById: boolean;
  foundBySlug: boolean;
  documentData: any;
  error: string | null;
  allArticles: any[];
};

const DebugArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    slug: slug || 'NO_SLUG',
    foundById: false,
    foundBySlug: false,
    documentData: null,
    error: null,
    allArticles: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const debug = async () => {
      if (!slug) {
        setDebugInfo(prev => ({ ...prev, error: 'No slug provided' }));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const info: DebugInfo = {
          slug,
          foundById: false,
          foundBySlug: false,
          documentData: null,
          error: null,
          allArticles: [],
        };

        // Try by ID
        console.log('🔍 Trying to find by ID:', slug);
        try {
          const byIdRef = doc(db, 'articles', slug);
          const byIdSnap = await getDoc(byIdRef);
          if (byIdSnap.exists()) {
            info.foundById = true;
            info.documentData = {
              id: byIdSnap.id,
              ...byIdSnap.data(),
            };
            console.log('✅ Found by ID:', info.documentData);
          } else {
            console.log('❌ Not found by ID');
          }
        } catch (error: any) {
          console.error('❌ Error finding by ID:', error);
          info.error = `Error finding by ID: ${error.message}`;
        }

        // Try by slug field
        if (!info.foundById) {
          console.log('🔍 Trying to find by slug field:', slug);
          try {
            const q = query(
              collection(db, 'articles'),
              where('slug', '==', slug),
              limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              info.foundBySlug = true;
              const docSnap = snap.docs[0];
              info.documentData = {
                id: docSnap.id,
                ...docSnap.data(),
              };
              console.log('✅ Found by slug field:', info.documentData);
            } else {
              console.log('❌ Not found by slug field');
            }
          } catch (error: any) {
            console.error('❌ Error finding by slug:', error);
            info.error = `Error finding by slug: ${error.message}`;
          }
        }

        // Get all articles to see what's available
        console.log('🔍 Loading all articles...');
        try {
          const allSnap = await getDocs(collection(db, 'articles'));
          info.allArticles = allSnap.docs.map(d => ({
            id: d.id,
            slug: d.data().slug,
            status: d.data().status,
            titleHe: d.data().titleHe?.substring(0, 50),
            titleEn: d.data().titleEn?.substring(0, 50),
          }));
          console.log('✅ All articles:', info.allArticles);
        } catch (error: any) {
          console.error('❌ Error loading all articles:', error);
        }

        setDebugInfo(info);
      } catch (error: any) {
        console.error('❌ General error:', error);
        setDebugInfo(prev => ({
          ...prev,
          error: `General error: ${error.message}`,
        }));
      } finally {
        setIsLoading(false);
      }
    };

    void debug();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">🔍 Debug Article Loading</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">🔍 Debug - טעינת מאמר</h1>

        {/* Slug Info */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">🎯 Slug שחיפשת:</h2>
          <code className="bg-muted px-3 py-1 rounded text-sm">
            {debugInfo.slug}
          </code>
        </div>

        {/* Search Results */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">🔎 תוצאות חיפוש:</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={debugInfo.foundById ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.foundById ? '✅' : '❌'}
              </span>
              <span>נמצא לפי Document ID</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={debugInfo.foundBySlug ? 'text-green-600' : 'text-red-600'}>
                {debugInfo.foundBySlug ? '✅' : '❌'}
              </span>
              <span>נמצא לפי שדה Slug</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {debugInfo.error && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-red-800">❌ שגיאה:</h2>
            <code className="text-sm text-red-700">{debugInfo.error}</code>
          </div>
        )}

        {/* Document Data */}
        {debugInfo.documentData && (
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">📄 נתוני המסמך:</h2>
            <pre className="bg-muted p-4 rounded overflow-x-auto text-xs" dir="ltr">
              {JSON.stringify(debugInfo.documentData, null, 2)}
            </pre>
          </div>
        )}

        {/* All Articles */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">
            📚 כל המאמרים ב-Firebase ({debugInfo.allArticles.length}):
          </h2>
          <div className="space-y-4">
            {debugInfo.allArticles.map((article, idx) => (
              <div
                key={article.id}
                className="bg-muted p-4 rounded space-y-1 text-sm"
              >
                <div>
                  <strong>#{idx + 1}</strong>
                </div>
                <div>
                  <strong>Document ID:</strong>{' '}
                  <code className="bg-background px-2 py-0.5 rounded">
                    {article.id}
                  </code>
                </div>
                <div>
                  <strong>Slug:</strong>{' '}
                  <code className="bg-background px-2 py-0.5 rounded">
                    {article.slug || '(ריק)'}
                  </code>
                  {article.slug === debugInfo.slug && (
                    <span className="text-green-600 font-bold mr-2">
                      ← זה הSlug שחיפשת!
                    </span>
                  )}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span
                    className={
                      article.status === 'published'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }
                  >
                    {article.status || 'לא מוגדר'}
                  </span>
                </div>
                <div>
                  <strong>כותרת (עברית):</strong> {article.titleHe || '(ריק)'}
                </div>
                <div>
                  <strong>כותרת (אנגלית):</strong> {article.titleEn || '(ריק)'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Console Log Info */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">
            💡 בדוק את ה-Console:
          </h2>
          <p className="text-sm text-blue-700">
            פתח את Developer Tools (F12) והסתכל על ה-Console logs. <br />
            תראה יותר פרטים טכניים שם.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DebugArticle;
