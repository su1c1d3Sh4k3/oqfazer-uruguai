import { supabase } from './supabase'

// Chamadas à Edge Function `accounts` — o cadastro público do Supabase Auth está
// desligado, então toda conta nova (convite, solicitação, admin) nasce lá.

export type InviteRole = 'user' | 'establishment' | 'agency'

export const INVITE_ROLE_LABELS: Record<InviteRole, string> = {
  user: 'Usuário',
  establishment: 'Empresa / Estabelecimento',
  agency: 'Agência',
}

/** Validade do convite (default de invites.expires_at no banco) */
export const INVITE_VALID_DAYS = 7

export interface AccountsResult {
  success: boolean
  error?: string
  [key: string]: any
}

export async function callAccounts(
  action: string,
  payload: Record<string, unknown> = {},
  asAdmin = false,
): Promise<AccountsResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    }
    if (asAdmin) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) headers.Authorization = `Bearer ${session.access_token}`
    }
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, ...payload }),
    })
    return await res.json()
  } catch {
    return { success: false, error: 'Falha de conexão. Tente novamente.' }
  }
}

export const inviteLink = (token: string) => `${window.location.origin}/convite/${token}`
