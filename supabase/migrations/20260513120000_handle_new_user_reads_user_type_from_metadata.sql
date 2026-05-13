-- handle_new_user agora lê user_type de raw_user_meta_data
-- Permite criar usuários pelo painel do Supabase (Auto Confirm User) já com user_type definido
-- Default = 'franqueado' quando user_type não vem no metadata ou é inválido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta_user_type public.user_type;
BEGIN
  BEGIN
    meta_user_type := (new.raw_user_meta_data ->> 'user_type')::public.user_type;
  EXCEPTION WHEN invalid_text_representation THEN
    meta_user_type := NULL;
  END;

  INSERT INTO public.profiles (user_id, email, full_name, user_type, is_approved)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(meta_user_type, 'franqueado'::public.user_type),
    true
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$function$;
