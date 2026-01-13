
-- Create enum for demand status
CREATE TYPE public.demand_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create enum for demand priority
CREATE TYPE public.demand_priority AS ENUM ('low', 'medium', 'high');

-- Create demands table
CREATE TABLE public.demands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  from_department TEXT NOT NULL,
  to_department TEXT NOT NULL,
  status demand_status NOT NULL DEFAULT 'pending',
  priority demand_priority NOT NULL DEFAULT 'medium',
  deadline DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create demand assignees table
CREATE TABLE public.demand_assignees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(demand_id, user_id)
);

-- Create demand comments table
CREATE TABLE public.demand_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create demand notifications table
CREATE TABLE public.demand_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'mention' or 'assignment'
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create demand attachments table
CREATE TABLE public.demand_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID REFERENCES public.demands(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.demand_comments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_attachments ENABLE ROW LEVEL SECURITY;

-- Function to check if user is colaborador
CREATE OR REPLACE FUNCTION public.is_colaborador(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND user_type = 'colaborador'
  )
$$;

-- RLS Policies for demands
CREATE POLICY "Colaboradores can view demands"
ON public.demands FOR SELECT
USING (public.is_colaborador(auth.uid()));

CREATE POLICY "Colaboradores can create demands"
ON public.demands FOR INSERT
WITH CHECK (public.is_colaborador(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Creator or admin can update demands"
ON public.demands FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creator or admin can delete demands"
ON public.demands FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for demand_assignees
CREATE POLICY "Colaboradores can view assignees"
ON public.demand_assignees FOR SELECT
USING (public.is_colaborador(auth.uid()));

CREATE POLICY "Colaboradores can add assignees"
ON public.demand_assignees FOR INSERT
WITH CHECK (public.is_colaborador(auth.uid()));

CREATE POLICY "Creator or admin can delete assignees"
ON public.demand_assignees FOR DELETE
USING (public.is_colaborador(auth.uid()));

-- RLS Policies for demand_comments
CREATE POLICY "Colaboradores can view comments"
ON public.demand_comments FOR SELECT
USING (public.is_colaborador(auth.uid()));

CREATE POLICY "Colaboradores can add comments"
ON public.demand_comments FOR INSERT
WITH CHECK (public.is_colaborador(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.demand_comments FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for demand_notifications
CREATE POLICY "Users can view their own notifications"
ON public.demand_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Colaboradores can create notifications"
ON public.demand_notifications FOR INSERT
WITH CHECK (public.is_colaborador(auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON public.demand_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for demand_attachments
CREATE POLICY "Colaboradores can view attachments"
ON public.demand_attachments FOR SELECT
USING (public.is_colaborador(auth.uid()));

CREATE POLICY "Colaboradores can upload attachments"
ON public.demand_attachments FOR INSERT
WITH CHECK (public.is_colaborador(auth.uid()) AND auth.uid() = uploaded_by);

CREATE POLICY "Uploader or admin can delete attachments"
ON public.demand_attachments FOR DELETE
USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for demand attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('demand-attachments', 'demand-attachments', true);

-- Storage policies
CREATE POLICY "Colaboradores can view demand attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'demand-attachments' AND public.is_colaborador(auth.uid()));

CREATE POLICY "Colaboradores can upload demand attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'demand-attachments' AND public.is_colaborador(auth.uid()));

CREATE POLICY "Colaboradores can delete their attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'demand-attachments' AND public.is_colaborador(auth.uid()));

-- Enable realtime for demands and comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.demands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demand_notifications;

-- Trigger for updated_at
CREATE TRIGGER update_demands_updated_at
BEFORE UPDATE ON public.demands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
