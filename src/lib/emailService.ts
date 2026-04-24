import { getAppSetting } from './appSettings'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
      body: JSON.stringify({ to, subject, html }),
    })
    return await res.json()
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

function replaceVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

export async function sendTemplatedEmail(
  templateKey: string,
  to: string,
  defaultSubject: string,
  variables: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  const customSubject = await getAppSetting(`email_subject_${templateKey}`)
  const customHtml = await getAppSetting(`email_template_${templateKey}`)

  const subject = replaceVars(customSubject || defaultSubject, variables)
  const html = replaceVars(customHtml || DEFAULT_TEMPLATES[templateKey] || '', variables)

  return sendEmail(to, subject, html)
}

// ── Templates default ──────────────────────────────────────

const WRAPPER_START = `<html><body style="font-family:Inter,sans-serif;background:#f8fafc;padding:40px;margin:0"><div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,.08)">`
const WRAPPER_END = `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"><p style="color:#94a3b8;font-size:11px;text-align:center">brasileirosnouruguai.com.br</p></div></body></html>`
const HEADER = `<h1 style="color:#003399;font-size:22px;margin:0 0 4px">O que Fazer no Uruguai?</h1><p style="color:#64748b;font-size:12px;margin:0 0 24px">por Brasileiros no Uruguai</p>`

const DEFAULT_TEMPLATES: Record<string, string> = {
  welcome: `${WRAPPER_START}${HEADER}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="color:#166534;font-weight:bold;margin:0">Bem-vindo(a), {{nome}}!</p>
    </div>
    <p style="color:#334155;font-size:14px;line-height:1.6">Sua conta foi criada com sucesso no app <strong>O que Fazer no Uruguai?</strong></p>
    <p style="color:#334155;font-size:14px;line-height:1.6">Explore restaurantes, passeios e aproveite descontos exclusivos para a comunidade brasileira no Uruguai.</p>
    <p style="color:#64748b;font-size:13px;margin-top:20px">Seu email de acesso: <strong>{{email}}</strong></p>
  ${WRAPPER_END}`,

  expiration: `${WRAPPER_START}${HEADER}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="color:#991b1b;font-weight:bold;margin:0">Seu periodo de utilizacao expirou</p>
    </div>
    <p style="color:#334155;font-size:14px;line-height:1.6">Ola, <strong>{{nome}}</strong>!</p>
    <p style="color:#334155;font-size:14px;line-height:1.6">Seu periodo de 20 dias de acesso ao app expirou em <strong>{{data_expiracao}}</strong>.</p>
    <p style="color:#334155;font-size:14px;line-height:1.6">Entre em contato conosco para renovar seu acesso e continuar aproveitando os descontos exclusivos.</p>
  ${WRAPPER_END}`,

  contact: `${WRAPPER_START}${HEADER}
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="color:#1e40af;font-weight:bold;margin:0">Nova mensagem de parceiro</p>
    </div>
    <table style="font-size:14px;color:#334155;width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;font-weight:bold;width:100px">Empresa:</td><td>{{empresa}}</td></tr>
      <tr><td style="padding:6px 0;font-weight:bold">Responsavel:</td><td>{{nome}}</td></tr>
      <tr><td style="padding:6px 0;font-weight:bold">Email:</td><td>{{email}}</td></tr>
      <tr><td style="padding:6px 0;font-weight:bold">Assunto:</td><td>{{assunto}}</td></tr>
    </table>
    <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-top:16px">
      <p style="color:#334155;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap">{{mensagem}}</p>
    </div>
  ${WRAPPER_END}`,

  deletion: `${WRAPPER_START}${HEADER}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:20px">
      <p style="color:#991b1b;font-weight:bold;margin:0">Solicitacao de exclusao de conta</p>
    </div>
    <p style="color:#334155;font-size:14px;line-height:1.6">Uma empresa solicitou a exclusao da conta:</p>
    <table style="font-size:14px;color:#334155;width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;font-weight:bold;width:100px">Empresa:</td><td>{{empresa}}</td></tr>
      <tr><td style="padding:6px 0;font-weight:bold">Responsavel:</td><td>{{nome}}</td></tr>
      <tr><td style="padding:6px 0;font-weight:bold">Email:</td><td>{{email}}</td></tr>
    </table>
    <p style="color:#334155;font-size:14px;line-height:1.6;margin-top:16px">Acesse o painel admin para processar esta solicitacao.</p>
  ${WRAPPER_END}`,
}
