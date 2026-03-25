'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Check,
  Send,
  FileText,
  BookOpen,
  Table2,
  Puzzle,
  Loader2,
  Users,
  MessageSquare,
  UserPlus,
  Bell,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Resource } from '@/types/resource'

interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url?: string | null
}

interface ShareGroup {
  id: string
  name: string
  color: string
  member_ids: string[]
}

interface ShareResourceModalProps {
  isOpen: boolean
  onClose: () => void
  resource: Resource
  members: SimpleMember[]
  locale: 'en' | 'fr' | 'es'
  onShare: (resourceId: string, memberIds: string[], message?: string) => Promise<void>
  onAddMember?: () => void
  groups?: ShareGroup[]
  alreadySharedMemberIds?: string[]
}

const resourceTypeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  assessment: FileText,
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

const resourceTypeStyles: Record<string, { bg: string; color: string }> = {
  worksheet: { bg: 'bg-blue-50', color: 'text-blue-600' },
  assessment: { bg: 'bg-violet-50', color: 'text-violet-600' },
  exercise: { bg: 'bg-emerald-50', color: 'text-emerald-600' },
  psychoeducation: { bg: 'bg-purple-50', color: 'text-purple-600' },
  table: { bg: 'bg-emerald-50', color: 'text-emerald-600' },
}

const typeLabels: Record<string, { en: string; fr: string; es: string }> = {
  worksheet: { en: 'Worksheet', fr: 'Exercice', es: 'Hoja de trabajo' },
  assessment: { en: 'Assessment', fr: 'Évaluation', es: 'Evaluación' },
  exercise: { en: 'Exercise', fr: 'Exercice', es: 'Ejercicio' },
  psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation', es: 'Psicoeducación' },
  table: { en: 'Table', fr: 'Tableau', es: 'Tabla' },
}

const groupColorDotMap: Record<string, string> = {
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
}

const groupColorBgMap: Record<string, { active: string; inactive: string }> = {
  blue: { active: 'bg-blue-100 text-blue-800 border-blue-200', inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
  emerald: { active: 'bg-emerald-100 text-emerald-800 border-emerald-200', inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
  purple: { active: 'bg-purple-100 text-purple-800 border-purple-200', inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
  amber: { active: 'bg-amber-100 text-amber-800 border-amber-200', inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
  red: { active: 'bg-red-100 text-red-800 border-red-200', inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
  pink: { active: 'bg-pink-100 text-pink-800 border-pink-200', inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
  cyan: { active: 'bg-cyan-100 text-cyan-800 border-cyan-200', inactive: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' },
}

export function ShareResourceModal({
  isOpen,
  onClose,
  resource,
  members,
  locale,
  onShare,
  onAddMember,
  groups,
  alreadySharedMemberIds = [],
}: ShareResourceModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [fetchedSharedIds, setFetchedSharedIds] = useState<string[]>([])

  // Auto-fetch which members already have this resource shared
  useEffect(() => {
    if (!isOpen || !resource?.id) return
    const { createClient } = require('@/lib/supabase/browser-client')
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('member_shared_resources')
        .select('member_id')
        .eq('resource_id', resource.id)
        .eq('practitioner_id', user.id)
      setFetchedSharedIds(data?.map((d: { member_id: string }) => d.member_id) || [])
    })()
  }, [isOpen, resource?.id])

  const sharedIds = alreadySharedMemberIds.length > 0 ? alreadySharedMemberIds : fetchedSharedIds
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)

  const handleSendReminder = async (e: React.MouseEvent, member: SimpleMember) => {
    e.stopPropagation()
    setSendingReminder(member.id)
    try {
      const { createClient } = require('@/lib/supabase/browser-client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get practitioner name
      const { data: practitioner } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const practName = practitioner?.full_name || 'Your practitioner'

      if (member.email) {
        // Call the edge function directly for consistent email design
        await supabase.functions.invoke('send-resource-shared-email', {
          body: {
            type: 'INSERT',
            record: {
              member_id: member.id,
              resource_id: resource.id,
              practitioner_id: user.id,
            },
          },
        })

        toast.success(locale === 'fr' ? 'Rappel envoyé' : 'Reminder sent')
        handleClose()
        return
      } else {
        toast.error(locale === 'fr' ? 'Pas d\'email pour ce membre' : 'No email for this member')
      }
    } catch (err) {
      console.error('Error sending reminder:', err)
      toast.error(locale === 'fr' ? 'Échec de l\'envoi' : 'Failed to send')
    }
    setSendingReminder(null)
  }

  const TypeIcon = resourceTypeIcons[resource.type] || FileText
  const styles = resourceTypeStyles[resource.type] || resourceTypeStyles.worksheet

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const query = searchQuery.toLowerCase()
    return members.filter(member => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
      const email = member.email?.toLowerCase() || ''
      return fullName.includes(query) || email.includes(query)
    })
  }, [members, searchQuery])

  const MAX_SELECTIONS = groups && groups.length > 0 ? 50 : 5

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(memberId)) {
        newSet.delete(memberId)
      } else {
        // Only add if under the limit
        if (newSet.size < MAX_SELECTIONS) {
          newSet.add(memberId)
        }
      }
      return newSet
    })
  }

  const toggleGroup = (group: ShareGroup) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev)
      const groupMemberIds = group.member_ids.filter(id => members.some(m => m.id === id))
      const allSelected = groupMemberIds.every(id => newSet.has(id))

      if (allSelected) {
        // Deselect all group members
        groupMemberIds.forEach(id => newSet.delete(id))
      } else {
        // Select all group members (up to limit)
        groupMemberIds.forEach(id => {
          if (newSet.size < MAX_SELECTIONS) {
            newSet.add(id)
          }
        })
      }
      return newSet
    })
  }

  const handleShare = async () => {
    if (selectedMembers.size === 0) return

    setIsSharing(true)
    try {
      await onShare(resource.id, Array.from(selectedMembers), message.trim() || undefined)
      // Reset and close
      setSelectedMembers(new Set())
      setMessage('')
      setSearchQuery('')
      onClose()
    } catch (error) {
      console.error('Error sharing resource:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleClose = () => {
    setSelectedMembers(new Set())
    setMessage('')
    setSearchQuery('')
    onClose()
  }

  const getInitials = (member: SimpleMember) => {
    return `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          {/* Hide scrollbar style */}
          <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${styles.bg} rounded-xl flex items-center justify-center`}>
                  <Send className={`w-5 h-5 ${styles.color}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Partager la ressource' : locale === 'es' ? 'Compartir recurso' : 'Share Resource'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Sélectionnez les destinataires' : locale === 'es' ? 'Seleccionar destinatarios' : 'Select recipients'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Resource Info */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${styles.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <TypeIcon className={`w-6 h-6 ${styles.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${styles.color} mb-0.5`}>
                    {typeLabels[resource.type]?.[locale]}
                  </p>
                  <h3 className="font-medium text-gray-900 truncate">
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {resource.description?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={locale === 'fr' ? 'Rechercher un patient...' : locale === 'es' ? 'Buscar miembros...' : 'Search members...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm"
                  />
                </div>
                {onAddMember && (
                  <button
                    onClick={onAddMember}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors flex-shrink-0"
                    title={locale === 'fr' ? 'Ajouter un patient' : locale === 'es' ? 'Agregar miembro' : 'Add member'}
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Group Chips */}
            {groups && groups.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2">
                {groups.map((group) => {
                  const groupMemberIds = group.member_ids.filter(id => members.some(m => m.id === id))
                  const allSelected = groupMemberIds.length > 0 && groupMemberIds.every(id => selectedMembers.has(id))
                  const dotColor = groupColorDotMap[group.color] || groupColorDotMap.blue
                  const chipColors = groupColorBgMap[group.color] || groupColorBgMap.blue
                  return (
                    <button
                      key={group.id}
                      onClick={() => toggleGroup(group)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        allSelected ? chipColors.active : chipColors.inactive
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
                      {group.name}
                      <span className="opacity-60">{groupMemberIds.length}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Members List */}
            <div className="max-h-64 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {members.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Aucun patient trouvé' : locale === 'es' ? 'No se encontraron miembros' : 'No members found'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {locale === 'fr' ? 'Ajoutez des patients pour partager des ressources' : locale === 'es' ? 'Agregue miembros para compartir recursos' : 'Add members to share resources'}
                  </p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Aucun résultat' : locale === 'es' ? 'Sin resultados' : 'No results'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Selection info bar */}
                  <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs text-gray-500">
                      {selectedMembers.size}/{MAX_SELECTIONS} {locale === 'fr' ? 'sélectionnés' : locale === 'es' ? 'seleccionados' : 'selected'}
                    </span>
                    {selectedMembers.size > 0 && (
                      <button
                        onClick={() => setSelectedMembers(new Set())}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        {locale === 'fr' ? 'Tout désélectionner' : locale === 'es' ? 'Limpiar todo' : 'Clear all'}
                      </button>
                    )}
                  </div>

                  {/* Member Items */}
                  {filteredMembers.map((member) => {
                    const isSelected = selectedMembers.has(member.id)
                    const isDisabled = !isSelected && selectedMembers.size >= MAX_SELECTIONS
                    const isAlreadyShared = sharedIds.includes(member.id)
                    return (
                      <div
                        key={member.id}
                        onClick={() => !isDisabled && toggleMember(member.id)}
                        className={`w-full flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50' : isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium text-sm flex-shrink-0">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            getInitials(member)
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {member.first_name} {member.last_name}
                            </p>
                            {isAlreadyShared && (
                              <>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-600 flex-shrink-0">
                                  {locale === 'fr' ? 'Déjà partagé' : locale === 'es' ? 'Ya compartido' : 'Shared'}
                                </span>
                                <button
                                  onClick={(e) => handleSendReminder(e, member)}
                                  disabled={sendingReminder === member.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors flex-shrink-0 flex items-center gap-1"
                                >
                                  {sendingReminder === member.id ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Bell className="w-2.5 h-2.5" />
                                  )}
                                  {locale === 'fr' ? 'Rappel' : locale === 'es' ? 'Recordar' : 'Remind'}
                                </button>
                              </>
                            )}
                          </div>
                          {member.email && (
                            <p className="text-xs text-gray-500 truncate">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                {locale === 'fr' ? 'Message (optionnel)' : locale === 'es' ? 'Mensaje (opcional)' : 'Message (optional)'}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={locale === 'fr' ? 'Ajoutez un message personnalisé...' : locale === 'es' ? 'Agregue un mensaje personal...' : 'Add a personal message...'}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none transition-all text-sm resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-500">
                {selectedMembers.size > 0 ? (
                  <>
                    {selectedMembers.size} {locale === 'fr' ? 'sélectionné(s)' : locale === 'es' ? 'seleccionado(s)' : 'selected'}
                  </>
                ) : (
                  locale === 'fr' ? 'Aucun sélectionné' : locale === 'es' ? 'Ninguno seleccionado' : 'None selected'
                )}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="rounded-xl"
                >
                  {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleShare}
                  disabled={selectedMembers.size === 0 || isSharing}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-5"
                >
                  {isSharing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {locale === 'fr' ? 'Envoi...' : locale === 'es' ? 'Enviando...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Envoyer' : locale === 'es' ? 'Enviar' : 'Send'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
