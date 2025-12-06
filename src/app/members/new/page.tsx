'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Shield,
  Save,
  X,
  Plus,
  Heart,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type {
  SessionFormat,
  MemberPreferences,
  EmergencyContact,
} from '@/types/member'

type ContactMethod = 'email' | 'phone' | 'text'

export default function NewMemberPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'preferences' | 'emergency'>('basic')

  // Basic info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  // Preferences
  const [communicationStyle, setCommunicationStyle] = useState('')
  const [keyStrengths, setKeyStrengths] = useState<string[]>([])
  const [strengthInput, setStrengthInput] = useState('')
  const [areasOfSensitivity, setAreasOfSensitivity] = useState<string[]>([])
  const [sensitivityInput, setSensitivityInput] = useState('')
  const [therapeuticContext, setTherapeuticContext] = useState('')
  const [preferredContactMethod, setPreferredContactMethod] = useState<ContactMethod>('email')
  const [preferredSessionFormat, setPreferredSessionFormat] = useState<SessionFormat>('in_person')

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyEmail, setEmergencyEmail] = useState('')
  const [emergencyNotes, setEmergencyNotes] = useState('')

  const handleAddStrength = () => {
    if (strengthInput.trim() && !keyStrengths.includes(strengthInput.trim())) {
      setKeyStrengths([...keyStrengths, strengthInput.trim()])
      setStrengthInput('')
    }
  }

  const handleRemoveStrength = (strength: string) => {
    setKeyStrengths(keyStrengths.filter(s => s !== strength))
  }

  const handleAddSensitivity = () => {
    if (sensitivityInput.trim() && !areasOfSensitivity.includes(sensitivityInput.trim())) {
      setAreasOfSensitivity([...areasOfSensitivity, sensitivityInput.trim()])
      setSensitivityInput('')
    }
  }

  const handleRemoveSensitivity = (area: string) => {
    setAreasOfSensitivity(areasOfSensitivity.filter(a => a !== area))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('First name, last name, and email are required')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      const preferences: MemberPreferences = {
        communication_style: communicationStyle || null,
        key_strengths: keyStrengths,
        areas_of_sensitivity: areasOfSensitivity,
        therapeutic_context: therapeuticContext || null,
        preferred_contact_method: preferredContactMethod,
        preferred_session_format: preferredSessionFormat,
      }

      const emergencyContact: EmergencyContact = {
        name: emergencyName || null,
        relationship: emergencyRelationship || null,
        phone: emergencyPhone || null,
        email: emergencyEmail || null,
        notes: emergencyNotes || null,
      }

      const memberData = {
        practitioner_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        date_of_birth: dateOfBirth || null,
        status: 'pending' as const, // Always pending until member creates their account
        internal_notes: internalNotes.trim() || null,
        preferences,
        emergency_contact: emergencyContact,
        engagement_level: 'medium' as const,
      }

      const { data, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()

      if (error) {
        console.error('Supabase error:', error.message, error.details, error.hint, error.code)
        throw new Error(error.message)
      }

      console.log('Member created:', data)
      toast.success(t.members.success.memberCreated)
      router.push('/members')
    } catch (error) {
      console.error('Error creating member:', error)
      toast.error(error instanceof Error ? error.message : t.members.errors.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'basic', label: t.members.form.basicInfo, icon: User, description: 'Name, contact & status' },
    { id: 'preferences', label: t.members.form.preferences, icon: Heart, description: 'Communication style & strengths' },
    { id: 'emergency', label: t.members.form.emergencyContact, icon: Shield, description: 'Safety information' },
  ] as const

  const getSectionCompletion = (sectionId: string) => {
    if (sectionId === 'basic') {
      return firstName && lastName && email ? 'complete' : firstName || lastName || email || phone ? 'partial' : 'empty'
    }
    if (sectionId === 'preferences') {
      return communicationStyle || keyStrengths.length > 0 ? 'partial' : 'empty'
    }
    if (sectionId === 'emergency') {
      return emergencyName || emergencyPhone ? 'partial' : 'empty'
    }
    return 'empty'
  }

  return (
    <div className="min-h-screen gradient-mesh relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-lavender-300/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-mint-300/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-coral-300/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="/members">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 glass-subtle hover:bg-white/60 rounded-xl transition-smooth">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.members.form.cancel}
            </Button>
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/40 to-mint-400/40 rounded-2xl blur-lg" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-500 to-lavender-600 flex items-center justify-center shadow-lg shadow-lavender-300/50">
                <User className="w-7 h-7 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t.members.form.addTitle}
              </h1>
              <p className="text-gray-500">
                {t.members.subtitle}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-2 mb-6"
        >
          <div className="flex gap-2">
            {sections.map((section, index) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              const completion = getSectionCompletion(section.id)
              return (
                <motion.button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-medium transition-smooth ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-white/60'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute inset-0 bg-gradient-to-r from-lavender-500 to-lavender-600 rounded-xl shadow-lg shadow-lavender-300/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {completion === 'complete' && !isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <span className="hidden sm:inline">{section.label}</span>
                  </span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          {sections.map((section, index) => (
            <div key={section.id} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  activeSection === section.id
                    ? 'bg-lavender-500 scale-125'
                    : getSectionCompletion(section.id) !== 'empty'
                    ? 'bg-lavender-300'
                    : 'bg-gray-200'
                }`}
              />
              {index < sections.length - 1 && (
                <div className={`w-12 h-0.5 ${
                  getSectionCompletion(section.id) !== 'empty' ? 'bg-lavender-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <AnimatePresence mode="wait">
            {activeSection === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-3xl p-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-lavender-600" />
                  </div>
                  {t.members.form.basicInfo}
                </h2>

                <div className="space-y-5">
                  {/* Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.members.form.firstName} *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.members.form.lastName} *
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Contact Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-lavender-500" />
                        {t.members.form.email} *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-mint-500" />
                        {t.members.form.phone}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-coral-500" />
                      {t.members.form.dateOfBirth}
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-lavender-500" />
                      {t.members.form.internalNotes}
                    </label>
                    <textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder={t.members.form.internalNotesPlaceholder}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all resize-none bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-3xl p-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-100 to-coral-200 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-coral-600" />
                  </div>
                  {t.members.form.preferences}
                </h2>

                <div className="space-y-5">
                  {/* Communication Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.members.form.communicationStyle}
                    </label>
                    <textarea
                      value={communicationStyle}
                      onChange={(e) => setCommunicationStyle(e.target.value)}
                      placeholder={t.members.form.communicationStylePlaceholder}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all resize-none bg-white/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* Key Strengths */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      {t.members.form.keyStrengths}
                    </label>
                    <div className="flex gap-2 mb-3">
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
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      />
                      <Button
                        type="button"
                        onClick={handleAddStrength}
                        className="glass-subtle border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl px-4"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {keyStrengths.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {keyStrengths.map((strength) => (
                          <motion.span
                            key={strength}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-mint-50 text-emerald-700 text-sm border border-emerald-200/50 shadow-sm"
                          >
                            <Sparkles className="w-3 h-3" />
                            {strength}
                            <button
                              type="button"
                              onClick={() => handleRemoveStrength(strength)}
                              className="ml-1 hover:text-emerald-900 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Areas of Sensitivity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-amber-500" />
                      {t.members.form.areasOfSensitivity}
                    </label>
                    <div className="flex gap-2 mb-3">
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
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      />
                      <Button
                        type="button"
                        onClick={handleAddSensitivity}
                        className="glass-subtle border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl px-4"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {areasOfSensitivity.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {areasOfSensitivity.map((area) => (
                          <motion.span
                            key={area}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-peach-50 text-amber-700 text-sm border border-amber-200/50 shadow-sm"
                          >
                            <Heart className="w-3 h-3" />
                            {area}
                            <button
                              type="button"
                              onClick={() => handleRemoveSensitivity(area)}
                              className="ml-1 hover:text-amber-900 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Therapeutic Context */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.members.form.therapeuticContext}
                    </label>
                    <textarea
                      value={therapeuticContext}
                      onChange={(e) => setTherapeuticContext(e.target.value)}
                      placeholder={t.members.form.therapeuticContextPlaceholder}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all resize-none bg-white/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* Contact and Session Preferences */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.members.form.preferredContactMethod}
                      </label>
                      <select
                        value={preferredContactMethod}
                        onChange={(e) => setPreferredContactMethod(e.target.value as ContactMethod)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      >
                        <option value="email">{t.members.contactMethods.email}</option>
                        <option value="phone">{t.members.contactMethods.phone}</option>
                        <option value="text">{t.members.contactMethods.text}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.members.form.preferredSessionFormat}
                      </label>
                      <select
                        value={preferredSessionFormat}
                        onChange={(e) => setPreferredSessionFormat(e.target.value as SessionFormat)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      >
                        <option value="in_person">{t.members.sessionFormats.in_person}</option>
                        <option value="virtual">{t.members.sessionFormats.virtual}</option>
                        <option value="phone">{t.members.sessionFormats.phone}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Emergency Contact Section */}
            {activeSection === 'emergency' && (
              <motion.div
                key="emergency"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card rounded-3xl p-8"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-100 to-mint-200 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-mint-600" />
                  </div>
                  {t.members.form.emergencyContact}
                </h2>
                <p className="text-sm text-gray-500 mb-6 ml-13 flex items-center gap-2 glass-subtle px-4 py-2 rounded-xl inline-block">
                  <Shield className="w-4 h-4 text-mint-500" />
                  This information is important for client safety
                </p>

                <div className="space-y-5">
                  {/* Name and Relationship */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.members.form.emergencyName}
                      </label>
                      <input
                        type="text"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.members.form.emergencyRelationship}
                      </label>
                      <input
                        type="text"
                        value={emergencyRelationship}
                        onChange={(e) => setEmergencyRelationship(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                        placeholder="e.g., Spouse, Parent, Sibling"
                      />
                    </div>
                  </div>

                  {/* Phone and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-mint-500" />
                        {t.members.form.emergencyPhone}
                      </label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-lavender-500" />
                        {t.members.form.emergencyEmail}
                      </label>
                      <input
                        type="email"
                        value={emergencyEmail}
                        onChange={(e) => setEmergencyEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.members.form.emergencyNotes}
                    </label>
                    <textarea
                      value={emergencyNotes}
                      onChange={(e) => setEmergencyNotes(e.target.value)}
                      placeholder="Any additional notes about the emergency contact..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none transition-all resize-none bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-8"
          >
            <Link href="/members">
              <Button type="button" variant="ghost" className="text-gray-600 glass-subtle hover:bg-white/60 rounded-xl">
                {t.members.form.cancel}
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              {activeSection !== 'emergency' && (
                <Button
                  type="button"
                  onClick={() => {
                    if (activeSection === 'basic') setActiveSection('preferences')
                    else if (activeSection === 'preferences') setActiveSection('emergency')
                  }}
                  className="glass-subtle border border-lavender-200 text-lavender-700 hover:bg-lavender-50 rounded-xl"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white shadow-lg shadow-lavender-300/50 rounded-xl px-6 transition-smooth hover-lift"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t.members.form.saving}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t.members.form.save}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
