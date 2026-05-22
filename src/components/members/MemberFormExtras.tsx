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
import type { MemberFormFieldKey, MemberFormFieldState, MemberFormFieldsConfig } from '@/types/calendar'

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
  }
}

// ─── Validation ─────────────────────────────────────────────────────

/** Returns null if all required fields are filled; otherwise the locale-
 *  appropriate error string for the first missing one. */
export function validateExtras(
  config: MemberFormFieldsConfig | null | undefined,
  extras: MemberExtras,
  locale: string,
): string | null {
  if (!config) return null
  const isFr = locale === 'fr'
  const required = (key: MemberFormFieldKey, ok: boolean): string | null => {
    if (config[key] !== 'required' || ok) return null
    return isFr
      ? `Le champ « ${fieldLabel(key, locale)} » est obligatoire.`
      : `"${fieldLabel(key, locale)}" is required.`
  }
  const referralFilled =
    !!extras.referralSource.trim() ||
    !!extras.referralName.trim() ||
    !!extras.referralEmail.trim()
  const emergencyFilled =
    !!extras.emergencyContactName.trim() ||
    !!extras.emergencyContactRelationship.trim() ||
    !!extras.emergencyContactPhone.trim() ||
    !!extras.emergencyContactEmail.trim() ||
    !!extras.emergencyContactNotes.trim()
  return (
    required('date_of_birth',     !!extras.dateOfBirth.trim()) ||
    required('referral_source',   referralFilled) ||
    required('gender',            !!extras.gender.trim()) ||
    required('address',           !!extras.address.trim()) ||
    required('emergency_contact', emergencyFilled) ||
    required('background_notes',  !!extras.backgroundNotes.trim())
  )
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
  if (visible('referral_source')) {
    const source = extras.referralSource.trim()
    const name = extras.referralName.trim()
    const email = extras.referralEmail.trim()
    if (source || name || email) {
      out.referred_by = {
        source: source || null,
        name: name || null,
        email: email || null,
      }
    }
  }
  if (visible('gender') && extras.gender.trim()) {
    out.gender = extras.gender.trim()
  }
  if (visible('address') && extras.address.trim()) {
    out.address = extras.address.trim()
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
  const visible = (key: MemberFormFieldKey) => config[key] === 'optional' || config[key] === 'required'
  const isReq = (key: MemberFormFieldKey) => config[key] === 'required'
  const labelEl = (key: MemberFormFieldKey) => (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {fieldLabel(key, locale)} {isReq(key) && <span className="text-rose-500">*</span>}
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
        // Canonical referral source list — kept in English in the
        // database (stored value) but rendered in the practitioner's
        // locale so the dropdown reads naturally for everyone.
        const sourceOptions: { value: string; en: string; fr: string }[] = [
          { value: 'Another practitioner',     en: 'Another practitioner',     fr: 'Autre praticien' },
          { value: 'Existing patient',         en: 'Existing patient',         fr: 'Patient existant' },
          { value: 'Online search',            en: 'Online search',            fr: 'Recherche en ligne' },
          { value: 'Social media',             en: 'Social media',             fr: 'Réseaux sociaux' },
          { value: 'Word of mouth',            en: 'Word of mouth',            fr: 'Bouche-à-oreille' },
          { value: 'Insurance / health network', en: 'Insurance / health network', fr: 'Assurance / réseau de santé' },
          { value: 'Other',                    en: 'Other',                    fr: 'Autre' },
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
      {visible('gender') && (
        <div>
          {labelEl('gender')}
          <input
            type="text"
            value={value.gender}
            onChange={(e) => onChange({ ...value, gender: e.target.value })}
            className={input}
            placeholder={locale === 'fr' ? 'Femme, homme, non-binaire…' : 'Woman, man, non-binary…'}
          />
        </div>
      )}
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

  const setField = (key: MemberFormFieldKey, state: MemberFormFieldState | null) => {
    setDraft(prev => {
      const next = { ...prev }
      if (state === null) delete next[key]
      else next[key] = state
      return next
    })
  }

  const currentOf = (key: MemberFormFieldKey): MemberFormFieldState | 'hidden' => draft[key] || 'hidden'

  const tabs: { id: MemberFormFieldState | 'hidden'; label: string }[] = [
    { id: 'hidden',   label: locale === 'fr' ? 'Masqué' : 'Hidden' },
    { id: 'optional', label: locale === 'fr' ? 'Optionnel' : 'Optional' },
    { id: 'required', label: locale === 'fr' ? 'Obligatoire' : 'Required' },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-snug">
        {locale === 'fr'
          ? 'Choisissez les champs additionnels qui apparaîtront dans le formulaire d\'ajout. « Obligatoire » empêche la création tant que le champ est vide.'
          : 'Choose which extra fields appear in the Add form. "Required" blocks creation until the field is filled.'}
      </p>
      {FIELD_ORDER.map(key => {
        const state = currentOf(key)
        return (
          <div key={key} className="flex items-center justify-between gap-3 py-1.5">
            <span className="text-sm text-gray-800">{fieldLabel(key, locale)}</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setField(key, tab.id === 'hidden' ? null : tab.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    state === tab.id
                      ? (tab.id === 'required' ? 'bg-rose-50 text-rose-700' :
                         tab.id === 'optional' ? 'bg-white shadow-sm text-gray-900' :
                         'bg-white shadow-sm text-gray-500')
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
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
