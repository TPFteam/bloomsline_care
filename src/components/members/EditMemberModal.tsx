'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Calendar, Shield, Save, X, Loader2 } from 'lucide-react'
import { PhoneInput } from '@/components/ui/phone-input'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, MemberStatus, EngagementLevel, EmergencyContact } from '@/types/member'

type Section = 'basic' | 'emergency'

interface EditMemberModalProps {
  memberId: string
  isOpen: boolean
  onClose: () => void
  onSaved?: (member: Member) => void
}

export function EditMemberModal({ memberId, isOpen, onClose, onSaved }: EditMemberModalProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [section, setSection] = useState<Section>('basic')

  // Basic
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState<MemberStatus>('active')
  const [engagementLevel, setEngagementLevel] = useState<EngagementLevel>('medium')

  // Emergency
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyEmail, setEmergencyEmail] = useState('')
  const [emergencyNotes, setEmergencyNotes] = useState('')

  useEffect(() => {
    if (isOpen && memberId) fetchMember()
  }, [isOpen, memberId])

  const fetchMember = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('members').select('*').eq('id', memberId).single()
      if (!data) return
      setFirstName(data.first_name)
      setLastName(data.last_name)
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setDateOfBirth(data.date_of_birth || '')
      setStatus(data.status)
      setEngagementLevel(data.engagement_level)
      setEmergencyName(data.emergency_contact?.name || '')
      setEmergencyRelationship(data.emergency_contact?.relationship || '')
      setEmergencyPhone(data.emergency_contact?.phone || '')
      setEmergencyEmail(data.emergency_contact?.email || '')
      setEmergencyNotes(data.emergency_contact?.notes || '')
    } catch { toast.error(t.members.errors.loadFailed) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(locale === 'fr' ? 'Prénom et nom requis' : 'First and last name required')
      return
    }
    setSaving(true)
    try {
      const emergency_contact: EmergencyContact = {
        name: emergencyName || null,
        relationship: emergencyRelationship || null,
        phone: emergencyPhone || null,
        email: emergencyEmail || null,
        notes: emergencyNotes || null,
      }
      const { data, error } = await supabase
        .from('members')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          date_of_birth: dateOfBirth || null,
          status,
          engagement_level: engagementLevel,
          emergency_contact,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error
      toast.success(t.members.success.memberUpdated)
      onSaved?.(data)
      onClose()
    } catch { toast.error(t.members.errors.saveFailed) }
    finally { setSaving(false) }
  }

  const sections: { id: Section; label: string; icon: typeof User }[] = [
    { id: 'basic', label: locale === 'fr' ? 'Informations' : 'Basic Info', icon: User },
    { id: 'emergency', label: locale === 'fr' ? 'Urgence' : 'Emergency', icon: Shield },
  ]

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all"
  const labelClass = "text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1.5"
  const selectClass = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition-all appearance-none"

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              {loading ? '...' : `${firstName} ${lastName}`}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Section tabs */}
          <div className="flex gap-1 px-6 py-3 border-b border-gray-50">
            {sections.map(s => {
              const Icon = s.icon
              const active = section === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                {/* ─── Basic Info ─── */}
                {section === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}><User className="w-3 h-3" /> {locale === 'fr' ? 'Prénom' : 'First Name'} *</label>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>{locale === 'fr' ? 'Nom' : 'Last Name'} *</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}><Mail className="w-3 h-3" /> Email</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}><Phone className="w-3 h-3" /> {locale === 'fr' ? 'Téléphone' : 'Phone'}</label>
                        <PhoneInput value={phone} onChange={setPhone} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}><Calendar className="w-3 h-3" /> {locale === 'fr' ? 'Date de naissance' : 'Date of Birth'}</label>
                        <input value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} type="date" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as MemberStatus)} className={selectClass}>
                          <option value="active">{locale === 'fr' ? 'Actif' : 'Active'}</option>
                          <option value="inactive">{locale === 'fr' ? 'Inactif' : 'Inactive'}</option>
                          <option value="pending">{locale === 'fr' ? 'En attente' : 'Pending'}</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Engagement</label>
                        <select value={engagementLevel} onChange={e => setEngagementLevel(e.target.value as EngagementLevel)} className={selectClass}>
                          <option value="low">{locale === 'fr' ? 'Faible' : 'Low'}</option>
                          <option value="medium">{locale === 'fr' ? 'Moyen' : 'Medium'}</option>
                          <option value="high">{locale === 'fr' ? 'Élevé' : 'High'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Emergency ─── */}
                {section === 'emergency' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>{locale === 'fr' ? 'Nom' : 'Name'}</label>
                        <input value={emergencyName} onChange={e => setEmergencyName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>{locale === 'fr' ? 'Relation' : 'Relationship'}</label>
                        <input value={emergencyRelationship} onChange={e => setEmergencyRelationship(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}><Phone className="w-3 h-3" /> {locale === 'fr' ? 'Téléphone' : 'Phone'}</label>
                        <input value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}><Mail className="w-3 h-3" /> Email</label>
                        <input value={emergencyEmail} onChange={e => setEmergencyEmail(e.target.value)} type="email" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>{locale === 'fr' ? 'Notes' : 'Notes'}</label>
                      <textarea value={emergencyNotes} onChange={e => setEmergencyNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
              {locale === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {locale === 'fr' ? 'Enregistrer' : 'Save'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
