import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import DemandRichTextEditor from '../DemandRichTextEditor';
import { linkifyHtml } from './linkifyHtml';

interface CommentAttachment {
  file_url: string;
  file_name: string;
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  attachments?: CommentAttachment[];
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  isAdmin: boolean;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentItem({ comment, currentUserId, isAdmin, onEdit, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const startEditing = () => {
    setEditing(true);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditContent('');
  };

  const saveEdit = async () => {
    const textContent = editContent.replace(/<[^>]*>/g, '').trim();
    if (!textContent) return;
    await onEdit(comment.id, editContent);
    setEditing(false);
    setEditContent('');
  };

  const isOwner = comment.user_id === currentUserId;

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.profile?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">
          {comment.profile?.full_name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.profile?.full_name || 'Usuário'}
          </span>
          <span className="text-xs text-muted-foreground">
            há {formatDistanceToNowStrict(new Date(comment.created_at), { locale: ptBR })}
          </span>
          {isOwner && (
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={startEditing}>
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {(isOwner || isAdmin) && (
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => onDelete(comment.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {editing ? (
          <div className="mt-1 space-y-2">
            <DemandRichTextEditor
              content={editContent}
              onChange={setEditContent}
              placeholder="Editar comentário..."
              minHeight="60px"
              compact
            />
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={saveEdit}>
                <Check className="h-3 w-3" /> Salvar
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={cancelEditing}>
                <X className="h-3 w-3" /> Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer"
            dangerouslySetInnerHTML={{ __html: linkifyHtml(comment.content) }}
          />
        )}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {comment.attachments.map((att, i) => (
              <a key={i} href={att.file_url} target="_blank" rel="noopener noreferrer">
                <img src={att.file_url} alt={att.file_name} className="max-h-32 rounded-lg cursor-pointer" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
