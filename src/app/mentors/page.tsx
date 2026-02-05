'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Mail,
  Calendar,
  MessageCircle,
  ChevronLeft,
  Loader2,
  Star,
  FileText,
  Crown,
  ExternalLink,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import MemberLayout from '@/components/member/MemberLayout'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import {
  getAllMemberRecords,
  getMemberPractitioner,
  type PractitionerProfile
} from '@/lib/services/member-resources'
import type { Member } from '@/types/member'

interface MentorWithMember extends PractitionerProfile {
  memberId: string
  isPrimary: boolean
}

export default function MentorsPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mentors, setMentors] = useState<MentorWithMember[]>([])

  useEffect(() => {
    fetchMentors()
  }, [])

  const fetchMentors = async () => {
    try {
      // Get all member records for this user (each has a practitioner)
      const memberRecords = await getAllMemberRecords()
      console.log('Member records:', memberRecords)

      if (memberRecords.length === 0) {
        setLoading(false)
        return
      }

      // Fetch practitioner details for each member record
      const mentorsList: MentorWithMember[] = []

      for (let i = 0; i < memberRecords.length; i++) {
        const member = memberRecords[i]
        const practitioner = await getMemberPractitioner(member.practitioner_id)
        console.log('Practitioner for member', member.id, ':', practitioner)

        if (practitioner) {
          mentorsList.push({
            ...practitioner,
            memberId: member.id,
            isPrimary: i === 0, // First one is primary
          })
        }
      }

      setMentors(mentorsList)
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">{locale === 'fr' ? 'Retour' : locale === 'es' ? 'Volver' : 'Back'}</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {locale === 'fr' ? 'Mes Mentors' : locale === 'es' ? 'Mis Mentores' : 'My Mentors'}
          </h1>
          <p className="text-gray-500">
            {locale === 'fr'
              ? 'Vos accompagnants bien-être'
              : locale === 'es'
                ? 'Tus profesionales de bienestar'
                : 'Your wellness practitioners'}
          </p>
        </motion.div>

        {/* Mentors List */}
        {mentors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 rounded-3xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'fr' ? 'Aucun mentor' : locale === 'es' ? 'Aún no hay mentores' : 'No mentors yet'}
            </h3>
            <p className="text-gray-500">
              {locale === 'fr'
                ? 'Vous n\'avez pas encore de mentor assigné'
                : locale === 'es'
                  ? 'Aún no tienes mentores asignados'
                  : 'You don\'t have any assigned mentors yet'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {mentors.map((mentor, idx) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Header with gradient */}
                <div className={`p-6 text-white ${
                  mentor.isPrimary
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600'
                }`}>
                  {/* Primary Badge */}
                  {mentor.isPrimary && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Crown className="w-4 h-4 text-amber-300" />
                      <span className="text-xs font-medium text-white/90">
                        {locale === 'fr' ? 'Mentor principal' : locale === 'es' ? 'Mentor principal' : 'Primary Mentor'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {mentor.avatar_url ? (
                        <img
                          src={mentor.avatar_url}
                          alt={mentor.full_name || ''}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold">
                          {(mentor.full_name || 'M').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{mentor.full_name || 'Mentor'}</h3>
                      {mentor.headline && (
                        <p className="text-white/70 text-sm">{mentor.headline}</p>
                      )}
                      {mentor.specialties && mentor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mentor.specialties.slice(0, 2).map((spec, i) => (
                            <span key={i} className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Credentials */}
                  {mentor.credentials && mentor.credentials.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {mentor.credentials.map((cred, i) => (
                        <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                          {cred}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Info */}
                  {mentor.email && (
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-sm">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          mentor.isPrimary ? 'bg-purple-50' : 'bg-teal-50'
                        }`}>
                          <Mail className={`w-4 h-4 ${
                            mentor.isPrimary ? 'text-purple-600' : 'text-teal-600'
                          }`} />
                        </div>
                        <span className="text-gray-600">{mentor.email}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {/* View Profile Button */}
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-gray-200 hover:bg-gray-50"
                      onClick={() => router.push(`/p/${mentor.slug || mentor.id}`)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Voir le profil' : locale === 'es' ? 'Ver perfil' : 'View Profile'}
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => mentor.email && (window.location.href = `mailto:${mentor.email}`)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Message' : locale === 'es' ? 'Mensaje' : 'Message'}
                      </Button>
                      <Button
                        className={`flex-1 rounded-xl ${
                          mentor.isPrimary
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-teal-600 hover:bg-teal-700'
                        }`}
                        onClick={() => router.push(`/p/${mentor.slug || mentor.id}/book`)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Réserver' : locale === 'es' ? 'Reservar' : 'Book'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-5 border border-teal-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                {locale === 'fr' ? 'Besoin d\'aide ?' : locale === 'es' ? '¿Necesitas ayuda?' : 'Need help?'}
              </h4>
              <p className="text-sm text-gray-600">
                {locale === 'fr'
                  ? 'Vos mentors sont là pour vous accompagner dans votre parcours de bien-être.'
                  : locale === 'es'
                    ? 'Tus mentores están aquí para apoyarte en tu camino de bienestar.'
                    : 'Your mentors are here to support you on your wellness journey.'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MemberLayout>
  )
}
