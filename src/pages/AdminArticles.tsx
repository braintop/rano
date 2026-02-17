import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RichTextEditor from '@/components/RichTextEditor';
import { Plus, Edit, Trash2, Save, X, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

type EditingArticle = {
  id?: string;
  slug: string;
  status: ArticleStatus;
  titleHe: string;
  subtitleHe: string;
  bodyHe: string;
  titleEn: string;
  subtitleEn: string;
  bodyEn: string;
};

const AdminArticles = () => {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<EditingArticle | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const emptyArticle: EditingArticle = {
    slug: '',
    status: 'draft',
    titleHe: '',
    subtitleHe: '',
    bodyHe: '',
    titleEn: '',
    subtitleEn: '',
    bodyEn: '',
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const snap = await getDocs(collection(db, 'articles'));
      const docs: ArticleDoc[] = snap.docs.map((d) => {
        const data = d.data();
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

      docs.sort((a, b) => {
        const aTs = a.createdAt?.seconds ?? 0;
        const bTs = b.createdAt?.seconds ?? 0;
        return bTs - aTs;
      });

      setArticles(docs);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast({
        title: isHebrew ? 'שגיאה' : 'Error',
        description: isHebrew
          ? 'שגיאה בטעינת המאמרים'
          : 'Error loading articles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewArticle = () => {
    setEditingArticle(emptyArticle);
    setIsDialogOpen(true);
  };

  const handleEditArticle = (article: ArticleDoc) => {
    setEditingArticle({
      id: article.id,
      slug: article.slug || '',
      status: article.status || 'draft',
      titleHe: article.titleHe || '',
      subtitleHe: article.subtitleHe || '',
      bodyHe: article.bodyHe || '',
      titleEn: article.titleEn || '',
      subtitleEn: article.subtitleEn || '',
      bodyEn: article.bodyEn || '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;

    // בדיקת שדות חובה
    if (!editingArticle.slug.trim()) {
      toast({
        title: isHebrew ? 'שגיאה' : 'Error',
        description: isHebrew ? 'חובה להזין Slug' : 'Slug is required',
        variant: 'destructive',
      });
      return;
    }

    if (!editingArticle.titleHe.trim() && !editingArticle.titleEn.trim()) {
      toast({
        title: isHebrew ? 'שגיאה' : 'Error',
        description: isHebrew
          ? 'חובה להזין כותרת לפחות בשפה אחת'
          : 'Title is required in at least one language',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      const articleData = {
        slug: editingArticle.slug,
        status: editingArticle.status,
        titleHe: editingArticle.titleHe,
        subtitleHe: editingArticle.subtitleHe,
        bodyHe: editingArticle.bodyHe,
        titleEn: editingArticle.titleEn,
        subtitleEn: editingArticle.subtitleEn,
        bodyEn: editingArticle.bodyEn,
        createdAt: editingArticle.id
          ? articles.find((a) => a.id === editingArticle.id)?.createdAt
          : Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (editingArticle.id) {
        // עדכון מאמר קיים
        await setDoc(doc(db, 'articles', editingArticle.id), articleData);
        toast({
          title: isHebrew ? 'הצלחה' : 'Success',
          description: isHebrew ? 'המאמר עודכן בהצלחה' : 'Article updated successfully',
        });
      } else {
        // יצירת מאמר חדש
        await addDoc(collection(db, 'articles'), articleData);
        toast({
          title: isHebrew ? 'הצלחה' : 'Success',
          description: isHebrew ? 'המאמר נוצר בהצלחה' : 'Article created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingArticle(null);
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: isHebrew ? 'שגיאה' : 'Error',
        description: isHebrew
          ? 'שגיאה בשמירת המאמר'
          : 'Error saving article',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (
      !confirm(
        isHebrew
          ? 'האם אתה בטוח שברצונך למחוק את המאמר?'
          : 'Are you sure you want to delete this article?'
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'articles', id));
      toast({
        title: isHebrew ? 'הצלחה' : 'Success',
        description: isHebrew ? 'המאמר נמחק בהצלחה' : 'Article deleted successfully',
      });
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: isHebrew ? 'שגיאה' : 'Error',
        description: isHebrew ? 'שגיאה במחיקת המאמר' : 'Error deleting article',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isHebrew ? 'rtl' : 'ltr'}>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {isHebrew ? 'ניהול מאמרים' : 'Manage Articles'}
            </h1>
            <p className="text-muted-foreground">
              {isHebrew
                ? 'צור וערוך מאמרים עם עורך טקסט עשיר'
                : 'Create and edit articles with rich text editor'}
            </p>
          </div>
          <Button onClick={handleNewArticle} size="lg">
            <Plus className="h-5 w-5 ml-2" />
            {isHebrew ? 'מאמר חדש' : 'New Article'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {isHebrew ? 'אין מאמרים עדיין' : 'No articles yet'}
              </p>
              <Button onClick={handleNewArticle}>
                <Plus className="h-4 w-4 ml-2" />
                {isHebrew ? 'צור מאמר ראשון' : 'Create First Article'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const title =
                (isHebrew ? article.titleHe : article.titleEn) ||
                article.titleHe ||
                article.titleEn ||
                article.slug ||
                '';
              const subtitle =
                (isHebrew ? article.subtitleHe : article.subtitleEn) ||
                article.subtitleHe ||
                article.subtitleEn ||
                '';

              return (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">{title}</CardTitle>
                        <CardDescription>{subtitle}</CardDescription>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {article.status === 'published'
                          ? isHebrew
                            ? 'פורסם'
                            : 'Published'
                          : isHebrew
                            ? 'טיוטה'
                            : 'Draft'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground mb-4">
                      <div>
                        <strong>Slug:</strong> {article.slug || article.id}
                      </div>
                      {article.createdAt && (
                        <div>
                          <strong>
                            {isHebrew ? 'תאריך יצירה:' : 'Created:'}
                          </strong>{' '}
                          {new Date(
                            article.createdAt.seconds * 1000
                          ).toLocaleDateString(isHebrew ? 'he-IL' : 'en-GB')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditArticle(article)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        {isHebrew ? 'ערוך' : 'Edit'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `https://www.ranw.tech/articles/${article.slug || article.id}`;
                          const text = encodeURIComponent(
                            `${title}\n\n${url}`
                          );
                          window.open(
                            `https://wa.me/?text=${text}`,
                            '_blank'
                          );
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        title={isHebrew ? 'שתף בוואטסאפ' : 'Share on WhatsApp'}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteArticle(article.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog for creating/editing articles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle>
              {editingArticle?.id
                ? isHebrew
                  ? 'ערוך מאמר'
                  : 'Edit Article'
                : isHebrew
                  ? 'מאמר חדש'
                  : 'New Article'}
            </DialogTitle>
            <DialogDescription>
              {isHebrew
                ? 'מלא את הפרטים בעברית ובאנגלית. השתמש בעורך הטקסט העשיר לעיצוב המאמר.'
                : 'Fill in the details in Hebrew and English. Use the rich text editor to format your article.'}
            </DialogDescription>
          </DialogHeader>

          {editingArticle && (
            <div className="space-y-6 py-4">
              {/* Slug and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug {isHebrew ? '(לכתובת URL)' : '(for URL)'}
                  </Label>
                  <Input
                    id="slug"
                    value={editingArticle.slug}
                    onChange={(e) =>
                      setEditingArticle({
                        ...editingArticle,
                        slug: e.target.value,
                      })
                    }
                    placeholder="my-article-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">
                    {isHebrew ? 'סטטוס' : 'Status'}
                  </Label>
                  <Select
                    value={editingArticle.status}
                    onValueChange={(value: ArticleStatus) =>
                      setEditingArticle({
                        ...editingArticle,
                        status: value,
                      })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        {isHebrew ? 'טיוטה' : 'Draft'}
                      </SelectItem>
                      <SelectItem value="published">
                        {isHebrew ? 'פורסם' : 'Published'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabs for Hebrew and English */}
              <Tabs defaultValue="he" dir="ltr">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="he">עברית (Hebrew)</TabsTrigger>
                  <TabsTrigger value="en">אנגלית (English)</TabsTrigger>
                </TabsList>

                {/* Hebrew Content */}
                <TabsContent value="he" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titleHe">כותרת בעברית</Label>
                    <Input
                      id="titleHe"
                      value={editingArticle.titleHe}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          titleHe: e.target.value,
                        })
                      }
                      placeholder="כותרת המאמר"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitleHe">כותרת משנה בעברית</Label>
                    <Input
                      id="subtitleHe"
                      value={editingArticle.subtitleHe}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          subtitleHe: e.target.value,
                        })
                      }
                      placeholder="כותרת משנה (אופציונלי)"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyHe">תוכן המאמר בעברית</Label>
                    <RichTextEditor
                      value={editingArticle.bodyHe}
                      onChange={(value) =>
                        setEditingArticle({
                          ...editingArticle,
                          bodyHe: value,
                        })
                      }
                      placeholder="תוכן המאמר..."
                    />
                  </div>
                </TabsContent>

                {/* English Content */}
                <TabsContent value="en" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">Title in English</Label>
                    <Input
                      id="titleEn"
                      value={editingArticle.titleEn}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          titleEn: e.target.value,
                        })
                      }
                      placeholder="Article Title"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitleEn">Subtitle in English</Label>
                    <Input
                      id="subtitleEn"
                      value={editingArticle.subtitleEn}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          subtitleEn: e.target.value,
                        })
                      }
                      placeholder="Subtitle (optional)"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyEn">Article Content in English</Label>
                    <RichTextEditor
                      value={editingArticle.bodyEn}
                      onChange={(value) =>
                        setEditingArticle({
                          ...editingArticle,
                          bodyEn: value,
                        })
                      }
                      placeholder="Article content..."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingArticle(null);
              }}
              disabled={isSaving}
            >
              <X className="h-4 w-4 ml-1" />
              {isHebrew ? 'ביטול' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveArticle} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  {isHebrew ? 'שומר...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-1" />
                  {isHebrew ? 'שמור' : 'Save'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminArticles;
