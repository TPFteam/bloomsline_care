'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Camera,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Edit2,
  Check,
  X,
  Trash2,
} from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { LoadingDots } from '@/components/ui/loading-dots'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'

interface MemberProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  avatar_url?: string
  created_at: string
}

export default function MemberProfilePage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '' })

  const t = {
    en: {
      title: 'Profile',
      personalInfo: 'Personal Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      notProvided: 'Not provided',
      memberSince: 'Member since',
      changePhoto: 'Change photo',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      saving: 'Saving...',
      photoUpdated: 'Photo updated',
      photoRemoved: 'Photo removed',
      profileUpdated: 'Profile updated',
      errorUpdating: 'Error updating profile',
      removePhoto: 'Remove photo',
    },
    fr: {
      title: 'Profil',
      personalInfo: 'Informations Personnelles',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      notProvided: 'Non fourni',
      memberSince: 'Membre depuis',
      changePhoto: 'Changer la photo',
      edit: 'Modifier',
      save: 'Enregistrer',
      cancel: 'Annuler',
      saving: 'Enregistrement...',
      photoUpdated: 'Photo mise à jour',
      photoRemoved: 'Photo supprimée',
      profileUpdated: 'Profil mis à jour',
      errorUpdating: 'Erreur lors de la mise à jour',
      removePhoto: 'Supprimer la photo',
    },
  }

  const text = locale === 'fr' ? t.fr : t.en

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data: member } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone, avatar_url, created_at')
        .eq('user_id', user.id)
        .single()

      if (member) {
        const profileData = {
          ...member,
          email: user.email || '',
        }
        setProfile(profileData)
        setEditForm({
          first_name: member.first_name || '',
          last_name: member.last_name || '',
          phone: member.phone || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success(text.photoUpdated)
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error(text.errorUpdating)
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!profile || !profile.avatar_url) return

    setRemoving(true)
    try {
      // Update database to remove avatar_url
      const { error: updateError } = await supabase
        .from('members')
        .update({ avatar_url: null })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: undefined })
      toast.success(text.photoRemoved)
    } catch (error) {
      console.error('Error removing photo:', error)
      toast.error(text.errorUpdating)
    } finally {
      setRemoving(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone || null,
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone,
      })
      setEditing(false)
      toast.success(text.profileUpdated)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(text.errorUpdating)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getInitials = () => {
    if (!profile) return '?'
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
  }

  if (loading) {
    return (
      <MemberLayout>
        <LoadingDots fullScreen />
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">{text.title}</h1>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {text.edit}
              </button>
            )}
          </div>
        </motion.div>

        {/* Profile Photo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials()
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {text.changePhoto}
            </button>
            {profile?.avatar_url && (
              <>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleRemovePhoto}
                  disabled={uploading || removing}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  {removing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : null}
                  {text.removePhoto}
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{text.personalInfo}</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {/* First Name */}
            <div className="px-5 py-4">
              <label className="text-sm text-gray-500 mb-1 block">{text.firstName}</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="font-medium text-gray-900">{profile?.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="px-5 py-4">
              <label className="text-sm text-gray-500 mb-1 block">{text.lastName}</label>
              {editing ? (
                <input
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <p className="font-medium text-gray-900">{profile?.last_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="px-5 py-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">{text.email}</label>
                <p className="font-medium text-gray-900">{profile?.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="px-5 py-4 flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">{text.phone}</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder={text.notProvided}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                ) : (
                  <p className={`font-medium ${profile?.phone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {profile?.phone || text.notProvided}
                  </p>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="px-5 py-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <label className="text-sm text-gray-500 mb-1 block">{text.memberSince}</label>
                <p className="font-medium text-gray-900">
                  {profile?.created_at ? formatDate(profile.created_at) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setEditing(false)
                  setEditForm({
                    first_name: profile?.first_name || '',
                    last_name: profile?.last_name || '',
                    phone: profile?.phone || '',
                  })
                }}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {text.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-medium text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {saving ? text.saving : text.save}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </MemberLayout>
  )
}
