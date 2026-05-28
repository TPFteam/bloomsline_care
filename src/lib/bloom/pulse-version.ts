// Bumped each time the Bloom Pulse prompt, schema, or data inputs change
// in a way that makes prior summaries materially less complete than what
// a fresh run would produce. Old summaries with a lower version number
// surface an "Updated version available" banner so practitioners can
// regenerate at their own pace (no automatic token-burn on view).
//
// Bump history:
//  1 — initial release
//  2 — added shared moments, patient stories, resource responses,
//      bookings timeline, file extractions (DOCX/plain-text), and the
//      _data_sources transparency block
export const PULSE_VERSION = 2
