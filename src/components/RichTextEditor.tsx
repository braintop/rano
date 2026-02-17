import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, Extension, Node } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Palette,
  Highlighter,
  Undo,
  Redo,
  Code,
  Video,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ReadOnlyRichTextProps {
  value: string;
  placeholder?: string;
}

// Extension מותאם אישית ל-dir attribute על פסקאות
const TextDirection = Extension.create({
  name: 'customTextDirection',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'codeBlock'],
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => element.getAttribute('dir'),
            renderHTML: (attributes) => {
              if (!attributes.dir) {
                return {};
              }
              return {
                dir: attributes.dir,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction: 'ltr' | 'rtl' | 'auto') =>
        ({ state, tr, dispatch }: any) => {
          const { selection } = state;
          const { $from } = selection;
          const node = $from.parent;

          if (
            node.type.name === 'paragraph' ||
            node.type.name.startsWith('heading')
          ) {
            const pos = $from.before($from.depth);
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                dir: direction,
              });
              dispatch(tr);
            }
            return true;
          }
          return false;
        },
      unsetTextDirection:
        () =>
        ({ state, tr, dispatch }: any) => {
          const { selection } = state;
          const { $from } = selection;
          const node = $from.parent;

          if (
            node.type.name === 'paragraph' ||
            node.type.name.startsWith('heading')
          ) {
            const pos = $from.before($from.depth);
            if (dispatch) {
              const { dir, ...attrs } = node.attrs;
              tr.setNodeMarkup(pos, undefined, attrs);
              dispatch(tr);
            }
            return true;
          }
          return false;
        },
    };
  },
});

// פונקציה להמרת URL ל-embed URL (YouTube או Vimeo)
const getEmbedUrl = (
  input: string,
  type: 'youtube' | 'vimeo'
): string | null => {
  let url = input.trim();

  // אם זה iframe code, נחלץ את ה-URL מתוכו
  if (url.includes('<iframe') || url.includes('iframe')) {
    const srcMatch = url.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1].trim();
    } else {
      if (type === 'youtube') {
        const youtubeMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
        if (youtubeMatch && youtubeMatch[1]) {
          return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }
      } else if (type === 'vimeo') {
        const vimeoMatch = url.match(/vimeo\.com\/video\/([0-9]+)/);
        if (vimeoMatch && vimeoMatch[1]) {
          return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
      }
      return null;
    }
  }

  // YouTube
  if (type === 'youtube') {
    if (url.includes('youtube.com/embed/')) {
      const videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1]?.split('&')[0]?.split('#')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  }

  // Vimeo
  if (type === 'vimeo') {
    if (url.includes('player.vimeo.com/video/')) {
      const videoId = url.split('video/')[1]?.split('?')[0]?.split('&')[0] || '';
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    if (url.includes('vimeo.com')) {
      let videoId = '';

      if (url.includes('vimeo.com/manage/videos/')) {
        videoId =
          url.split('vimeo.com/manage/videos/')[1]?.split('?')[0]?.split('/')[0] ||
          '';
      } else if (url.includes('vimeo.com/video/')) {
        videoId =
          url.split('vimeo.com/video/')[1]?.split('?')[0]?.split('/')[0] || '';
      } else if (url.includes('player.vimeo.com/video/')) {
        videoId = url.split('video/')[1]?.split('?')[0]?.split('&')[0] || '';
      } else if (url.includes('vimeo.com/')) {
        const parts = url.split('vimeo.com/')[1]?.split('?')[0]?.split('/') || [];
        videoId = parts.find((part) => /^\d+$/.test(part)) || '';
      }

      if (videoId && /^\d+$/.test(videoId)) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
  }

  return null;
};

// Node מותאם אישית להטמעת וידאו
const VideoEmbed = Node.create({
  name: 'videoEmbed',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => {
          const iframe = element.querySelector('iframe');
          return iframe ? iframe.getAttribute('src') : null;
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[class="video-embed"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const iframe = element.querySelector('iframe');
          return iframe ? { src: iframe.getAttribute('src') } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src;
    if (!src) return ['div'];

    return [
      'div',
      {
        class: 'video-embed',
        style:
          'position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1rem 0;',
      },
      [
        'iframe',
        {
          src: src,
          frameborder: '0',
          allow:
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          style:
            'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVideo:
        (url: string, type: 'youtube' | 'vimeo' = 'youtube') =>
        ({ commands }: any) => {
          let embedUrl: string | null = null;
          if (
            url.includes('youtube.com/embed/') ||
            url.includes('player.vimeo.com/video/')
          ) {
            embedUrl = url.split('?')[0];
          } else {
            embedUrl = getEmbedUrl(url, type);
          }

          if (!embedUrl) {
            console.error('Failed to get embed URL for:', url, 'type:', type);
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: {
              src: embedUrl,
            },
          });
        },
    };
  },
});

// פונקציה שיוצרת את רשימת ההרחבות המשותפת
const buildExtensions = (lowlightInstance: any) => [
  StarterKit.configure({
    codeBlock: false,
    heading: {
      levels: [1, 2, 3],
    },
  }),
  CodeBlockLowlight.configure({
    lowlight: lowlightInstance,
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Color,
  TextStyle,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-gold hover:underline',
    },
  }),
  Underline,
  Highlight.configure({
    multicolor: true,
  }),
  TextDirection,
  VideoEmbed,
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'הזן תיאור...',
}: RichTextEditorProps) {
  const lowlightInstance = createLowlight(common);
  const textColorInputRef = useRef<HTMLInputElement>(null);
  const backgroundColorInputRef = useRef<HTMLInputElement>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFF00');
  const [, forceUpdate] = useState({});
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<'youtube' | 'vimeo'>('youtube');
  const [headingDialogOpen, setHeadingDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: buildExtensions(lowlightInstance),
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => {
      forceUpdate({});
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-3',
        dir: 'rtl',
        style: 'text-align: right;',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      const currentTextColor = editor.getAttributes('textStyle').color;
      if (currentTextColor) {
        setTextColor(currentTextColor);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[150px] border border-border rounded-lg p-4 flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gold"></div>
        <span className="text-sm text-muted-foreground">טוען עורך טקסט...</span>
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('הזן URL:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      title={title}
      className={active ? 'bg-gold text-white hover:bg-gold/90' : ''}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden min-h-[200px] bg-background">
      <div className="p-2 border-b border-border flex flex-wrap gap-1" dir="rtl">
        {/* Text formatting */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Code block */}
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().toggleCodeBlock().run();
            const node = editor.state.selection.$from.parent;
            if (node.type.name === 'codeBlock') {
              (editor.chain().focus() as any).setTextDirection('ltr').run();
            }
          }}
          active={editor.isActive('codeBlock')}
          title="בלוק קוד (להדבקת קוד)"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-8 bg-border" />

        {/* Alignment */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Lists */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Colors */}
        <div className="flex gap-1">
          <div className="relative inline-block">
            <input
              ref={textColorInputRef}
              type="color"
              value={textColor}
              onChange={(e) => {
                const color = e.target.value;
                setTextColor(color);
                editor.chain().focus().setColor(color).run();
              }}
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
            />
            <ToolbarButton
              onClick={() => {
                const currentColor =
                  editor.getAttributes('textStyle').color || '#000000';
                setTextColor(currentColor);
                textColorInputRef.current?.click();
              }}
            >
              <Palette className="h-4 w-4" />
            </ToolbarButton>
          </div>
          <div className="relative inline-block">
            <input
              ref={backgroundColorInputRef}
              type="color"
              value={backgroundColor}
              onChange={(e) => {
                const color = e.target.value;
                setBackgroundColor(color);
                editor.chain().focus().toggleHighlight({ color }).run();
              }}
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
            />
            <ToolbarButton
              onClick={() => {
                backgroundColorInputRef.current?.click();
              }}
              active={editor.isActive('highlight')}
            >
              <Highlighter className="h-4 w-4" />
            </ToolbarButton>
          </div>
          <ToolbarButton onClick={setLink} active={editor.isActive('link')}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Video */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setVideoType('youtube');
              setVideoDialogOpen(true);
            }}
            title="הטמע וידאו (YouTube)"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setVideoType('vimeo');
              setVideoDialogOpen(true);
            }}
            title="הטמע וידאו (Vimeo)"
            className="bg-[#1AB7EA] text-white hover:bg-[#0EA5D6]"
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Headings */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHeadingDialogOpen(true)}
          >
            <span className="font-bold">
              H
              {editor.isActive('heading', { level: 1 })
                ? '1'
                : editor.isActive('heading', { level: 2 })
                  ? '2'
                  : editor.isActive('heading', { level: 3 })
                    ? '3'
                    : ''}
            </span>
          </Button>
        </div>
      </div>

      <div className="prose max-w-none">
        <EditorContent editor={editor} data-placeholder={placeholder} />
      </div>

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onClose={() => setVideoDialogOpen(false)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              הטמע וידאו ({videoType === 'youtube' ? 'YouTube' : 'Vimeo'})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">
                URL של וידאו {videoType === 'youtube' ? 'YouTube' : 'Vimeo'} או
                קוד Embed
              </Label>
              <Input
                id="video-url"
                autoFocus
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={
                  videoType === 'youtube'
                    ? 'URL: https://www.youtube.com/watch?v=... או קוד iframe'
                    : 'URL: https://vimeo.com/... או קוד iframe'
                }
              />
              <p className="text-xs text-muted-foreground">
                {videoType === 'youtube'
                  ? 'ניתן להזין URL של YouTube או להדביק קוד iframe שלם'
                  : 'ניתן להזין URL של Vimeo או להדביק קוד iframe שלם'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setVideoDialogOpen(false);
                setVideoUrl('');
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={() => {
                if (videoUrl && editor) {
                  const embedUrl = getEmbedUrl(videoUrl, videoType);
                  const isValid =
                    videoType === 'youtube'
                      ? embedUrl && embedUrl.includes('youtube.com/embed/')
                      : embedUrl && embedUrl.includes('player.vimeo.com/video/');

                  if (isValid && embedUrl) {
                    try {
                      (editor.chain().focus() as any).setVideo(embedUrl, videoType).run();
                      setVideoDialogOpen(false);
                      setVideoUrl('');
                    } catch (error) {
                      console.error('Error adding video:', error);
                      alert('שגיאה בהוספת הוידאו. אנא נסה שוב.');
                    }
                  } else {
                    alert(
                      `URL לא תקין. אנא הזן URL של ${videoType === 'youtube' ? 'YouTube' : 'Vimeo'} או קוד iframe מלא`
                    );
                  }
                }
              }}
              disabled={!videoUrl}
            >
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Heading Dialog */}
      <Dialog
        open={headingDialogOpen}
        onOpenChange={(open) => setHeadingDialogOpen(open)}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>בחר רמת כותרת</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Button
              variant="outline"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                setHeadingDialogOpen(false);
              }}
              className="justify-start text-2xl font-bold"
            >
              <Heading1 className="ml-2" />
              כותרת 1
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                setHeadingDialogOpen(false);
              }}
              className="justify-start text-xl font-bold"
            >
              <Heading2 className="ml-2" />
              כותרת 2
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
                setHeadingDialogOpen(false);
              }}
              className="justify-start text-lg font-bold"
            >
              <Heading3 className="ml-2" />
              כותרת 3
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// רכיב לקריאה בלבד
export function ReadOnlyRichText({
  value,
  placeholder = 'תיאור...',
}: ReadOnlyRichTextProps) {
  const lowlightInstance = createLowlight(common);

  const editor = useEditor({
    extensions: buildExtensions(lowlightInstance),
    content: value,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none',
        dir: 'rtl',
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden min-h-[150px]">
      <EditorContent editor={editor} />
    </div>
  );
}
