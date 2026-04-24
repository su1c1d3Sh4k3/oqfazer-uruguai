import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SMTP_HOST = "smtp-relay.gmail.com";
const SMTP_PORT = 587;
const SMTP_USER = "contato@brasileirosnouruguai.com.br";
const SMTP_PASS = "Brasileiros3004G*";

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
    const { to, subject, html } = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Campos 'to' e 'subject' sao obrigatorios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: false,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    });

    await client.send({
      from: `Brasileiros no Uruguai <${SMTP_USER}>`,
      to,
      subject,
      content: "auto",
      html:
        html ||
        `<html><body style="font-family:Inter,sans-serif;background:#f8fafc;padding:40px">
        <div style="max-width:500px;margin:0 auto;background:white;border-radius:16px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          <h1 style="color:#003399;font-size:22px;margin-bottom:8px">O que Fazer no Uruguai?</h1>
          <p style="color:#64748b;font-size:13px;margin-bottom:24px">Teste de SMTP Relay</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px">
            <p style="color:#166534;font-weight:bold;margin:0">SMTP funcionando corretamente!</p>
          </div>
          <table style="font-size:13px;color:#334155;width:100%">
            <tr><td style="padding:4px 0"><strong>Host:</strong></td><td>${SMTP_HOST}</td></tr>
            <tr><td style="padding:4px 0"><strong>Porta:</strong></td><td>${SMTP_PORT}</td></tr>
            <tr><td style="padding:4px 0"><strong>Remetente:</strong></td><td>${SMTP_USER}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
          <p style="color:#94a3b8;font-size:11px;text-align:center">brasileirosnouruguai.com.br</p>
        </div>
      </body></html>`,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: `Email enviado para ${to}` }),
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
