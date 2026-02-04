-- Create table for password reset requests
CREATE TABLE public.password_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can insert their own request
CREATE POLICY "Users can create their own password reset request"
ON public.password_reset_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.password_reset_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update requests (mark as resolved)
CREATE POLICY "Admins can update password reset requests"
ON public.password_reset_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Allow unauthenticated users to insert (for forgot password flow)
CREATE POLICY "Allow password reset request without auth"
ON public.password_reset_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests(status);
CREATE INDEX idx_password_reset_requests_created_at ON public.password_reset_requests(created_at DESC);