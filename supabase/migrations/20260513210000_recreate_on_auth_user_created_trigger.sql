-- Recria o trigger on_auth_user_created que estava ausente no projeto novo
-- Sem ele, novos usuarios em auth.users nao tinham profile criado (orphans)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: cria profile pra todos os auth.users orfaos (sem profile correspondente)
-- Usa user_type do raw_user_meta_data se existir; senao 'colaborador' (default historico)
INSERT INTO public.profiles (user_id, email, full_name, user_type, is_approved)
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'full_name',
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'user_type', '')::public.user_type,
    'colaborador'::public.user_type
  ),
  true
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- Garante user_roles pros orfaos tambem (com role default 'user')
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;
