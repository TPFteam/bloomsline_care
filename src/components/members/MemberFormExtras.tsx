/**
 * Configurable optional fields for the "Add a new person" popup.
 *
 * Two surfaces:
 *  - <MemberFormExtras /> renders whichever fields the practitioner has
 *    enabled in booking_settings.member_form_fields.
 *  - <MemberFormFieldsConfigPanel /> is the "configure" view shown when
 *    the practitioner taps the gear icon inside the popup. They toggle
 *    each optional field between Hidden / Optional / Required; saving
 *    writes the resulting config to booking_settings (caller handles
 *    persistence via onSave).
 *
 * Hard-coded fields (first name, last name, email, phone, minor, invite,
 * groups) stay in the parent — only the *optional* extras live here.
 */

'use client'

import { useState } from 'react'
import type { MemberFormFieldKey, MemberFormFieldsConfig } from '@/types/calendar'

export interface MemberExtras {
  dateOfBirth: string
  // Referral block — Source/Name/Email shown together when "Referred by"
  // is enabled, mirroring the member-detail "Referred by" card.
  referralSource: string
  referralName: string
  referralEmail: string
  gender: string
  address: string
  // Emergency contact block — five sub-fields, mirroring the
  // member-detail "Emergency Contact" card.
  emergencyContactName: string
  emergencyContactRelationship: string
  emergencyContactPhone: string
  emergencyContactEmail: string
  emergencyContactNotes: string
  backgroundNotes: string
}

export const EMPTY_EXTRAS: MemberExtras = {
  dateOfBirth: '',
  referralSource: '',
  referralName: '',
  referralEmail: '',
  gender: '',
  address: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
  emergencyContactNotes: '',
  backgroundNotes: '',
}

const FIELD_ORDER: MemberFormFieldKey[] = [
  'date_of_birth',
  'referral_source',
  'gender',
  'address',
  'emergency_contact',
  'background_notes',
  'add_to_group',
]

function fieldLabel(key: MemberFormFieldKey, locale: string): string {
  const isFr = locale === 'fr'
  switch (key) {
    case 'date_of_birth':     return isFr ? 'Date de naissance' : 'Date of birth'
    case 'referral_source':   return isFr ? 'Référé par' : 'Referred by'
    case 'gender':            return isFr ? 'Genre' : 'Gender'
    case 'address':           return isFr ? 'Adresse' : 'Address'
    case 'emergency_contact': return isFr ? 'Contact d\'urgence' : 'Emergency Contact'
    case 'background_notes':  return isFr ? 'Notes contextuelles' : 'Background notes'
    case 'add_to_group':      return isFr ? 'Ajouter à un groupe' : 'Add to a Group'
  }
}

// Helper for popups that don't render group selection through
// <MemberFormExtras> (the group section is bespoke in each popup);
// they call this to decide whether to render their own group block.
//
// add_to_group is special: it was a default-visible section before we
// made it configurable, so it stays ON unless the practitioner
// explicitly toggled it off (= stored as 'hidden'). Other fields use
// the standard "missing key = hidden" convention.
export function shouldShowAddToGroup(config: { add_to_group?: unknown } | null | undefined): boolean {
  if (!config) return true
  return config.add_to_group !== 'hidden'
}

// True when at least one of the six column-extras (the ones rendered
// by <MemberFormExtras />) is set to visible. add_to_group doesn't
// count here — it's a separate section at the bottom of each popup,
// not part of the two-column extras layout.
export function hasVisibleColumnExtras(config: MemberFormFieldsConfig | null | undefined): boolean {
  if (!config) return false
  const keys: MemberFormFieldKey[] = [
    'date_of_birth', 'referral_source', 'gender', 'address',
    'emergency_contact', 'background_notes',
  ]
  return keys.some(k => config[k] === 'optional' || config[k] === 'required')
}

// ─── Validation ─────────────────────────────────────────────────────

/**
 * Configurable fields are show-or-hide only — there's no "required"
 * concept any more, so validation is always a pass. Kept as a no-op
 * function so callers don't need to change their flow if we ever
 * reintroduce per-field rules.
 */
export function validateExtras(
  _config: MemberFormFieldsConfig | null | undefined,
  _extras: MemberExtras,
  _locale: string,
): string | null {
  return null
}

/** Map the form state to columns/JSON ready for an `insert into members`. */
export function extrasToMemberColumns(
  config: MemberFormFieldsConfig | null | undefined,
  extras: MemberExtras,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!config) return out
  const visible = (key: MemberFormFieldKey) => config[key] === 'optional' || config[key] === 'required'

  if (visible('date_of_birth') && extras.dateOfBirth.trim()) {
    out.date_of_birth = extras.dateOfBirth
  }
  // Referral writes to the EXISTING referral_source / referral_name /
  // referral_email columns so the FilesTab Referred by card picks up
  // what was entered in the Add popup.
  if (visible('referral_source')) {
    const source = extras.referralSource.trim()
    const name = extras.referralName.trim()
    const email = extras.referralEmail.trim()
    if (source) out.referral_source = source
    if (name) out.referral_name = name
    if (email) out.referral_email = email
  }
  if (visible('gender') && extras.gender.trim()) {
    out.gender = extras.gender.trim()
  }
  // Address writes to additional_contacts (the JSONB array FilesTab
  // already renders via the "Additional contacts" section). On the
  // insert path additional_contacts starts empty, so seeding it with a
  // single address entry is safe; the orphan-update path is for
  // members that haven't been linked to any practitioner yet, so they
  // also tend not to have existing entries.
  if (visible('address') && extras.address.trim()) {
    out.additional_contacts = [{
      type: 'address',
      label: 'Address',
      value: extras.address.trim(),
    }]
  }
  if (visible('emergency_contact')) {
    const name = extras.emergencyContactName.trim()
    const relationship = extras.emergencyContactRelationship.trim()
    const phone = extras.emergencyContactPhone.trim()
    const email = extras.emergencyContactEmail.trim()
    const notes = extras.emergencyContactNotes.trim()
    if (name || relationship || phone || email || notes) {
      out.emergency_contact = {
        name: name || null,
        relationship: relationship || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      }
    }
  }
  if (visible('background_notes') && extras.backgroundNotes.trim()) {
    // Maps to the existing `internal_notes` column.
    out.internal_notes = extras.backgroundNotes.trim()
  }
  return out
}

// ─── Form section ───────────────────────────────────────────────────

export function MemberFormExtras({
  config,
  value,
  onChange,
  locale,
}: {
  config: MemberFormFieldsConfig | null | undefined
  value: MemberExtras
  onChange: (next: MemberExtras) => void
  locale: string
}) {
  if (!config) return null
  // 'required' is legacy data (older configs saved before we dropped
  // the concept) — treat it the same as 'optional' (just shown).
  const visible = (key: MemberFormFieldKey) => config[key] === 'optional' || config[key] === 'required'
  const labelEl = (key: MemberFormFieldKey) => (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {fieldLabel(key, locale)}
    </label>
  )
  const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm'

  return (
    <>
      {visible('date_of_birth') && (
        <div>
          {labelEl('date_of_birth')}
          <input
            type="date"
            value={value.dateOfBirth}
            onChange={(e) => onChange({ ...value, dateOfBirth: e.target.value })}
            className={input}
          />
        </div>
      )}
      {visible('referral_source') && (() => {
        // Canonical referral source codes — match FilesTab's Referred
        // by select so what's entered here renders correctly in the
        // member detail card. Stored value = the short code; label
        // shown to the practitioner is locale-aware.
        const sourceOptions: { value: string; en: string; fr: string }[] = [
          { value: 'practitioner',   en: 'Another practitioner',         fr: 'Autre praticien' },
          { value: 'patient',        en: 'Existing patient',             fr: 'Patient existant' },
          { value: 'online',         en: 'Online search',                fr: 'Recherche en ligne' },
          { value: 'social_media',   en: 'Social media',                 fr: 'Réseaux sociaux' },
          { value: 'word_of_mouth',  en: 'Word of mouth',                fr: 'Bouche-à-oreille' },
          { value: 'insurance',      en: 'Insurance / health network',   fr: 'Assurance / réseau santé' },
          { value: 'other',          en: 'Other',                        fr: 'Autre' },
        ]
        return (
          <div>
            {labelEl('referral_source')}
            <div className="space-y-2">
              <select
                value={value.referralSource}
                onChange={(e) => onChange({ ...value, referralSource: e.target.value })}
                className={`${input} bg-white`}
              >
                <option value="">{locale === 'fr' ? 'Sélectionner…' : 'Select…'}</option>
                {sourceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {locale === 'fr' ? opt.fr : opt.en}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={value.referralName}
                  onChange={(e) => onChange({ ...value, referralName: e.target.value })}
                  className={input}
                  placeholder={locale === 'fr' ? 'Nom' : 'Name'}
                />
                <input
                  type="email"
                  value={value.referralEmail}
                  onChange={(e) => onChange({ ...value, referralEmail: e.target.value })}
                  className={input}
                  placeholder={locale === 'fr' ? 'Email' : 'Email'}
                />
              </div>
            </div>
          </div>
        )
      })()}
      {visible('gender') && (() => {
        // Same codes as the Contact Information gender dropdown on
        // the member detail page (FilesTab).
        const genderOptions: { value: string; en: string; fr: string }[] = [
          { value: 'woman',             en: 'Woman',             fr: 'Femme' },
          { value: 'man',               en: 'Man',               fr: 'Homme' },
          { value: 'non_binary',        en: 'Non-binary',        fr: 'Non-binaire' },
          { value: 'other',             en: 'Other',             fr: 'Autre' },
          { value: 'prefer_not_to_say', en: 'Prefer not to say', fr: 'Préfère ne pas dire' },
        ]
        return (
          <div>
            {labelEl('gender')}
            <select
              value={value.gender}
              onChange={(e) => onChange({ ...value, gender: e.target.value })}
              className={`${input} bg-white`}
            >
              <option value="">{locale === 'fr' ? 'Sélectionner…' : 'Select…'}</option>
              {genderOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {locale === 'fr' ? opt.fr : opt.en}
                </option>
              ))}
            </select>
          </div>
        )
      })()}
      {visible('address') && (
        <div>
          {labelEl('address')}
          <input
            type="text"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            className={input}
            placeholder={locale === 'fr' ? '12 rue de la Paix, Paris' : '221B Baker Street, London'}
          />
        </div>
      )}
      {visible('emergency_contact') && (
        <div>
          {labelEl('emergency_contact')}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={value.emergencyContactName}
                onChange={(e) => onChange({ ...value, emergencyContactName: e.target.value })}
                className={input}
                placeholder={locale === 'fr' ? 'Nom' : 'Name'}
              />
              <input
                type="text"
                value={value.emergencyContactRelationship}
                onChange={(e) => onChange({ ...value, emergencyContactRelationship: e.target.value })}
                className={input}
                placeholder={locale === 'fr' ? 'Relation (ex. Conjoint, Parent)' : 'Relationship (e.g. Spouse, Parent)'}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={value.emergencyContactPhone}
                onChange={(e) => onChange({ ...value, emergencyContactPhone: e.target.value })}
                className={input}
                placeholder={locale === 'fr' ? 'Téléphone' : 'Phone'}
              />
              <input
                type="email"
                value={value.emergencyContactEmail}
                onChange={(e) => onChange({ ...value, emergencyContactEmail: e.target.value })}
                className={input}
                placeholder={locale === 'fr' ? 'Email' : 'Email'}
              />
            </div>
            <textarea
              value={value.emergencyContactNotes}
              onChange={(e) => onChange({ ...value, emergencyContactNotes: e.target.value })}
              className={`${input} min-h-[60px] resize-y`}
              placeholder={locale === 'fr' ? 'Notes additionnelles…' : 'Any additional notes…'}
            />
          </div>
        </div>
      )}
      {visible('background_notes') && (
        <div>
          {labelEl('background_notes')}
          <textarea
            value={value.backgroundNotes}
            onChange={(e) => onChange({ ...value, backgroundNotes: e.target.value })}
            className={`${input} min-h-[72px] resize-y`}
            placeholder={locale === 'fr' ? 'Antécédents, contexte clinique…' : 'Background, clinical context…'}
          />
        </div>
      )}
    </>
  )
}

// ─── Configure view ─────────────────────────────────────────────────

export function MemberFormFieldsConfigPanel({
  initial,
  onCancel,
  onSave,
  locale,
  saving,
}: {
  initial: MemberFormFieldsConfig | null | undefined
  onCancel: () => void
  onSave: (next: MemberFormFieldsConfig) => void
  locale: string
  saving?: boolean
}) {
  const [draft, setDraft] = useState<MemberFormFieldsConfig>(() => ({ ...(initial || {}) }))

  // Binary toggle: shown = 'optional', hidden = key absent.
  //
  // add_to_group is the exception — it was visible before we made it
  // configurable, so a missing key means SHOWN (legacy default). To
  // hide it, we store 'hidden' explicitly. Other fields keep the
  // standard "missing = hidden" convention.
  const setVisible = (key: MemberFormFieldKey, shown: boolean) => {
    setDraft(prev => {
      const next = { ...prev }
      if (key === 'add_to_group') {
        if (shown) delete next[key]
        else (next as Record<string, string>)[key] = 'hidden'
      } else if (shown) {
        next[key] = 'optional'
      } else {
        delete next[key]
      }
      return next
    })
  }

  const isShown = (key: MemberFormFieldKey) => {
    if (key === 'add_to_group') return (draft as Record<string, unknown>)[key] !== 'hidden'
    return !!draft[key]
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-snug">
        {locale === 'fr'
          ? 'Choisissez les champs additionnels qui apparaîtront dans le formulaire d\'ajout.'
          : 'Choose which extra fields appear in the Add form.'}
      </p>
      {FIELD_ORDER.map(key => {
        const shown = isShown(key)
        return (
          <div key={key} className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-sm text-gray-800">{fieldLabel(key, locale)}</span>
            <button
              type="button"
              onClick={() => setVisible(key, !shown)}
              role="switch"
              aria-checked={shown}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                shown ? 'bg-teal-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  shown ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )
      })}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          {locale === 'fr' ? 'Annuler' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {locale === 'fr' ? 'Enregistrer' : 'Save'}
        </button>
      </div>
    </div>
  )
}
