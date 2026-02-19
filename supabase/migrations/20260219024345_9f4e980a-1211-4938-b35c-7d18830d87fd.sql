
-- Create parcerias table
CREATE TABLE public.parcerias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  image_url text,
  partner_url text,
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parcerias ENABLE ROW LEVEL SECURITY;

-- Viewable by all authenticated users
CREATE POLICY "Parcerias viewable by authenticated"
ON public.parcerias
FOR SELECT
USING (true);

-- Only colaboradores can insert
CREATE POLICY "Colaboradores can create parcerias"
ON public.parcerias
FOR INSERT
WITH CHECK (is_colaborador(auth.uid()) AND auth.uid() = created_by);

-- Creator or admin can update
CREATE POLICY "Creator or admin can update parcerias"
ON public.parcerias
FOR UPDATE
USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));

-- Creator or admin can delete
CREATE POLICY "Creator or admin can delete parcerias"
ON public.parcerias
FOR DELETE
USING ((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_parcerias_updated_at
BEFORE UPDATE ON public.parcerias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
