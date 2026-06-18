/**
 * Screen colour palette for interactive resources.
 *
 * By default each screen cycles through STEP_COLORS (the "Auto / varied"
 * look). Practitioners can override a screen — or all screens — with a
 * colour from RESOURCE_PALETTE, a small psychology-informed set offered in a
 * clear-dark (focus / immersive) and clear-light (gentle / low-stimulation)
 * variant. The chosen colour is stored on the screen's anchor block so it
 * travels with the saved resource to the patient app.
 */

// Auto rotation — the historical default, kept so existing resources look
// unchanged until a practitioner picks a colour.
export const STEP_COLORS = [
  '#4A9A86', '#3B82F6', '#8B5CF6', '#F97316',
  '#F43F5E', '#10B981', '#2D5F8A', '#F59E0B',
]

export interface PaletteHue {
  key: string
  label: string
  labelFr: string
  /** Short psychology note shown next to the swatch. */
  meaning: string
  meaningFr: string
  dark: string
  light: string
}

// Minimal, calming palette. Order = how it reads in the dropdown.
export const RESOURCE_PALETTE: PaletteHue[] = [
  { key: 'teal',   label: 'Teal',   labelFr: 'Sarcelle', meaning: 'calm · growth',      meaningFr: 'calme · croissance',          dark: '#2F8F7F', light: '#DCEFE9' },
  { key: 'sage',   label: 'Sage',   labelFr: 'Sauge',    meaning: 'renewal · balance',  meaningFr: 'renouveau · équilibre',       dark: '#5E8C6A', light: '#E3EEE2' },
  { key: 'blue',   label: 'Blue',   labelFr: 'Bleu',     meaning: 'trust · serenity',   meaningFr: 'confiance · sérénité',        dark: '#2D6CB5', light: '#DCE9F7' },
  { key: 'violet', label: 'Violet', labelFr: 'Violet',   meaning: 'reflection',         meaningFr: 'réflexion',                   dark: '#5B53B5', light: '#E6E3F5' },
  { key: 'rose',   label: 'Rose',   labelFr: 'Rose',     meaning: 'compassion · warmth', meaningFr: 'compassion · douceur',       dark: '#B85F7E', light: '#F6E3EC' },
  { key: 'warm',   label: 'Warm',   labelFr: 'Chaleur',  meaning: 'warmth · comfort',   meaningFr: 'chaleur · réconfort',         dark: '#C75D4F', light: '#F7E6DC' },
  { key: 'amber',  label: 'Amber',  labelFr: 'Ambre',    meaning: 'optimism · energy',  meaningFr: 'optimisme · énergie',         dark: '#B5832B', light: '#F6ECD2' },
  { key: 'sand',   label: 'Sand',   labelFr: 'Sable',    meaning: 'grounding · stability', meaningFr: 'ancrage · stabilité',      dark: '#9A8769', light: '#EFE9DC' },
  { key: 'slate',  label: 'Slate',  labelFr: 'Ardoise',  meaning: 'grounding · focus',  meaningFr: 'ancrage · concentration',     dark: '#3E4A5A', light: '#ECEEF1' },
]

// All palette colours flattened — used to tell an "override" colour apart
// from the auto rotation.
export const PALETTE_COLORS: string[] = RESOURCE_PALETTE.flatMap(h => [h.dark, h.light])

// Perceived-luminance check (ITU-R BT.601). True for the light variants, so
// the preview can flip to dark text/chrome and stay readable.
export function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

// Foreground tokens for a given screen background, so light and dark screens
// both stay legible.
export function screenForeground(bg: string) {
  const light = isLightColor(bg)
  return {
    light,
    text: light ? '#1F2937' : '#FFFFFF',           // gray-800 vs white
    textSoft: light ? 'rgba(31,41,55,0.65)' : 'rgba(255,255,255,0.9)',
    track: light ? 'rgba(31,41,55,0.15)' : 'rgba(255,255,255,0.2)',
    fill: light ? '#1F2937' : '#FFFFFF',
    chipBg: light ? 'rgba(31,41,55,0.08)' : 'rgba(255,255,255,0.15)',
    backBg: light ? 'rgba(31,41,55,0.10)' : 'rgba(0,0,0,0.15)',
    // Primary "Next/Submit" button: a solid pill that contrasts the bg.
    primaryBg: light ? '#1F2937' : '#FFFFFF',
    primaryText: light ? '#FFFFFF' : bg,
  }
}
