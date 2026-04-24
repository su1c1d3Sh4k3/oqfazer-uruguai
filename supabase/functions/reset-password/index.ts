import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const VPS_API = "http://2.24.208.139:3001/send-email";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email obrigatorio" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Use the provided redirectTo or default to production reset-password page
    const finalRedirect = redirectTo || "https://oquefazernouruguai.com.br/reset-password";

    // Generate password reset link via admin API
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: finalRedirect,
      },
    });

    if (error || !data?.properties?.action_link) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error?.message || "Erro ao gerar link de recuperacao",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const resetLink = data.properties.action_link;

    const html = `<html><body style="font-family:Inter,sans-serif;background:#f8fafc;padding:40px;margin:0">
      <div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
        <h1 style="color:#003399;font-size:22px;margin:0 0 4px">O que Fazer no Uruguai?</h1>
        <p style="color:#64748b;font-size:12px;margin:0 0 24px">por Brasileiros no Uruguai</p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:20px">
          <p style="color:#1e40af;font-weight:bold;margin:0">Recuperacao de Senha</p>
        </div>
        <p style="color:#334155;font-size:14px;line-height:1.6">Voce solicitou a redefinicao da sua senha. Clique no botao abaixo para criar uma nova senha:</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${resetLink}" style="display:inline-block;background:#003399;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Redefinir Minha Senha</a>
        </div>
        <p style="color:#64748b;font-size:12px;line-height:1.5">Se voce nao solicitou esta alteracao, ignore este email. O link expira em 24 horas.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
        <p style="color:#94a3b8;font-size:11px;text-align:center">brasileirosnouruguai.com.br</p>
      </div>
    </body></html>`;

    // Send via our SMTP relay on VPS
    const emailRes = await fetch(VPS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Redefinicao de Senha - O que Fazer no Uruguai?",
        html,
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResult.error || "Falha ao enviar email",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email de recuperacao enviado" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
