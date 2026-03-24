import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Colaborador {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export function useColaboradores(enabled = true) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const fetchColaboradores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_type', 'colaborador');

      if (!error && data) {
        setColaboradores(data);
      }
      setLoading(false);
    };

    fetchColaboradores();
  }, [enabled]);

  return { colaboradores, loading };
}
