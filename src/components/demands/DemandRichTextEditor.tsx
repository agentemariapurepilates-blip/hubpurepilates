import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
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
  Smile,
  Loader2,
  List,
  ListOrdered,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { Instance } from 'tippy.js';

interface Colaborador {
  user_id: string;
  full_name: string | null;
}

interface DemandRichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  compact?: boolean;
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
      "h-7 w-7 p-0",
      isActive && "bg-muted text-primary"
    )}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    {icon}
  </Button>
);

// Mention suggestion list component
interface MentionListProps {
  items: Colaborador[];
  command: (item: { id: string; label: string }) => void;
  selectedIndex: number;
}

const MentionList = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, MentionListProps>(
  ({ items, command, selectedIndex }, ref) => {
    const [selected, setSelected] = useState(selectedIndex);

    useEffect(() => {
      setSelected(selectedIndex);
    }, [selectedIndex]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command({ id: item.user_id, label: item.full_name || 'Usuário' });
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelected((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelected((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selected);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm text-muted-foreground">
          Nenhum colaborador encontrado
        </div>
      );
    }

    return (
      <div className="bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.user_id}
            className={cn(
              "flex items-center gap-2 w-full text-left p-2 text-sm hover:bg-muted transition-colors",
              index === selected && "bg-muted"
            )}
            onClick={() => selectItem(index)}
          >
            <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              {item.full_name?.[0]?.toUpperCase() || 'U'}
            </span>
            <span>{item.full_name || 'Usuário'}</span>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = 'MentionList';

// Fetch colaboradores for mention suggestions
let cachedColaboradores: Colaborador[] = [];
let fetchPromise: Promise<Colaborador[]> | null = null;

const fetchColaboradores = async (): Promise<Colaborador[]> => {
  if (cachedColaboradores.length > 0) return cachedColaboradores;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('user_type', 'colaborador');
    cachedColaboradores = data || [];
    fetchPromise = null;
    return cachedColaboradores;
  })();

  return fetchPromise;
};

const mentionSuggestion = {
  items: async ({ query }: { query: string }) => {
    const colaboradores = await fetchColaboradores();
    return colaboradores
      .filter((item) =>
        item.full_name?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);
  },
  render: () => {
    let component: ReactRenderer<any> | null = null;
    let popup: Instance[] | null = null;

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props: { ...props, selectedIndex: 0 },
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },
      onUpdate: (props: SuggestionProps) => {
        component?.updateProps({ ...props, selectedIndex: 0 });

        if (!props.clientRect) return;

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      },
      onKeyDown: (props: SuggestionKeyDownProps) => {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }
        return (component?.ref as any)?.onKeyDown(props) || false;
      },
      onExit: () => {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
};

const DemandRichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = 'Escreva aqui... Use @ para mencionar alguém',
  minHeight = '120px',
  compact = false,
}: DemandRichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        hardBreak: {
          keepMarks: true,
        },
      }),
      Underline,
      Placeholder.configure({ 
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary rounded px-1 py-0.5 font-medium',
        },
        suggestion: mentionSuggestion,
        renderHTML({ options, node }) {
          return [
            'span',
            { ...options.HTMLAttributes, 'data-mention-id': node.attrs.id },
            `@${node.attrs.label ?? node.attrs.id}`,
          ];
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-3`,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL do link:', previousUrl);

    if (url === null) return;

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
      <div className="border rounded-lg p-4 flex items-center justify-center" style={{ minHeight }}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b bg-muted/30 flex-wrap">
        <ToolbarButton
          icon={<Bold className="h-3.5 w-3.5" />}
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito"
        />
        <ToolbarButton
          icon={<Italic className="h-3.5 w-3.5" />}
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico"
        />
        <ToolbarButton
          icon={<UnderlineIcon className="h-3.5 w-3.5" />}
          isActive={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado"
        />
        
        <Separator orientation="vertical" className="h-5 mx-0.5" />

        <ToolbarButton
          icon={<List className="h-3.5 w-3.5" />}
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        />
        <ToolbarButton
          icon={<ListOrdered className="h-3.5 w-3.5" />}
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        />
        
        <Separator orientation="vertical" className="h-5 mx-0.5" />
        
        <ToolbarButton
          icon={<LinkIcon className="h-3.5 w-3.5" />}
          isActive={editor.isActive('link')}
          onClick={setLink}
          title="Inserir link"
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-1.5">
              <Smile className="h-3.5 w-3.5" />
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

        <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
          Use @ para mencionar
        </span>
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default DemandRichTextEditor;
