-- Create marketing_events table
CREATE TABLE public.marketing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Marketing events are viewable by authenticated users" 
ON public.marketing_events 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create marketing events" 
ON public.marketing_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketing events" 
ON public.marketing_events 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own marketing events" 
ON public.marketing_events 
FOR DELETE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marketing_events_updated_at
BEFORE UPDATE ON public.marketing_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_events;
ALTER TABLE public.marketing_events REPLICA IDENTITY FULL;

-- Insert example event
INSERT INTO public.marketing_events (title, description, start_date, end_date, user_id)
VALUES (
  '50% OFF para planos anuais',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  '2026-01-10',
  '2026-01-31',
  '00000000-0000-0000-0000-000000000000'
);