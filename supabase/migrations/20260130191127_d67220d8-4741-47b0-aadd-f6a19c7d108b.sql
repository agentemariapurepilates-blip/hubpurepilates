-- 1. Criar tabela de avisos
CREATE TABLE public.avisos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  image_url text,
  partner_name text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso para avisos
CREATE POLICY "Avisos viewable by authenticated"
  ON public.avisos FOR SELECT USING (true);

CREATE POLICY "Colaboradores can create avisos"
  ON public.avisos FOR INSERT WITH CHECK (is_colaborador(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Creator or admin can update avisos"
  ON public.avisos FOR UPDATE USING (
    auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Creator or admin can delete avisos"
  ON public.avisos FOR DELETE USING (
    auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 4. Trigger para atualizar updated_at
CREATE TRIGGER update_avisos_updated_at
  BEFORE UPDATE ON public.avisos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Atualizar política de demandas para permitir colaboradores atualizarem
DROP POLICY IF EXISTS "Creator or admin can update demands" ON public.demands;
CREATE POLICY "Colaboradores can update demands"
  ON public.demands FOR UPDATE USING (is_colaborador(auth.uid()));