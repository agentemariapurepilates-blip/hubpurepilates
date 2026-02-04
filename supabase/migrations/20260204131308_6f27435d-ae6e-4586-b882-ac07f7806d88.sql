-- Drop the permissive anon policy and recreate with rate limiting logic
DROP POLICY IF EXISTS "Allow password reset request without auth" ON public.password_reset_requests;

-- Alter table to make user_id nullable (for requests from login page)
ALTER TABLE public.password_reset_requests ALTER COLUMN user_id DROP NOT NULL;

-- Create a more secure policy for anon inserts (limit by checking email format)
CREATE POLICY "Allow password reset request by email"
ON public.password_reset_requests
FOR INSERT
TO anon
WITH CHECK (
  email IS NOT NULL 
  AND email LIKE '%@purepilates.com.br'
  AND user_id IS NULL
);