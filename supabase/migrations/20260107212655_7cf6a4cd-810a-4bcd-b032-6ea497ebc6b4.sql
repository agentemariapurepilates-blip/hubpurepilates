-- Create event_tag enum
CREATE TYPE event_tag AS ENUM ('pacotes', 'pure_pass', 'pure_club');

-- Add tag column to marketing_events
ALTER TABLE public.marketing_events 
ADD COLUMN tag event_tag DEFAULT NULL;