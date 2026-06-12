'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  AlertCircle,
  Users,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhoneInput } from '@/components/ui/phone-input'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type {
  MemberStatus,
  EngagementLevel,
  EmergencyContact,
} from '@/types/member'

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { t, locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'emergency'>('basic')

  // Basic info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState<MemberStatus>('active')
  const [engagementLevel, setEngagementLevel] = useState<EngagementLevel>('medium')

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyEmail, setEmergencyEmail] = useState('')
  const [emergencyNotes, setEmergencyNotes] = useState('')

  useEffect(() => {
    fetchMember()
  }, [resolvedParams.id])

  const fetchMember = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('practitioner_id', user.id)
        .single()

      if (error) throw error

      if (!data) {
        router.push('/members')
        return
      }

      // Populate form fields
      setFirstName(data.first_name)
      setLastName(data.last_name)
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setDateOfBirth(data.date_of_birth || '')
      setStatus(data.status)
      setEngagementLevel(data.engagement_level)

      // Emergency Contact
      setEmergencyName(data.emergency_contact?.name || '')
      setEmergencyRelationship(data.emergency_contact?.relationship || '')
      setEmergencyPhone(data.emergency_contact?.phone || '')
      setEmergencyEmail(data.emergency_contact?.email || '')
      setEmergencyNotes(data.emergency_contact?.notes || '')
    } catch (error) {
      console.error('Error fetching member:', error)
      toast.error(t.members.errors.loadFailed)
      router.push('/members')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim() || !lastName.trim()) {
      toast.error(locale === 'fr' ? 'Le prénom et le nom sont requis' : 'First name and last name are required')
      return
    }

    setSaving(true)

    try {
      const emergencyContact: EmergencyContact = {
        name: emergencyName || null,
        relationship: emergencyRelationship || null,
        phone: emergencyPhone || null,
        email: emergencyEmail || null,
        notes: emergencyNotes || null,
      }

      const { error } = await supabase
        .from('members')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          date_of_birth: dateOfBirth || null,
          status,
          engagement_level: engagementLevel,
          emergency_contact: emergencyContact,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resolvedParams.id)

      if (error) throw error

      toast.success(t.members.success.memberUpdated)
      router.push(`/members/${resolvedParams.id}`)
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error(t.members.errors.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'basic', label: t.members.form.basicInfo, icon: User },
    { id: 'emergency', label: t.members.form.emergencyContact, icon: Shield },
  ] as const

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-100 via-white to-teal-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Members', labelFr: 'Membres', href: '/members', icon: <Users className="w-4 h-4" /> },
              { label: `${firstName} ${lastName}`.trim() || 'Member', href: `/members/${resolvedParams.id}` },
              { label: 'Edit', labelFr: 'Modifier', icon: <Edit className="w-4 h-4" /> },
            ]}
          />
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.members.form.editTitle}
          </h1>
          <p className="text-gray-500">
            {t.members.subtitle}
          </p>
        </motion.div>

        {/* Section Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 mb-6">
          <div className="flex gap-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-lavender-100 text-lavender-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          {activeSection === 'basic' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-lavender-500" />
                {t.members.form.basicInfo}
              </h2>

              <div className="space-y-5">
                {/* Name Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.firstName} *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.lastName} *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Contact Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Mail className="w-4 h-4 inline mr-1.5" />
                      {t.members.form.email}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Phone className="w-4 h-4 inline mr-1.5" />
                      {t.members.form.phone}
                    </label>
                    <PhoneInput
                      value={phone}
                      onChange={(v) => setPhone(v)}
                    />
                  </div>
                </div>

                {/* DOB and Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Calendar className="w-4 h-4 inline mr-1.5" />
                      {t.members.form.dateOfBirth}
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.status}
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as MemberStatus)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all bg-white"
                    >
                      <option value="active">{t.members.status.active}</option>
                      <option value="inactive">{t.members.status.inactive}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.list.engagement}
                    </label>
                    <select
                      value={engagementLevel}
                      onChange={(e) => setEngagementLevel(e.target.value as EngagementLevel)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all bg-white"
                    >
                      <option value="low">{t.members.engagement.low}</option>
                      <option value="medium">{t.members.engagement.medium}</option>
                      <option value="high">{t.members.engagement.high}</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Emergency Contact Section */}
          {activeSection === 'emergency' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-mint-600" />
                {t.members.form.emergencyContact}
              </h2>
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                This information is important for client safety
              </p>

              <div className="space-y-5">
                {/* Name and Relationship */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t.members.form.emergencyName}
                    </label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </div>

                {/* Phone and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Phone className="w-4 h-4 inline mr-1.5" />
                      {t.members.form.emergencyPhone}
                    </label>
                    <PhoneInput
                      value={emergencyPhone}
                      onChange={(v) => setEmergencyPhone(v)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Mail className="w-4 h-4 inline mr-1.5" />
                      {t.members.form.emergencyEmail}
                    </label>
                    <input
                      type="email"
                      value={emergencyEmail}
                      onChange={(e) => setEmergencyEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.members.form.emergencyNotes}
                  </label>
                  <textarea
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    placeholder="Any additional notes about the emergency contact..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between mt-6">
            <Link href={`/members/${resolvedParams.id}`}>
              <Button type="button" variant="ghost" className="text-gray-600">
                {t.members.form.cancel}
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              {activeSection === 'basic' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveSection('emergency')}
                >
                  Next
                </Button>
              )}
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white shadow-lg shadow-lavender-200/50"
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
          </div>
        </form>
      </div>
    </div>
  )
}
