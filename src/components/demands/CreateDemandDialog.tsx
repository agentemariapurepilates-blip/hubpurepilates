import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DemandRichTextEditor from './DemandRichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Image, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@/integrations/supabase/client';
import { uploadFileToStorage } from '@/lib/upload';
import { toast } from '@/hooks/use-toast';

interface CreateDemandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

import { Colaborador } from '@/hooks/useColaboradores';
import { demandSectors as sectors } from '@/data/sectors';

const CreateDemandDialog = ({ open, onOpenChange, onSuccess }: CreateDemandDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fromDepartment, setFromDepartment] = useState('');
  const [toDepartment, setToDepartment] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [selectedAssignees, setSelectedAssignees] = useState<Colaborador[]>([]);

  // Fetch colaboradores
  useEffect(() => {
    const fetchColaboradores = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_type', 'colaborador');

      if (!error && data) {
        setColaboradores(data);
      }
    };

    if (open) {
      fetchColaboradores();
    }
  }, [open]);

  // Handle paste for images
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadImage(file);
        }
        break;
      }
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && open) {
      textarea.addEventListener('paste', handlePaste);
      return () => textarea.removeEventListener('paste', handlePaste);
    }
  }, [open, handlePaste]);

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const { publicUrl } = await uploadFileToStorage(file, 'demand-attachments', 'demands');
      setAttachments(prev => [...prev, { url: publicUrl, name: file.name }]);
      toast({
        title: "Imagem anexada",
        description: "A imagem foi anexada com sucesso."
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload da imagem",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments(prev => prev.filter(a => a.url !== url));
  };

  const toggleAssignee = (colaborador: Colaborador) => {
    setSelectedAssignees(prev => {
      const exists = prev.find(a => a.user_id === colaborador.user_id);
      if (exists) {
        return prev.filter(a => a.user_id !== colaborador.user_id);
      }
      return [...prev, colaborador];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !fromDepartment || !toDepartment) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e os setores",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create demand
      const { data: demand, error: demandError } = await supabase
        .from('demands')
        .insert({
          title,
          description,
          from_department: fromDepartment,
          to_department: toDepartment,
          priority,
          deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (demandError) throw demandError;

      // Add assignees
      if (selectedAssignees.length > 0) {
        const assigneesData = selectedAssignees.map(a => ({
          demand_id: demand.id,
          user_id: a.user_id,
        }));

        const { error: assigneesError } = await supabase
          .from('demand_assignees')
          .insert(assigneesData);

        if (assigneesError) throw assigneesError;

        // Create notifications for assignees
        const notificationsData = selectedAssignees.map(a => ({
          user_id: a.user_id,
          demand_id: demand.id,
          notification_type: 'assignment',
          message: `Você foi atribuído(a) à demanda: ${title}`,
          created_by: user?.id,
        }));

        await supabase.from('demand_notifications').insert(notificationsData);
      }

      // Add attachments
      if (attachments.length > 0) {
        const attachmentsData = attachments.map(a => ({
          demand_id: demand.id,
          file_url: a.url,
          file_name: a.name,
          uploaded_by: user?.id,
        }));

        await supabase.from('demand_attachments').insert(attachmentsData);
      }

      toast({
        title: "Demanda criada",
        description: "A demanda foi criada com sucesso."
      });

      // Reset form
      setTitle('');
      setDescription('');
      setFromDepartment('');
      setToDepartment('');
      setPriority('medium');
      setDeadline(undefined);
      setSelectedAssignees([]);
      setAttachments([]);
      
      onSuccess();
    } catch (error) {
      console.error('Error creating demand:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar demanda",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title / Briefing */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descreva brevemente a demanda..."
              required
            />
          </div>

          {/* Description with rich text editor */}
          <div className="space-y-2">
            <Label>Descrição Detalhada</Label>
            <DemandRichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Descreva a demanda em detalhes... Use @ para mencionar alguém"
              minHeight="100px"
            />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Anexos</Label>
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.url)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Setores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>De (Setor) *</Label>
              <Select value={fromDepartment} onValueChange={setFromDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Para (Setor) *</Label>
              <Select value={toDepartment} onValueChange={setToDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedAssignees.map((assignee) => (
                <Badge key={assignee.user_id} variant="secondary" className="gap-1 pr-1">
                  {assignee.full_name || 'Usuário'}
                  <button
                    type="button"
                    onClick={() => toggleAssignee(assignee)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="border rounded-lg max-h-32 overflow-y-auto">
              {colaboradores.map((colaborador) => (
                <div
                  key={colaborador.user_id}
                  className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-muted transition-colors ${
                    selectedAssignees.find(a => a.user_id === colaborador.user_id) ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => toggleAssignee(colaborador)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={colaborador.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {colaborador.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{colaborador.full_name || 'Usuário'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Criar Demanda'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDemandDialog;
