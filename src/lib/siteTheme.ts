export type SiteTheme = 'raios' | 'ninja'

export const SITE_THEME_CHANGE_EVENT = 'site_theme_change'

export function isSiteTheme(value: unknown): value is SiteTheme {
  return value === 'raios' || value === 'ninja'
}

/** Legacy or malformed site themes fall back to the standard theme. */
export function normalizeSiteTheme(value: unknown): SiteTheme {
  return value === 'ninja' ? 'ninja' : 'raios'
}

/** Reads both JSONB objects and JSON strings used by older config rows. */
export function readStoredSiteTheme(value: unknown): SiteTheme {
  let config = value
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config) as unknown
    } catch {
      return 'raios'
    }
  }

  if (!config || typeof config !== 'object') return 'raios'
  return normalizeSiteTheme((config as { tema_ativo?: unknown }).tema_ativo)
}
