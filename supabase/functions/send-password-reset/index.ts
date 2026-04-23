import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!
    const resendFrom = Deno.env.get('RESEND_FROM') ?? 'Pure Pilates <onboarding@resend.dev>'

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Only admins can send password reset emails' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email } = await req.json()
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const origin = req.headers.get('origin') || 'https://hub.purepilates.com.br'

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${origin}/auth?type=recovery` },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Error generating recovery link:', linkError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate recovery link', details: linkError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const actionLink = linkData.properties.action_link

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Redefinir senha — Pure Pilates</title></head>
<body style="margin:0; padding:0; background:#f4f4f5; font-family:Arial, sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5; padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#c41230; padding:24px; text-align:center;">
<h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:700;">Pure Pilates</h1>
</td></tr>
<tr><td style="padding:32px 32px 24px;">
<h2 style="color:#1a1a1a; font-size:20px; margin:0 0 16px;">Redefinição de senha</h2>
<p style="color:#444; font-size:15px; line-height:1.5; margin:0 0 24px;">
Olá! Recebemos uma solicitação para redefinir sua senha do Hub Pure Pilates. Clique no botão abaixo para criar uma nova senha:
</p>
<p style="text-align:center; margin:32px 0;">
<a href="${actionLink}" style="display:inline-block; background:#c41230; color:#ffffff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px;">Redefinir minha senha</a>
</p>
<p style="color:#666; font-size:13px; line-height:1.5; margin:24px 0 0;">
Se o botão não funcionar, copie e cole este link no navegador:<br>
<a href="${actionLink}" style="color:#c41230; word-break:break-all;">${actionLink}</a>
</p>
<p style="color:#999; font-size:12px; line-height:1.5; margin:24px 0 0;">
Se você não solicitou essa redefinição, pode ignorar este e-mail. O link expira em 1 hora.
</p>
</td></tr>
<tr><td style="background:#fafafa; padding:16px; text-align:center; color:#999; font-size:12px;">
Pure Pilates · Hub interno
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: 'Redefinição de senha — Hub Pure Pilates',
        html,
      }),
    })

    if (!resendResp.ok) {
      const errBody = await resendResp.text()
      console.error('Resend error:', resendResp.status, errBody)
      return new Response(
        JSON.stringify({ error: 'Failed to send email via Resend', details: errBody }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
