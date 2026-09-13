import { z } from 'zod'
import type { Prisma } from '@/generated/prisma'

/** Zod schema for a localized-text map accepted by preset DTOs (`{ langKey: value }`). Empty values are
 * allowed on the wire; the service strips them with {@link cleanLocalized} before storing. */
export const localizedTextSchema = z.record(z.string(), z.string())

/**
 * A localized-label map: `{ [languageKey]: translation }` (e.g. `{ ar: 'بنك البركة', tr: 'Albaraka' }`).
 * Stored as a `Json` column ALONGSIDE the canonical base field, and holds only the non-base languages —
 * the base column is the single source of truth for the default language, so the two never diverge.
 */
export type LocalizedText = Record<string, string>

/**
 * Resolve a localizable label to `languageKey`, falling back to the canonical `base` when that language
 * has no translation (or the map is empty / not an object). `base` is required — the default-language
 * value — so a preset can never render blank, and the base language simply has no entry in the map.
 *
 * The i18n argument is typed as Prisma's raw `JsonValue` because that is what a `Json` column reads back
 * as; it's narrowed here so callers can pass the column straight through.
 */
export const localized = (
  base: string,
  i18n: Prisma.JsonValue | null | undefined,
  languageKey: string | null | undefined
): string => {
  if (languageKey && i18n && typeof i18n === 'object' && !Array.isArray(i18n)) {
    const value = (i18n as Record<string, unknown>)[languageKey]
    if (typeof value === 'string' && value.trim()) return value
  }
  return base
}

/** Narrow a stored `Json` value to a localized-text map for a response DTO (any non-object → `{}`).
 * The write path guarantees an object, so this is just the type boundary between Prisma's `JsonValue`
 * and the DTO's `Record<string, string>`. */
export const toLocalizedMap = (
  i18n: Prisma.JsonValue | null | undefined
): Record<string, string> =>
  i18n && typeof i18n === 'object' && !Array.isArray(i18n) ? (i18n as Record<string, string>) : {}

/** Sanitise a localized map for storage: drop blank entries, trim values, and never keep the base
 * language key (its value lives in the base column). Returns a plain object safe to write to a `Json`
 * column. */
export const cleanLocalized = (
  i18n: Record<string, string> | null | undefined,
  baseLanguageKey?: string | null
): LocalizedText => {
  const out: LocalizedText = {}
  if (!i18n) return out
  for (const [key, value] of Object.entries(i18n)) {
    if (baseLanguageKey && key === baseLanguageKey) continue
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (trimmed) out[key] = trimmed
  }
  return out
}
