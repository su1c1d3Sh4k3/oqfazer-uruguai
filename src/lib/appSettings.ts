import { supabase } from './supabase'

const DEFAULTS: Record<string, string> = {
  whatsapp_support: '5547999999999',
}

// In-memory cache to avoid repeated fetches
const cache: Record<string, string> = {}

/**
 * Reads a setting from Supabase app_settings table.
 * Falls back to default if table doesn't exist or key not found.
 */
export async function getAppSetting(key: string): Promise<string> {
  if (cache[key]) return cache[key]

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (!error && data?.value) {
      cache[key] = data.value
      return data.value
    }
  } catch {
    // Table might not exist yet — use default
  }

  return DEFAULTS[key] || ''
}

/**
 * Saves a setting to Supabase app_settings table.
 */
export async function setAppSetting(key: string, value: string): Promise<boolean> {
  cache[key] = value

  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    return !error
  } catch {
    return false
  }
}
