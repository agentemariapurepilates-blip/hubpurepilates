import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Link as LinkIcon, 
  ImageIcon, 
  Smile,
  Loader2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const emojis = [
  '😀', '😃', '😄', '😁', '😊', '🥰', '😍', '🤩',
  '👍', '👏', '🙌', '💪', '🎉', '🎊', '🏆', '⭐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '🔥', '✨', '💡', '📢', '📌', '✅', '🚀', '💼',
];

const ToolbarButton = ({ 
  icon, 
  isActive, 
  onClick, 
  disabled,
  title 
}: { 
  icon: React.ReactNode; 
  isActive?: boolean; 
  onClick: () => void; 
  disabled?: boolean;
  title?: string;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    className={cn(
      "h-8 w-8 p-0",
      isActive && "bg-muted text-primary"
    )}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    {icon}
  </Button>
);

const RichTextEditor = ({ content, onChange, placeholder = 'Escreva o conteúdo...' }: RichTextEditorProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        hardBreak: {
          keepMarks: true,
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Underline,
      Image.configure({ 
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rich-editor-image',
        },
      }),
      Placeholder.configure({ 
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[250px] p-4',
      },
    },
  });

  const handleImageUpload = useCallback(async () => {
    if (!user) {
      toast.error('Você precisa estar logado para enviar imagens');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      setUploading(true);

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        editor?.chain().focus().setImage({ src: publicUrl }).run();
        toast.success('Imagem adicionada!');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Erro ao fazer upload da imagem');
      } finally {
        setUploading(false);
      }
    };

    input.click();
  }, [editor, user]);

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const insertEmoji = useCallback((emoji: string) => {
    editor?.chain().focus().insertContent(emoji).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 min-h-[280px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        {/* Headings */}
        <ToolbarButton
          icon={<Heading1 className="h-4 w-4" />}
          isActive={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Título 1"
        />
        <ToolbarButton
          icon={<Heading2 className="h-4 w-4" />}
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título 2"
        />
        <ToolbarButton
          icon={<Heading3 className="h-4 w-4" />}
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Título 3"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton
          icon={<Bold className="h-4 w-4" />}
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        />
        <ToolbarButton
          icon={<Italic className="h-4 w-4" />}
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico (Ctrl+I)"
        />
        <ToolbarButton
          icon={<UnderlineIcon className="h-4 w-4" />}
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado (Ctrl+U)"
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <ToolbarButton
          icon={<List className="h-4 w-4" />}
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista com marcadores"
        />
        <ToolbarButton
          icon={<ListOrdered className="h-4 w-4" />}
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        />
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <ToolbarButton
          icon={<LinkIcon className="h-4 w-4" />}
          isActive={editor.isActive('link')}
          onClick={setLink}
          title="Inserir link"
        />
        
        <ToolbarButton
          icon={uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          onClick={handleImageUpload}
          disabled={uploading}
          title="Inserir imagem"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2">
              <Smile className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Emoji</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-8 gap-1">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="p-1.5 text-lg hover:bg-muted rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
