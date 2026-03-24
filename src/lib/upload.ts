import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  publicUrl: string;
  fileName: string;
}

export async function uploadFileToStorage(
  file: File,
  bucket: string,
  folder?: string,
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { publicUrl, fileName };
}
