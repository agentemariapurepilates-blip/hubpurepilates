-- Create table for artes prontas
CREATE TABLE public.artes_prontas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  canva_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artes_prontas ENABLE ROW LEVEL SECURITY;

-- Everyone can view artes prontas
CREATE POLICY "Artes prontas are viewable by authenticated users"
  ON public.artes_prontas
  FOR SELECT
  USING (true);

-- Only admins can insert
CREATE POLICY "Only admins can insert artes prontas"
  ON public.artes_prontas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Only admins can update artes prontas"
  ON public.artes_prontas
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Only admins can delete artes prontas"
  ON public.artes_prontas
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_artes_prontas_updated_at
  BEFORE UPDATE ON public.artes_prontas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for artes prontas images
INSERT INTO storage.buckets (id, name, public)
VALUES ('artes-prontas', 'artes-prontas', true);

-- Storage policies for artes prontas bucket
CREATE POLICY "Artes prontas images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'artes-prontas');

CREATE POLICY "Admins can upload artes prontas images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'artes-prontas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update artes prontas images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'artes-prontas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete artes prontas images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'artes-prontas' AND has_role(auth.uid(), 'admin'::app_role));

-- Insert default data
INSERT INTO public.artes_prontas (title, image_url, canva_url, display_order) VALUES
('Datas Importantes', '/src/assets/artes/datas-importantes.png', 'https://www.canva.com/design/DAG5EsPKROU/lhPPGffKR4f9OhpVSxJsCA/view?utm_content=DAG5EsPKROU&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview', 1),
('Feriados', '/src/assets/artes/feriados.png', 'https://www.canva.com/design/DAG5FW1GAKs/HCgNP1YfYU93JyPcUQk6Wg/view?utm_content=DAG5FW1GAKs&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview', 2),
('A5 para Informativos', '/src/assets/artes/a5-informativos.png', 'https://www.canva.com/design/DAGT7S7HNyQ/4ahehqleIfxkq9NnNVVSNQ/view?utm_content=DAGT7S7HNyQ&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview', 3),
('Feriado Cidades', '/src/assets/artes/aniversario-cidades.png', 'https://www.canva.com/design/DAG5GKH5oOs/aophxGttJFdqVpN1fCAxBw/view?utm_content=DAG5GKH5oOs&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview', 4),
('Aniversário Cidades', '/src/assets/artes/aniversario-cidades.png', 'https://www.canva.com/design/DAG5GKH5oOs/aophxGttJFdqVpN1fCAxBw/view?utm_content=DAG5GKH5oOs&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview', 5),
('Postagens Descontraídas', '/src/assets/artes/postagens-descontraidas.png', 'https://www.canva.com/design/DAGqoCWlk3o/GSi7MmjaQXF3kKeVAr86pA/edit', 6),
('Nosso Endereço', '/src/assets/artes/nosso-endereco.png', 'https://www.canva.com/design/DAGqt7UPcFg/OVnTPMFPUhPvQdd95GztaQ/view?utm_content=DAGqt7UPcFg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h422cd60ee5', 7),
('Depoimentos de Clientes', '/src/assets/artes/depoimentos-clientes.png', 'https://www.canva.com/design/DAGqt1TQ59g/jnsKIaAtCITKH6nyg2Wz5g/edit', 8),
('Anúncio de Vaga para Instrutores', '/src/assets/artes/anuncio-vagas.png', 'https://www.canva.com/design/DAGT7XJqLGo/ZfoClOHcuGxafoOmC-WjXQ/edit', 9);