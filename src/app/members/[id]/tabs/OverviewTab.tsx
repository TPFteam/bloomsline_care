'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Heart,
  AlertCircle,
  Shield,
  Phone,
  Mail,
  Plus,
  ChevronRight,
  Sparkles,
  User,
  Lock,
  Edit3,
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Member, ProgressNote, NoteType, MemberPreferences, EmergencyContact, SessionFormat } from '@/types/member'

type ContactMethod = 'email' | 'phone' | 'text'

interface OverviewTabProps {
  member: Member
  notes: ProgressNote[]
  onNotesUpdate: () => void
  onMemberUpdate: () => void
}

export default function OverviewTab({ member, notes, onNotesUpdate, onMemberUpdate }: OverviewTabProps) {
  const { t } = useLanguage()
  const supabase = createClient()

  // Notes state
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [isPrivate, setIsPrivate] = useState(true)
  const [savingNote, setSavingNote] = useState(false)

  // Edit states
  const [editingAbout, setEditingAbout] = useState(false)
  const [editingPreferences, setEditingPreferences] = useState(false)
  const [editingEmergency, setEditingEmergency] = useState(false)
  const [saving, setSaving] = useState(false)

  // Section refs for scrolling
  const preferencesRef = useRef<HTMLDivElement>(null)
  const emergencyRef = useRef<HTMLDivElement>(null)

  // About edit fields
  const [aboutNotes, setAboutNotes] = useState(member.internal_notes || '')

  // Preferences edit fields
  const [commStyle, setCommStyle] = useState(member.preferences.communication_style || '')
  const [strengths, setStrengths] = useState<string[]>(member.preferences.key_strengths)
  const [strengthInput, setStrengthInput] = useState('')
  const [sensitivities, setSensitivities] = useState<string[]>(member.preferences.areas_of_sensitivity)
  const [sensitivityInput, setSensitivityInput] = useState('')
  const [therapyContext, setTherapyContext] = useState(member.preferences.therapeutic_context || '')
  const [contactMethod, setContactMethod] = useState<ContactMethod>(member.preferences.preferred_contact_method)
  const [sessionFormat, setSessionFormat] = useState<SessionFormat>(member.preferences.preferred_session_format)

  // Emergency contact edit fields
  const [emergencyName, setEmergencyName] = useState(member.emergency_contact.name || '')
  const [emergencyRelationship, setEmergencyRelationship] = useState(member.emergency_contact.relationship || '')
  const [emergencyPhone, setEmergencyPhone] = useState(member.emergency_contact.phone || '')
  const [emergencyEmail, setEmergencyEmail] = useState(member.emergency_contact.email || '')
  const [emergencyNotes, setEmergencyNotes] = useState(member.emergency_contact.notes || '')

  // Helper functions
  const handleAddStrength = () => {
    if (strengthInput.trim() && !strengths.includes(strengthInput.trim())) {
      setStrengths([...strengths, strengthInput.trim()])
      setStrengthInput('')
    }
  }

  const handleAddSensitivity = () => {
    if (sensitivityInput.trim() && !sensitivities.includes(sensitivityInput.trim())) {
      setSensitivities([...sensitivities, sensitivityInput.trim()])
      setSensitivityInput('')
    }
  }

  // Save handlers
  const handleSaveAbout = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({ internal_notes: aboutNotes.trim() || null })
        .eq('id', member.id)

      if (error) throw error

      toast.success('About section updated')
      setEditingAbout(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating about:', error)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const preferences: MemberPreferences = {
        communication_style: commStyle.trim() || null,
        key_strengths: strengths,
        areas_of_sensitivity: sensitivities,
        therapeutic_context: therapyContext.trim() || null,
        preferred_contact_method: contactMethod,
        preferred_session_format: sessionFormat,
      }

      const { error } = await supabase
        .from('members')
        .update({ preferences })
        .eq('id', member.id)

      if (error) throw error

      toast.success('Preferences updated')
      setEditingPreferences(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEmergency = async () => {
    setSaving(true)
    try {
      const emergency_contact: EmergencyContact = {
        name: emergencyName.trim() || null,
        relationship: emergencyRelationship.trim() || null,
        phone: emergencyPhone.trim() || null,
        email: emergencyEmail.trim() || null,
        notes: emergencyNotes.trim() || null,
      }

      const { error } = await supabase
        .from('members')
        .update({ emergency_contact })
        .eq('id', member.id)

      if (error) throw error

      toast.success('Emergency contact updated')
      setEditingEmergency(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating emergency contact:', error)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Note content is required')
      return
    }

    setSavingNote(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('progress_notes')
        .insert({
          member_id: member.id,
          practitioner_id: user.id,
          title: noteTitle.trim() || null,
          content: noteContent.trim(),
          note_type: noteType,
          is_private: isPrivate,
        })

      if (error) throw error

      toast.success(t.members.success.noteAdded)
      setShowAddNote(false)
      setNoteTitle('')
      setNoteContent('')
      setNoteType('general')
      onNotesUpdate()
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error(t.members.errors.noteFailed)
    } finally {
      setSavingNote(false)
    }
  }

  // Check if preferences section has any data
  const hasPreferencesData =
    member.preferences.communication_style ||
    member.preferences.key_strengths.length > 0 ||
    member.preferences.areas_of_sensitivity.length > 0 ||
    member.preferences.therapeutic_context

  // Check if emergency contact has any data
  const hasEmergencyData =
    member.emergency_contact.name ||
    member.emergency_contact.phone ||
    member.emergency_contact.email

  const noteTypeColors: Record<NoteType, { bg: string; text: string }> = {
    general: { bg: 'bg-gray-100', text: 'text-gray-700' },
    assessment: { bg: 'bg-blue-50', text: 'text-blue-700' },
    treatment_plan: { bg: 'bg-purple-50', text: 'text-purple-700' },
    milestone: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    concern: { bg: 'bg-red-50', text: 'text-red-700' },
    observation: { bg: 'bg-amber-50', text: 'text-amber-700' },
  }

  const { locale } = useLanguage()

  // Scroll and open handlers
  const handleOpenPreferences = () => {
    setEditingPreferences(true)
    setTimeout(() => {
      preferencesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleOpenEmergency = () => {
    setEditingEmergency(true)
    setTimeout(() => {
      emergencyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // Check what's missing
  const missingItems = []
  if (!hasPreferencesData) missingItems.push({ key: 'preferences', label: locale === 'fr' ? 'Préférences' : 'Preferences', action: handleOpenPreferences })
  if (!hasEmergencyData) missingItems.push({ key: 'emergency', label: locale === 'fr' ? 'Contact d\'urgence' : 'Emergency Contact', action: handleOpenEmergency })

  return (
    <div className="space-y-6">
      {/* Complete Profile Banner */}
      {missingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">
                {locale === 'fr' ? 'Compléter le profil' : 'Complete Profile'}
              </p>
              <p className="text-xs text-amber-700">
                {locale === 'fr' ? 'Ajoutez plus de détails pour ce client' : 'Add more details for this client'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {missingItems.map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant="outline"
                onClick={item.action}
                className="text-amber-700 border-amber-300 hover:bg-amber-100 rounded-lg text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - About & Preferences */}
        <div className="lg:col-span-2 space-y-6">
        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              {t.members.overview.aboutClient}
            </h3>
            {!editingAbout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAbout(true)}
                className="text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editingAbout ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <textarea
                  value={aboutNotes}
                  onChange={(e) => setAboutNotes(e.target.value)}
                  placeholder="Add notes about this client..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all resize-none text-sm"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAboutNotes(member.internal_notes || '')
                      setEditingAbout(false)
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAbout}
                    disabled={saving}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </motion.div>
            ) : member.internal_notes ? (
              <motion.p
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed"
              >
                {member.internal_notes}
              </motion.p>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No notes added yet</p>
                <Button
                  size="sm"
                  onClick={() => setEditingAbout(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Notes
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Preferences Section */}
        <motion.div
          ref={preferencesRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-600" />
              </div>
              {t.members.overview.preferences}
            </h3>
            {!editingPreferences && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingPreferences(true)}
                className="text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editingPreferences ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Communication Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.communicationStyle}
                  </label>
                  <textarea
                    value={commStyle}
                    onChange={(e) => setCommStyle(e.target.value)}
                    placeholder={t.members.form.communicationStylePlaceholder}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all resize-none text-sm"
                  />
                </div>

                {/* Key Strengths */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.keyStrengths}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={strengthInput}
                      onChange={(e) => setStrengthInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddStrength()
                        }
                      }}
                      placeholder={t.members.form.keyStrengthsPlaceholder}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleAddStrength}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {strengths.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {strengths.map((strength) => (
                        <span
                          key={strength}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-sm"
                        >
                          {strength}
                          <button
                            type="button"
                            onClick={() => setStrengths(strengths.filter(s => s !== strength))}
                            className="hover:text-emerald-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Areas of Sensitivity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.areasOfSensitivity}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={sensitivityInput}
                      onChange={(e) => setSensitivityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSensitivity()
                        }
                      }}
                      placeholder={t.members.form.areasOfSensitivityPlaceholder}
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleAddSensitivity}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {sensitivities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sensitivities.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => setSensitivities(sensitivities.filter(s => s !== area))}
                            className="hover:text-amber-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Therapeutic Context */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.therapeuticContext}
                  </label>
                  <textarea
                    value={therapyContext}
                    onChange={(e) => setTherapyContext(e.target.value)}
                    placeholder={t.members.form.therapeuticContextPlaceholder}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all resize-none text-sm"
                  />
                </div>

                {/* Contact & Session Preferences */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.preferredContactMethod}
                    </label>
                    <select
                      value={contactMethod}
                      onChange={(e) => setContactMethod(e.target.value as ContactMethod)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    >
                      <option value="email">{t.members.contactMethods.email}</option>
                      <option value="phone">{t.members.contactMethods.phone}</option>
                      <option value="text">{t.members.contactMethods.text}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.preferredSessionFormat}
                    </label>
                    <select
                      value={sessionFormat}
                      onChange={(e) => setSessionFormat(e.target.value as SessionFormat)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    >
                      <option value="in_person">{t.members.sessionFormats.in_person}</option>
                      <option value="virtual">{t.members.sessionFormats.virtual}</option>
                      <option value="phone">{t.members.sessionFormats.phone}</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCommStyle(member.preferences.communication_style || '')
                      setStrengths(member.preferences.key_strengths)
                      setSensitivities(member.preferences.areas_of_sensitivity)
                      setTherapyContext(member.preferences.therapeutic_context || '')
                      setContactMethod(member.preferences.preferred_contact_method)
                      setSessionFormat(member.preferences.preferred_session_format)
                      setEditingPreferences(false)
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </motion.div>
            ) : hasPreferencesData ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {member.preferences.communication_style && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      {t.members.overview.communicationStyle}
                    </h4>
                    <p className="text-sm text-gray-700">{member.preferences.communication_style}</p>
                  </div>
                )}

                {member.preferences.key_strengths.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.keyStrengths}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {member.preferences.key_strengths.map((strength) => (
                        <span
                          key={strength}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm"
                        >
                          <Sparkles className="w-3 h-3" />
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.preferences.areas_of_sensitivity.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {t.members.overview.areasOfSensitivity}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {member.preferences.areas_of_sensitivity.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.preferences.therapeutic_context && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      {t.members.overview.therapeuticContext}
                    </h4>
                    <p className="text-sm text-gray-700">{member.preferences.therapeutic_context}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-0.5">
                      {t.members.form.preferredContactMethod}
                    </h4>
                    <p className="text-sm font-medium text-gray-700">
                      {t.members.contactMethods[member.preferences.preferred_contact_method]}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-0.5">
                      {t.members.form.preferredSessionFormat}
                    </h4>
                    <p className="text-sm font-medium text-gray-700">
                      {t.members.sessionFormats[member.preferences.preferred_session_format]}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No preferences set yet</p>
                <Button
                  size="sm"
                  onClick={() => setEditingPreferences(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Preferences
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Emergency Contact Section */}
        <motion.div
          ref={emergencyRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-teal-600" />
              </div>
              {t.members.overview.emergencyContact}
            </h3>
            {!editingEmergency && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEmergency(true)}
                className="text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {editingEmergency ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.emergencyName}
                    </label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.emergencyRelationship}
                    </label>
                    <input
                      type="text"
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                      placeholder="e.g., Spouse, Parent"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.emergencyPhone}
                    </label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.emergencyEmail}
                    </label>
                    <input
                      type="email"
                      value={emergencyEmail}
                      onChange={(e) => setEmergencyEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.emergencyNotes}
                  </label>
                  <textarea
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all resize-none text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmergencyName(member.emergency_contact.name || '')
                      setEmergencyRelationship(member.emergency_contact.relationship || '')
                      setEmergencyPhone(member.emergency_contact.phone || '')
                      setEmergencyEmail(member.emergency_contact.email || '')
                      setEmergencyNotes(member.emergency_contact.notes || '')
                      setEditingEmergency(false)
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEmergency}
                    disabled={saving}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </motion.div>
            ) : hasEmergencyData ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    {member.emergency_contact.name && (
                      <p className="font-medium text-gray-900">{member.emergency_contact.name}</p>
                    )}
                    {member.emergency_contact.relationship && (
                      <p className="text-sm text-gray-500">{member.emergency_contact.relationship}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {member.emergency_contact.phone && (
                      <a
                        href={`tel:${member.emergency_contact.phone}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {member.emergency_contact.phone}
                      </a>
                    )}
                    {member.emergency_contact.email && (
                      <a
                        href={`mailto:${member.emergency_contact.email}`}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {member.emergency_contact.email}
                      </a>
                    )}
                  </div>
                </div>
                {member.emergency_contact.notes && (
                  <p className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    {member.emergency_contact.notes}
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-3">No emergency contact added</p>
                <Button
                  size="sm"
                  onClick={() => setEditingEmergency(true)}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Contact
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right Column - Notes */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-violet-600" />
              </div>
              {t.members.overview.recentNotes}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddNote(!showAddNote)}
              className="text-gray-500 hover:text-gray-700 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Add Note Form */}
          <AnimatePresence>
            {showAddNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="bg-gray-50 rounded-xl p-4">
                  <input
                    type="text"
                    placeholder={t.members.notes.noteTitle}
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 mb-3 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm bg-white"
                  />
                  <textarea
                    placeholder={t.members.notes.noteContent}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 mb-3 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm resize-none bg-white"
                  />
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value as NoteType)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none text-sm bg-white"
                    >
                      <option value="general">{t.members.noteTypes.general}</option>
                      <option value="assessment">{t.members.noteTypes.assessment}</option>
                      <option value="treatment_plan">{t.members.noteTypes.treatment_plan}</option>
                      <option value="milestone">{t.members.noteTypes.milestone}</option>
                      <option value="concern">{t.members.noteTypes.concern}</option>
                      <option value="observation">{t.members.noteTypes.observation}</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <Lock className="w-3 h-3" />
                      {t.members.notes.private}
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddNote(false)}
                        className="rounded-lg"
                      >
                        {t.members.form.cancel}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingNote}
                        onClick={handleAddNote}
                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                      >
                        {savingNote ? t.members.form.saving : t.members.notes.save}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes List */}
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{t.members.overview.noNotes}</p>
              <p className="text-xs text-gray-400 mt-1">{t.members.overview.noNotesDescription}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note, index) => {
                const typeStyle = noteTypeColors[note.note_type]
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                          {t.members.noteTypes[note.note_type]}
                        </span>
                        {note.is_private && (
                          <Lock className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {note.title && (
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{note.title}</h4>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2">{note.content}</p>
                  </motion.div>
                )
              })}

              {notes.length >= 5 && (
                <button className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 rounded-lg hover:bg-gray-50 transition-colors">
                  {t.members.overview.allNotes}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
      </div>
    </div>
  )
}
