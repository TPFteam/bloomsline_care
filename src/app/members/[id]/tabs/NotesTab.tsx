'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Trash2,
  Lock,
  ImagePlus,
  Pencil,
  Calendar,
  ChevronDown,
  LinkIcon,
  FileText,
  Search,
  BookOpen,
  List,
  Send,
  CornerDownLeft,
  Sparkles,
  Loader2,
  Save,
  ScanLine,
  Check,
  Target,
  Video,
  Phone,
  User,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { ProgressNote, NoteType, Session as MemberSession, Member } from '@/types/member'
import { DEFAULT_NOTE_TYPES, FIXED_NOTE_TYPES, DELETABLE_DEFAULT_NOTE_TYPES } from '@/types/member'
import type { PromptKey } from '@/lib/assist/prompts'
import { MarkdownRenderer } from '@/components/notes/MarkdownRenderer'
import { RichTextEditor } from '@/components/notes/RichTextEditor'

interface NotesTabProps {
  memberId: string
  sessions: MemberSession[]
  notes: ProgressNote[]
  onNotesUpdate: () => void
  member?: Member
}

type ViewMode = 'browse' | 'notepad'
type NoteFilter = 'all' | 'session' | 'general' | 'goal'
type NotepadSubTab = 'quick' | 'session'

interface AssistMessage {
  id: string
  promptKey: PromptKey
  response: string
  createdAt: string
  saved?: boolean
  editing?: boolean
}

const ASSIST_PROMPT_KEYS: PromptKey[] = [
  'summarize_session',
  'key_themes',
  'focus_next',
  'session_reflection',
  'note_suggestions',
]

const noteTypeColors: Record<string, { bg: string; text: string }> = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700' },
  symptome: { bg: 'bg-rose-50', text: 'text-rose-700' },
  recurrence: { bg: 'bg-purple-50', text: 'text-purple-700' },
  hypothese: { bg: 'bg-teal-50', text: 'text-teal-700' },
  transfert: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  contre_transfert: { bg: 'bg-pink-50', text: 'text-pink-700' },
  ajustement_envisage: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  milestone: { bg: 'bg-green-50', text: 'text-green-700' },
}
const extraColorPool = [
  { bg: 'bg-amber-50', text: 'text-amber-700' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700' },
  { bg: 'bg-orange-50', text: 'text-orange-700' },
  { bg: 'bg-lime-50', text: 'text-lime-700' },
  { bg: 'bg-sky-50', text: 'text-sky-700' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700' },
  { bg: 'bg-violet-50', text: 'text-violet-700' },
  { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  { bg: 'bg-red-50', text: 'text-red-700' },
  { bg: 'bg-blue-50', text: 'text-blue-700' },
]
const dynamicColorCache: Record<string, { bg: string; text: string }> = {}
let colorIndex = 0
const getNoteColor = (type: string) => {
  if (noteTypeColors[type]) return noteTypeColors[type]
  if (!dynamicColorCache[type]) {
    dynamicColorCache[type] = extraColorPool[colorIndex % extraColorPool.length]
    colorIndex++
  }
  return dynamicColorCache[type]
}

const defaultNoteTypes: readonly string[] = DEFAULT_NOTE_TYPES
const fixedNoteTypes: readonly string[] = FIXED_NOTE_TYPES
const deletableDefaults: readonly string[] = DELETABLE_DEFAULT_NOTE_TYPES

export default function NotesTab({ memberId, sessions, notes: initialNotes, onNotesUpdate, member }: NotesTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editImageInputRef = useRef<HTMLInputElement>(null)
  const notepadInputRef = useRef<HTMLTextAreaElement>(null)
  const notepadStreamRef = useRef<HTMLDivElement>(null)
  const notepadImageInputRef = useRef<HTMLInputElement>(null)

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('notepad')

  // All notes (fetched without limit)
  const [allNotes, setAllNotes] = useState<ProgressNote[]>(initialNotes)
  const [loading, setLoading] = useState(true)

  // Milestones for linking
  const [milestones, setMilestones] = useState<{ id: string; title: string; status: string }[]>([])

  // Custom note types
  const [customNoteTypes, setCustomNoteTypes] = useState<string[]>([])
  const [hiddenDefaults, setHiddenDefaults] = useState<string[]>([])
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false)
  const [customTypeValue, setCustomTypeValue] = useState('')
  const customTypeInputRef = useRef<HTMLInputElement>(null)
  const [customTypeMenu, setCustomTypeMenu] = useState<{ type: string; x: number; y: number } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [renamingType, setRenamingType] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const customTypeMenuRef = useRef<HTMLDivElement>(null)
  const longPressTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const visibleDefaults = defaultNoteTypes.filter(t => !hiddenDefaults.includes(t))
  const allNoteTypes = [...visibleDefaults, ...customNoteTypes]

  // ==============================
  // NOTEPAD MODE STATE
  // ==============================
  const [padSessionId, setPadSessionId] = useState<string>('')
  const [padMilestoneId, setPadMilestoneId] = useState<string>('')
  const [padNoteType, setPadNoteType] = useState<NoteType>('general')
  const [padInput, setPadInput] = useState('')
  const [padSaving, setPadSaving] = useState(false)
  const [padImages, setPadImages] = useState<File[]>([])
  const [padImagePreviews, setPadImagePreviews] = useState<string[]>([])

  // ==============================
  // BLOOM ASSIST STATE
  // ==============================
  const [assistMessages, setAssistMessages] = useState<AssistMessage[]>([])
  const [assistLoading, setAssistLoading] = useState(false)
  const [showAssistMenu, setShowAssistMenu] = useState(false)
  const assistMenuRef = useRef<HTMLDivElement>(null)

  // ==============================
  // IMAGE TEXT EXTRACTION STATE
  // ==============================
  const [extractingText, setExtractingText] = useState<number | null>(null) // index of image being extracted
  const [extractedIndex, setExtractedIndex] = useState<number | null>(null) // brief checkmark display

  // ==============================
  // SUB-TAB STATE
  // ==============================
  const [notepadSubTab, setNotepadSubTab] = useState<NotepadSubTab>('quick')

  // ==============================
  // SESSION NOTES SUB-TAB STATE
  // ==============================
  const [snSelectedSessionId, setSnSelectedSessionId] = useState<string>('')
  const [snSummaryDraft, setSnSummaryDraft] = useState('')
  const [snSavingSummary, setSnSavingSummary] = useState(false)
  const [snSessionSummaryNotes, setSnSessionSummaryNotes] = useState<Record<string, { id: string; content: string; created_at: string } | null>>({})
  const [snEditorNoteTypes, setSnEditorNoteTypes] = useState<{ type: string; label: string }[]>([])
  const [snIsEditing, setSnIsEditing] = useState(false)
  const [snShowPast, setSnShowPast] = useState(false)

  // ==============================
  // BROWSE MODE STATE
  // ==============================
  // Add note form state
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [isPrivate, setIsPrivate] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('')
  const [noteImages, setNoteImages] = useState<File[]>([])
  const [noteImagePreviews, setNoteImagePreviews] = useState<string[]>([])
  const [savingNote, setSavingNote] = useState(false)

  // Edit note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editNoteType, setEditNoteType] = useState<NoteType>('general')
  const [editIsPrivate, setEditIsPrivate] = useState(true)
  const [editSessionId, setEditSessionId] = useState<string>('')
  const [editMilestoneId, setEditMilestoneId] = useState<string>('')
  const [editImages, setEditImages] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)

  // Filter state
  const [noteFilter, setNoteFilter] = useState<NoteFilter>('all')
  const [filterSessionId, setFilterSessionId] = useState<string>('')
  const [filterMilestoneId, setFilterMilestoneId] = useState<string>('')
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Delete confirmation
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  // ==============================
  // SHARED LOGIC
  // ==============================

  const fetchAllNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('progress_notes')
        .select('*, milestones(title)')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setAllNotes(data)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllNotes()
  }, [memberId])

  // Fetch milestones for linking
  useEffect(() => {
    supabase
      .from('milestones')
      .select('id, title, status')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMilestones(data) })
  }, [memberId])

  // Fetch custom note types + hidden defaults from DB + derive from existing notes
  useEffect(() => {
    const fetchCustomTypes = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('custom_note_types')
        .select('type_name')
        .eq('practitioner_id', user.id)
        .order('created_at')

      const allSaved = data?.map(d => d.type_name) || []

      // Separate hidden defaults from custom types
      const hidden = allSaved.filter(t => t.startsWith('_hidden:')).map(t => t.replace('_hidden:', ''))
      const saved = allSaved.filter(t => !t.startsWith('_hidden:'))

      setHiddenDefaults(hidden)

      setCustomNoteTypes(saved)
    }
    fetchCustomTypes()
  }, [memberId, allNotes])

  const saveCustomType = async (typeName: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('custom_note_types').upsert(
      { practitioner_id: user.id, type_name: typeName },
      { onConflict: 'practitioner_id,type_name' }
    )
  }

  const deleteNoteType = async (typeName: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if ((deletableDefaults as readonly string[]).includes(typeName)) {
      // Hide a deletable default by storing _hidden: marker
      await supabase.from('custom_note_types').upsert(
        { practitioner_id: user.id, type_name: `_hidden:${typeName}` },
        { onConflict: 'practitioner_id,type_name' }
      )
      setHiddenDefaults(prev => [...prev, typeName])
    } else {
      // Delete a custom type
      await supabase.from('custom_note_types')
        .delete()
        .eq('practitioner_id', user.id)
        .eq('type_name', typeName)
      setCustomNoteTypes(prev => prev.filter(t => t !== typeName))
    }

    if (padNoteType === typeName) setPadNoteType('general')
    setCustomTypeMenu(null)
    toast.success(locale === 'fr' ? 'Type supprimé' : 'Type deleted')
  }

  const renameCustomType = async (oldName: string, newName: string) => {
    const val = newName.trim().toLowerCase().replace(/\s+/g, '_')
    if (!val || val === oldName) { setRenamingType(null); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update the saved type
    await supabase.from('custom_note_types')
      .update({ type_name: val })
      .eq('practitioner_id', user.id)
      .eq('type_name', oldName)

    // Update all notes that used the old type
    await supabase.from('progress_notes')
      .update({ note_type: val })
      .eq('practitioner_id', user.id)
      .eq('note_type', oldName)

    setCustomNoteTypes(prev => prev.map(t => t === oldName ? val : t))
    if (padNoteType === oldName) setPadNoteType(val)
    setRenamingType(null)
    setCustomTypeMenu(null)
    onNotesUpdate()
    toast.success(locale === 'fr' ? 'Type renommé' : 'Type renamed')
  }

  // Close custom type menu on outside click
  useEffect(() => {
    if (!customTypeMenu) return
    const handleClick = (e: MouseEvent) => {
      if (customTypeMenuRef.current && !customTypeMenuRef.current.contains(e.target as Node)) {
        setCustomTypeMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [customTypeMenu])

  // Upload images helper
  const uploadImages = async (userId: string, images: File[]): Promise<string[]> => {
    const imageUrls: string[] = []
    for (const image of images) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${userId}/${memberId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(fileName, image)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('note-images')
          .getPublicUrl(fileName)
        imageUrls.push(publicUrl)
      }
    }
    return imageUrls
  }

  // Get session label for display
  const getSessionLabel = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return sessionId
    const date = new Date(session.scheduled_at).toLocaleDateString(
      locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' }
    )
    const typeLabel = t.members.sessionTypes[session.session_type as keyof typeof t.members.sessionTypes] || session.session_type
    return `${typeLabel} — ${date}`
  }

  const getSessionLabelShort = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return ''
    const date = new Date(session.scheduled_at).toLocaleDateString(
      locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
      { day: 'numeric', month: 'short' }
    )
    const typeLabel = t.members.sessionTypes[session.session_type as keyof typeof t.members.sessionTypes] || session.session_type
    return `${typeLabel} · ${date}`
  }

  const snFormatIcon: Record<string, typeof Video> = {
    in_person: User,
    virtual: Video,
    phone: Phone,
  }

  // Format date for note card
  const formatNoteDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    )
  }

  const formatNoteTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(
      locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
      { hour: '2-digit', minute: '2-digit' }
    )
  }

  // ==============================
  // NOTEPAD MODE LOGIC
  // ==============================

  // Auto-scroll notepad to bottom when notes change
  useEffect(() => {
    if (viewMode === 'notepad' && notepadStreamRef.current) {
      notepadStreamRef.current.scrollTop = notepadStreamRef.current.scrollHeight
    }
  }, [allNotes, viewMode])

  // Focus input when entering notepad mode
  useEffect(() => {
    if (viewMode === 'notepad') {
      setTimeout(() => notepadInputRef.current?.focus(), 100)
    }
  }, [viewMode])

  // Auto-resize textarea when padInput changes programmatically (e.g. text extraction)
  useEffect(() => {
    const el = notepadInputRef.current
    if (el) {
      el.style.height = '42px'
      el.style.height = Math.min(el.scrollHeight, 240) + 'px'
    }
  }, [padInput])

  const handlePadImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const startIndex = padImagePreviews.length
      setPadImages(prev => [...prev, ...files])
      files.forEach((file, i) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          setPadImagePreviews(prev => [...prev, dataUrl])
          // Auto-extract text from the image
          handleExtractText(startIndex + i, dataUrl)
        }
        reader.readAsDataURL(file)
      })
    }
    e.target.value = ''
  }

  const removePadImage = (index: number) => {
    setPadImages(prev => prev.filter((_, i) => i !== index))
    setPadImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleExtractText = async (imageIndex: number, dataUrl?: string) => {
    if (extractingText !== null) return

    const url = dataUrl || padImagePreviews[imageIndex]
    if (!url) return

    // Parse data URL: "data:image/png;base64,..."
    const match = url.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) {
      toast.error(t.members.bloomAssist?.error || 'Something went wrong.')
      return
    }

    const mimeType = match[1]
    const imageBase64 = match[2]

    setExtractingText(imageIndex)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/members/${memberId}/notes/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageBase64, mimeType, locale }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(t.members.bloomAssist?.rateLimited || 'Too many requests.')
        } else {
          toast.error(t.members.bloomAssist?.error || 'Something went wrong.')
        }
        return
      }

      if (!data.isNote) {
        toast.error(t.members.bloomAssist?.notANote || "This image doesn't appear to contain a note or document.")
        return
      }

      // Append extracted text to padInput
      setPadInput(prev => {
        if (prev.trim()) return prev + '\n\n' + data.extractedText
        return data.extractedText
      })

      // Show brief checkmark
      setExtractedIndex(imageIndex)
      setTimeout(() => setExtractedIndex(null), 1500)

      toast.success(t.members.bloomAssist?.extractionDone || 'Text extracted')

      // Focus textarea
      setTimeout(() => notepadInputRef.current?.focus(), 100)
    } catch {
      toast.error(t.members.bloomAssist?.error || 'Something went wrong.')
    } finally {
      setExtractingText(null)
    }
  }

  const handlePadSubmit = useCallback(async () => {
    if (!padInput.trim() && padImages.length === 0) return
    if (padSaving || extractingText !== null) return

    setPadSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const imageUrls = await uploadImages(user.id, padImages)

      const { error } = await supabase
        .from('progress_notes')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          session_id: padSessionId || null,
          milestone_id: padMilestoneId || null,
          title: null,
          content: padInput.trim(),
          note_type: padNoteType,
          is_private: true,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })

      if (error) throw error

      setPadInput('')
      setPadImages([])
      setPadImagePreviews([])
      fetchAllNotes()
      onNotesUpdate()

      // Re-focus input
      setTimeout(() => notepadInputRef.current?.focus(), 50)
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error(t.members.errors.noteFailed)
    } finally {
      setPadSaving(false)
    }
  }, [padInput, padImages, padSaving, padSessionId, padMilestoneId, padNoteType, memberId])

  const handlePadKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to submit, Shift+Enter for newline — block while extracting
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (extractingText === null) handlePadSubmit()
    }
  }

  // ==============================
  // BLOOM ASSIST LOGIC
  // ==============================

  // Close assist menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assistMenuRef.current && !assistMenuRef.current.contains(e.target as Node)) {
        setShowAssistMenu(false)
      }
    }
    if (showAssistMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAssistMenu])

  const handleBloomAssist = async (promptKey: PromptKey) => {
    setShowAssistMenu(false)
    if (assistLoading) return

    setAssistLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch(`/api/members/${memberId}/notes/assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ promptKey, locale }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(t.members.bloomAssist?.rateLimited || 'Too many requests. Please try again in a moment.')
        } else if (data.code === 'INSUFFICIENT_DATA') {
          toast.error(t.members.bloomAssist?.insufficientData || 'Not enough data yet.')
        } else {
          toast.error(t.members.bloomAssist?.error || 'Something went wrong.')
        }
        return
      }

      const msg: AssistMessage = {
        id: `assist-${Date.now()}`,
        promptKey,
        response: data.response,
        createdAt: new Date().toISOString(),
      }
      setAssistMessages(prev => [...prev, msg])

      // Scroll to bottom after render
      setTimeout(() => {
        if (notepadStreamRef.current) {
          notepadStreamRef.current.scrollTop = notepadStreamRef.current.scrollHeight
        }
      }, 100)
    } catch {
      toast.error(t.members.bloomAssist?.error || 'Something went wrong.')
    } finally {
      setAssistLoading(false)
    }
  }

  const dismissAssistMessage = (id: string) => {
    setAssistMessages(prev => prev.filter(m => m.id !== id))
  }

  const saveAssistAsNote = async (msg: AssistMessage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const promptLabel = t.members.bloomAssist?.prompts?.[msg.promptKey as keyof typeof t.members.bloomAssist.prompts] || msg.promptKey

      const { error } = await supabase
        .from('progress_notes')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          session_id: padSessionId || null,
          milestone_id: padMilestoneId || null,
          title: `Bloom Assist: ${promptLabel}`,
          content: msg.response,
          note_type: 'general',
          is_private: true,
        })

      if (error) throw error

      setAssistMessages(prev => prev.map(m => m.id === msg.id ? { ...m, saved: true } : m))
      toast.success(t.members.bloomAssist?.savedAsNote || 'Saved as note')
      fetchAllNotes()
      onNotesUpdate()
    } catch {
      toast.error(t.members.errors.noteFailed)
    }
  }

  const toggleAssistEdit = (id: string) => {
    setAssistMessages(prev => prev.map(m => m.id === id ? { ...m, editing: !m.editing } : m))
  }

  const updateAssistResponse = (id: string, text: string) => {
    setAssistMessages(prev => prev.map(m => m.id === id ? { ...m, response: text } : m))
  }

  // Notes for notepad stream (chronological — oldest first)
  const notepadNotes = [...allNotes].reverse()

  // Group notepad notes by date
  const groupedByDate = notepadNotes.reduce<Record<string, ProgressNote[]>>((acc, note) => {
    const dateKey = new Date(note.created_at).toLocaleDateString(
      locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    )
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(note)
    return acc
  }, {})

  // ==============================
  // SESSION NOTES SUB-TAB LOGIC
  // ==============================

  const now = new Date()
  const snUpcoming = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  const snCompleted = sessions
    .filter(s => s.status === 'completed' || s.status === 'no_show' ||
      (s.status === 'scheduled' && new Date(s.scheduled_at) < now))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  // Fetch session summary notes
  useEffect(() => {
    const fetchSessionSummaryNotes = async () => {
      const sessionIds = sessions.map(s => s.id)
      if (sessionIds.length === 0) return

      const { data, error } = await supabase
        .from('progress_notes')
        .select('id, content, created_at, session_id')
        .in('session_id', sessionIds)
        .eq('note_type', 'session_summary')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const summaryBySession: Record<string, { id: string; content: string; created_at: string } | null> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((note: any) => {
          if (note.session_id && !summaryBySession[note.session_id]) {
            summaryBySession[note.session_id] = {
              id: note.id,
              content: note.content,
              created_at: note.created_at,
            }
          }
        })
        setSnSessionSummaryNotes(summaryBySession)
      }
    }

    fetchSessionSummaryNotes()
  }, [sessions, supabase])

  // Build note types list for RichTextEditor
  useEffect(() => {
    const buildNoteTypes = async () => {
      const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined

      const types: { type: string; label: string }[] = DEFAULT_NOTE_TYPES.map(nt => ({
        type: nt,
        label: noteTypeLabels?.[nt] || nt,
      }))

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('custom_note_types')
          .select('type_name')
          .eq('practitioner_id', user.id)
          .order('created_at')

        if (data) {
          for (const d of data) {
            if (!d.type_name.startsWith('_hidden:') && !types.some(existing => existing.type === d.type_name)) {
              types.push({ type: d.type_name, label: noteTypeLabels?.[d.type_name] || d.type_name.replace(/_/g, ' ') })
            }
          }
        }
      }

      setSnEditorNoteTypes(types)
    }
    buildNoteTypes()
  }, [supabase, t])

  const handleSaveSessionNote = async (sessionId: string, content: string) => {
    if (!content.trim()) return

    setSnSavingSummary(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const existing = snSessionSummaryNotes[sessionId]

      if (existing) {
        const { error } = await supabase
          .from('progress_notes')
          .update({ content: content.trim(), updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (error) throw error

        setSnSessionSummaryNotes(prev => ({
          ...prev,
          [sessionId]: { ...existing, content: content.trim() },
        }))
      } else {
        const { data, error } = await supabase
          .from('progress_notes')
          .insert({
            member_id: memberId,
            practitioner_id: user.id,
            session_id: sessionId,
            content: content.trim(),
            note_type: 'session_summary',
            is_private: true,
          })
          .select('id, content, created_at')
          .single()

        if (error) throw error

        setSnSessionSummaryNotes(prev => ({
          ...prev,
          [sessionId]: {
            id: data.id,
            content: data.content,
            created_at: data.created_at,
          },
        }))
      }

      setSnIsEditing(false)
      setSnSummaryDraft('')
      fetchAllNotes()
      onNotesUpdate()
      toast.success(locale === 'fr' ? 'Note de séance enregistrée' : locale === 'es' ? 'Nota de sesión guardada' : 'Session note saved')
    } catch (error) {
      console.error('Error saving session summary:', error)
      toast.error(locale === 'fr' ? 'Échec de l\'enregistrement' : locale === 'es' ? 'Error al guardar' : 'Failed to save note')
    } finally {
      setSnSavingSummary(false)
    }
  }

  // ==============================
  // BROWSE MODE LOGIC
  // ==============================

  // Filter notes
  const filteredNotes = allNotes.filter(note => {
    if (noteFilter === 'session' && !note.session_id) return false
    if (noteFilter === 'session' && filterSessionId && note.session_id !== filterSessionId) return false
    if (noteFilter === 'general' && note.session_id) return false
    if (noteFilter === 'goal' && !note.milestone_id) return false
    if (noteFilter === 'goal' && filterMilestoneId && note.milestone_id !== filterMilestoneId) return false
    if (typeFilters.size > 0 && !typeFilters.has(note.note_type)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = note.title?.toLowerCase().includes(q)
      const matchesContent = note.content.toLowerCase().includes(q)
      if (!matchesTitle && !matchesContent) return false
    }
    return true
  })

  // Image handling for add form
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setNoteImages(prev => [...prev, ...files])
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setNoteImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setNoteImages(prev => prev.filter((_, i) => i !== index))
    setNoteImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Image handling for edit form
  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setEditImages(prev => [...prev, ...files])
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setEditImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
    e.target.value = ''
  }

  const removeEditImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index))
    setEditImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Add note (browse mode — full form)
  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error(locale === 'fr' ? 'Le contenu est requis' : locale === 'es' ? 'El contenido es obligatorio' : 'Note content is required')
      return
    }

    setSavingNote(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const imageUrls = await uploadImages(user.id, noteImages)

      const { error } = await supabase
        .from('progress_notes')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          session_id: selectedSessionId || null,
          milestone_id: selectedMilestoneId || null,
          title: noteTitle.trim() || null,
          content: noteContent.trim(),
          note_type: noteType,
          is_private: isPrivate,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })

      if (error) throw error

      toast.success(t.members.success.noteAdded)
      setShowAddNote(false)
      setNoteTitle('')
      setNoteContent('')
      setNoteType('general')
      setIsPrivate(true)
      setSelectedSessionId('')
      setSelectedMilestoneId('')
      setNoteImages([])
      setNoteImagePreviews([])
      fetchAllNotes()
      onNotesUpdate()
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error(t.members.errors.noteFailed)
    } finally {
      setSavingNote(false)
    }
  }

  // Start editing a note
  const startEditing = (note: ProgressNote) => {
    setEditingNoteId(note.id)
    setEditTitle(note.title || '')
    setEditContent(note.content)
    setEditNoteType(note.note_type)
    setEditIsPrivate(note.is_private)
    setEditSessionId(note.session_id || '')
    setEditMilestoneId(note.milestone_id || '')
    setExistingImageUrls(note.image_urls || [])
    setEditImages([])
    setEditImagePreviews([])
  }

  const cancelEditing = () => {
    setEditingNoteId(null)
    setEditTitle('')
    setEditContent('')
    setEditNoteType('general')
    setEditIsPrivate(true)
    setEditSessionId('')
    setEditMilestoneId('')
    setExistingImageUrls([])
    setEditImages([])
    setEditImagePreviews([])
  }

  // Save edited note
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error(locale === 'fr' ? 'Le contenu est requis' : locale === 'es' ? 'El contenido es obligatorio' : 'Note content is required')
      return
    }

    setSavingEdit(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newImageUrls = await uploadImages(user.id, editImages)
      const allImageUrls = [...existingImageUrls, ...newImageUrls]

      const { error } = await supabase
        .from('progress_notes')
        .update({
          title: editTitle.trim() || null,
          content: editContent.trim(),
          note_type: editNoteType,
          is_private: editIsPrivate,
          session_id: editSessionId || null,
          milestone_id: editMilestoneId || null,
          image_urls: allImageUrls.length > 0 ? allImageUrls : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNoteId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Note mise à jour' : locale === 'es' ? 'Nota actualizada' : 'Note updated')
      cancelEditing()
      fetchAllNotes()
      onNotesUpdate()
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error(t.members.errors.noteFailed)
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('progress_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Note supprimée' : locale === 'es' ? 'Nota eliminada' : 'Note deleted')
      setDeletingNoteId(null)
      fetchAllNotes()
      onNotesUpdate()
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error(locale === 'fr' ? 'Échec de la suppression' : locale === 'es' ? 'Error al eliminar' : 'Failed to delete note')
    }
  }

  // ==============================
  // RENDER
  // ==============================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header: sub-tab toggle + mode toggle */}
      <div className="flex items-center justify-between">
        {/* Notes / Session Notes sub-tabs (only in notepad mode) */}
        {viewMode === 'notepad' ? (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setNotepadSubTab('quick')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                notepadSubTab === 'quick' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {locale === 'fr' ? 'Notes' : locale === 'es' ? 'Notas' : 'Notes'}
            </button>
            <button
              onClick={() => setNotepadSubTab('session')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                notepadSubTab === 'session' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {locale === 'fr' ? 'Notes de séance' : locale === 'es' ? 'Notas de sesión' : 'Session Notes'}
            </button>
          </div>
        ) : <div />}
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('notepad')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'notepad' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {locale === 'fr' ? 'Bloc-notes' : locale === 'es' ? 'Bloc de notas' : 'Notepad'}
          </button>
          <button
            onClick={() => setViewMode('browse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'browse' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            {locale === 'fr' ? 'Parcourir' : locale === 'es' ? 'Explorar' : 'Browse'}
          </button>
        </div>
      </div>

      {/* ================================ */}
      {/* NOTEPAD MODE                     */}
      {/* ================================ */}
      {viewMode === 'notepad' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
          {/* Quick Notes sub-tab */}
          {notepadSubTab === 'quick' && (
          <>
          {/* Notes stream */}
          <div ref={notepadStreamRef} className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
            {notepadNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BookOpen className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">
                  {locale === 'fr' ? 'Votre bloc-notes est vide' : locale === 'es' ? 'Tu bloc de notas está vacío' : 'Your notepad is empty'}
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  {locale === 'fr' ? 'Commencez à écrire ci-dessous...' : locale === 'es' ? 'Empieza a escribir abajo...' : 'Start writing below...'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([dateLabel, dateNotes]) => (
                  <div key={dateLabel}>
                    {/* Date divider */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-px flex-1 bg-gray-100" />
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{dateLabel}</span>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>

                    {/* Notes for this date */}
                    <div className="space-y-2">
                      {dateNotes.map(note => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group flex gap-3 items-start"
                        >
                          {/* Time */}
                          <span className="text-xs text-gray-300 pt-1 w-12 flex-shrink-0 text-right tabular-nums">
                            {formatNoteTime(note.created_at)}
                          </span>

                          {/* Note content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                {/* Badges — compact */}
                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getNoteColor(note.note_type).bg} ${getNoteColor(note.note_type).text}`}>
                                    {t.members.noteTypes[note.note_type as keyof typeof t.members.noteTypes] || note.note_type}
                                  </span>
                                  {note.session_id && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                                      <LinkIcon className="w-2.5 h-2.5" />
                                      {getSessionLabelShort(note.session_id)}
                                    </span>
                                  )}
                                  {note.milestone_id && (note as any).milestones?.title && (
                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                                      <Target className="w-2.5 h-2.5" />
                                      {(note as any).milestones.title}
                                    </span>
                                  )}
                                </div>

                                {note.title && (
                                  <p className="text-sm font-medium text-gray-900">{note.title}</p>
                                )}
                                <MarkdownRenderer content={note.content} className="break-all leading-relaxed" />

                                {/* Images */}
                                {note.image_urls && note.image_urls.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {note.image_urls.map((url, index) => (
                                      <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={url}
                                          alt=""
                                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Quick actions — visible on hover */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => {
                                    setViewMode('browse')
                                    setTimeout(() => startEditing(note), 100)
                                  }}
                                  className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                {deletingNoteId === note.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleDeleteNote(note.id)}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                    >
                                      {locale === 'fr' ? 'Confirmer' : locale === 'es' ? 'Confirmar' : 'Confirm'}
                                    </button>
                                    <button
                                      onClick={() => setDeletingNoteId(null)}
                                      className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeletingNoteId(note.id)}
                                    className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bloom Assist cards (ephemeral) */}
            <AnimatePresence>
              {assistMessages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4"
                >
                  <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-purple-700 mb-1">
                          {t.members.bloomAssist?.title || 'Bloom Assist'}
                          <span className="font-normal text-purple-500 ml-1.5">
                            — {t.members.bloomAssist?.prompts?.[msg.promptKey as keyof typeof t.members.bloomAssist.prompts] || msg.promptKey}
                          </span>
                        </p>
                        {msg.editing ? (
                          <textarea
                            value={msg.response}
                            onChange={(e) => updateAssistResponse(msg.id, e.target.value)}
                            className="w-full text-sm text-gray-700 leading-relaxed bg-white/70 border border-purple-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                            rows={Math.max(3, msg.response.split('\n').length)}
                            autoFocus
                          />
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.response}</p>
                        )}
                        <p className="text-[10px] text-purple-400 mt-2 italic">
                          {t.members.bloomAssist?.disclaimer || 'AI-generated insight — review before using in documentation.'}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          {msg.saved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <Save className="w-3 h-3" />
                              {t.members.bloomAssist?.savedAsNote || 'Saved as note'}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => toggleAssistEdit(msg.id)}
                                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                                  msg.editing
                                    ? 'text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                <Pencil className="w-3 h-3" />
                                {msg.editing
                                  ? (locale === 'fr' ? 'Terminé' : locale === 'es' ? 'Listo' : 'Done')
                                  : (locale === 'fr' ? 'Modifier' : locale === 'es' ? 'Editar' : 'Edit')
                                }
                              </button>
                              <button
                                onClick={() => saveAssistAsNote(msg)}
                                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
                              >
                                <Save className="w-3 h-3" />
                                {t.members.bloomAssist?.saveAsNote || 'Save as note'}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => dismissAssistMessage(msg.id)}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                          >
                            <X className="w-3 h-3" />
                            {t.members.bloomAssist?.dismiss || 'Dismiss'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Bloom Assist loading indicator */}
            {assistLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    </div>
                    <p className="text-sm text-purple-600 font-medium">
                      {t.members.bloomAssist?.loading || 'Bloom is thinking...'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input area — always at the bottom */}
          <div className="border-t border-gray-100 px-5 pt-3 pb-3 bg-white">
            {/* Milestone dropdown + note type pills */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {/* Goal / Milestone selector */}
              {milestones.length > 0 && (
                <select
                  value={padMilestoneId}
                  onChange={(e) => setPadMilestoneId(e.target.value)}
                  className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200 max-w-[200px] transition-all ${
                    padMilestoneId
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <option value="">{locale === 'fr' ? '🎯 Aucun axe de travail' : locale === 'es' ? '🎯 Sin objetivo' : '🎯 No goal'}</option>
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>
                      🎯 {m.title}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-1 flex-wrap relative">
                {allNoteTypes.map(type => {
                  const isFixed = (fixedNoteTypes as readonly string[]).includes(type)
                  const isDeletable = !isFixed // deletable defaults + custom types can all be managed

                  if (renamingType === type) {
                    return (
                      <form
                        key={type}
                        onSubmit={(e) => { e.preventDefault(); renameCustomType(type, renameValue) }}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => renameCustomType(type, renameValue)}
                          className="w-24 px-2 py-0.5 text-xs border border-gray-300 rounded-full focus:outline-none focus:border-teal-400"
                          autoFocus
                        />
                      </form>
                    )
                  }

                  const openMenu = (x: number, y: number) => {
                    if (!isDeletable) return
                    setConfirmingDelete(false)
                    setCustomTypeMenu({ type, x, y })
                  }

                  return (
                    <button
                      key={type}
                      onClick={() => setPadNoteType(type)}
                      onDoubleClick={(e) => {
                        if (!isDeletable) return
                        e.preventDefault()
                        const rect = (e.target as HTMLElement).getBoundingClientRect()
                        openMenu(rect.left, rect.bottom + 4)
                      }}
                      onTouchStart={(e) => {
                        if (!isDeletable) return
                        const touch = e.touches[0]
                        const timer = setTimeout(() => {
                          openMenu(touch.clientX, touch.clientY)
                          longPressTimers.current.delete(type)
                        }, 500)
                        longPressTimers.current.set(type, timer)
                      }}
                      onTouchEnd={() => {
                        const timer = longPressTimers.current.get(type)
                        if (timer) { clearTimeout(timer); longPressTimers.current.delete(type) }
                      }}
                      onTouchMove={() => {
                        const timer = longPressTimers.current.get(type)
                        if (timer) { clearTimeout(timer); longPressTimers.current.delete(type) }
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all select-none flex items-center gap-1 ${
                        padNoteType === type
                          ? `${getNoteColor(type).bg} ${getNoteColor(type).text} ring-1 ring-current ring-opacity-30`
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {t.members.noteTypes[type as keyof typeof t.members.noteTypes] || type}
                      {isFixed && <Lock className="w-2.5 h-2.5 opacity-40" />}
                    </button>
                  )
                })}

                {/* Context menu for deletable types */}
                {customTypeMenu && (
                  <div
                    ref={customTypeMenuRef}
                    className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]"
                    style={{ left: customTypeMenu.x, top: customTypeMenu.y }}
                  >
                    {/* Only show rename for custom types, not deletable defaults */}
                    {customNoteTypes.includes(customTypeMenu.type) && (
                      <button
                        onClick={() => {
                          setRenamingType(customTypeMenu.type)
                          setRenameValue(customTypeMenu.type)
                          setCustomTypeMenu(null)
                        }}
                        className="w-full px-3 py-1.5 text-xs text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Pencil className="w-3 h-3" />
                        {locale === 'fr' ? 'Renommer' : 'Rename'}
                      </button>
                    )}
                    {confirmingDelete ? (
                      <button
                        onClick={() => { deleteNoteType(customTypeMenu.type); setConfirmingDelete(false) }}
                        className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                      >
                        <Trash2 className="w-3 h-3" />
                        {locale === 'fr' ? 'Confirmer ?' : 'Confirm?'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmingDelete(true)}
                        className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        {locale === 'fr' ? 'Supprimer' : 'Delete'}
                      </button>
                    )}
                  </div>
                )}

                {showCustomTypeInput ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const nonFixedCount = allNoteTypes.filter(t => !(fixedNoteTypes as readonly string[]).includes(t)).length
                      const val = customTypeValue.trim().toLowerCase().replace(/\s+/g, '_')
                      if (val && !allNoteTypes.includes(val)) {
                        if (nonFixedCount >= 7) {
                          toast.error(locale === 'fr' ? 'Maximum 7 types personnalisés' : 'Maximum 7 custom types')
                          return
                        }
                        setCustomNoteTypes(prev => [...prev, val])
                        saveCustomType(val)
                        setPadNoteType(val)
                      } else if (val) {
                        setPadNoteType(val)
                      }
                      setCustomTypeValue('')
                      setShowCustomTypeInput(false)
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      ref={customTypeInputRef}
                      type="text"
                      value={customTypeValue}
                      onChange={(e) => setCustomTypeValue(e.target.value)}
                      onBlur={() => { if (!customTypeValue.trim()) setShowCustomTypeInput(false) }}
                      placeholder={locale === 'fr' ? 'Nouveau type...' : 'New type...'}
                      className="w-24 px-2 py-0.5 text-xs border border-gray-300 rounded-full focus:outline-none focus:border-teal-400"
                      autoFocus
                    />
                    <button type="submit" className="text-teal-500 hover:text-teal-600">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => { setShowCustomTypeInput(false); setCustomTypeValue('') }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : allNoteTypes.filter(t => !(fixedNoteTypes as readonly string[]).includes(t)).length < 7 ? (
                  <button
                    onClick={() => setShowCustomTypeInput(true)}
                    className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:bg-teal-100 hover:text-teal-600 transition-all flex items-center justify-center"
                    title={locale === 'fr' ? 'Ajouter un type' : 'Add type'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Image previews */}
            {padImagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {padImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                    {/* Remove button */}
                    <button
                      onClick={() => removePadImage(index)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    {/* Extract text button */}
                    <button
                      onClick={() => handleExtractText(index)}
                      disabled={extractingText !== null}
                      className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        extractingText === index
                          ? 'bg-purple-500 text-white opacity-100'
                          : extractedIndex === index
                            ? 'bg-emerald-500 text-white opacity-100'
                            : 'bg-gray-900 text-white opacity-0 group-hover:opacity-100 hover:bg-purple-600'
                      }`}
                      title={t.members.bloomAssist?.extractText || 'Extract text'}
                    >
                      {extractingText === index ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : extractedIndex === index ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <ScanLine className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-gray-200">
              {/* Textarea */}
              <div className="flex-1 relative min-w-0">
                <textarea
                  ref={notepadInputRef}
                  value={padInput}
                  onChange={(e) => setPadInput(e.target.value)}
                  onKeyDown={handlePadKeyDown}
                  placeholder={locale === 'fr' ? 'Écrivez une note... (Entrée pour sauvegarder)' : locale === 'es' ? 'Escribe una nota... (Enter para guardar)' : 'Write a note... (Enter to save, Shift+Enter for new line)'}
                  rows={1}
                  className="w-full bg-transparent px-3 py-2.5 pr-9 text-sm focus:outline-none resize-none leading-relaxed"
                  style={{ minHeight: '42px', maxHeight: '240px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = '42px'
                    target.style.height = Math.min(target.scrollHeight, 240) + 'px'
                  }}
                />
                <button
                  onClick={handlePadSubmit}
                  disabled={padSaving || extractingText !== null || (!padInput.trim() && padImages.length === 0)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                >
                  {padSaving ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CornerDownLeft className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          </>
          )}

          {/* Session Notes sub-tab */}
          {notepadSubTab === 'session' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!snSelectedSessionId ? (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Upcoming sessions */}
                {snUpcoming.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-blue-600" />
                      </div>
                      {locale === 'fr' ? 'À venir' : locale === 'es' ? 'Próximas' : 'Upcoming'}
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                        {snUpcoming.length}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {snUpcoming.map(s => {
                        const hasNote = !!snSessionSummaryNotes[s.id]
                        const FormatIcon = snFormatIcon[s.session_format] || User
                        return (
                          <button
                            key={s.id}
                            onClick={() => { setSnSelectedSessionId(s.id); setSnIsEditing(false); setSnSummaryDraft('') }}
                            className="w-full flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50/80 to-blue-100/40 border border-blue-200/50 hover:border-blue-300/60 hover:shadow-sm transition-all text-left group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                              <FormatIcon className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {t.members.sessionTypes[s.session_type as keyof typeof t.members.sessionTypes] || s.session_type}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(s.scheduled_at).toLocaleDateString(
                                  locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
                                  { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-gray-400 bg-white/60 px-1.5 py-0.5 rounded">
                                  {s.duration_minutes} {t.members.sessions.minutes}
                                </span>
                                <span className="text-[10px] text-gray-400 bg-white/60 px-1.5 py-0.5 rounded">
                                  {t.members.sessionFormats[s.session_format as keyof typeof t.members.sessionFormats]}
                                </span>
                              </div>
                            </div>
                            {hasNote ? (
                              <span className="flex-shrink-0 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                                {locale === 'fr' ? 'Rédigée' : locale === 'es' ? 'Escrita' : 'Written'}
                              </span>
                            ) : (
                              <span className="flex-shrink-0 text-[10px] font-medium text-gray-400 bg-white/60 px-1.5 py-0.5 rounded mt-0.5">
                                {locale === 'fr' ? 'Vide' : locale === 'es' ? 'Vacía' : 'Empty'}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* No upcoming — friendly empty state */}
                {snUpcoming.length === 0 && (
                  <div className="mb-5 text-center py-6 rounded-xl bg-gradient-to-br from-blue-50/60 to-blue-100/30 border border-dashed border-blue-200/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      {locale === 'fr' ? 'Aucune séance à venir' : locale === 'es' ? 'No hay sesiones próximas' : 'No upcoming sessions'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {locale === 'fr' ? 'Sélectionnez une séance passée ci-dessous' : locale === 'es' ? 'Selecciona una sesión pasada abajo' : 'Select a past session below'}
                    </p>
                  </div>
                )}

                {/* Past sessions — collapsible, auto-expanded when no upcoming */}
                {snCompleted.length > 0 && (
                  <div>
                    <button
                      onClick={() => setSnShowPast(!snShowPast)}
                      className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 hover:text-gray-600 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                        <Clock className="w-3 h-3 text-gray-500" />
                      </div>
                      {locale === 'fr' ? 'Terminées' : locale === 'es' ? 'Completadas' : 'Past sessions'}
                      <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
                        {snCompleted.length}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ml-auto ${(snShowPast || snUpcoming.length === 0) ? '' : '-rotate-90'}`} />
                    </button>
                    {(snShowPast || snUpcoming.length === 0) && (
                      <div className="space-y-2">
                        {snCompleted.map(s => {
                          const hasNote = !!snSessionSummaryNotes[s.id]
                          const FormatIcon = snFormatIcon[s.session_format] || User
                          return (
                            <button
                              key={s.id}
                              onClick={() => { setSnSelectedSessionId(s.id); setSnIsEditing(false); setSnSummaryDraft('') }}
                              className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all text-left group"
                            >
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                <FormatIcon className="w-4.5 h-4.5 text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700">
                                  {t.members.sessionTypes[s.session_type as keyof typeof t.members.sessionTypes] || s.session_type}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(s.scheduled_at).toLocaleDateString(
                                    locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
                                    { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                    {s.duration_minutes} {t.members.sessions.minutes}
                                  </span>
                                  <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                    {t.members.sessionFormats[s.session_format as keyof typeof t.members.sessionFormats]}
                                  </span>
                                </div>
                              </div>
                              {hasNote ? (
                                <span className="flex-shrink-0 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                                  {locale === 'fr' ? 'Rédigée' : locale === 'es' ? 'Escrita' : 'Written'}
                                </span>
                              ) : (
                                <span className="flex-shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                                  {locale === 'fr' ? 'Vide' : locale === 'es' ? 'Vacía' : 'Empty'}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Session header with back button */}
                  <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-gray-100">
                  <button
                    onClick={() => { setSnSelectedSessionId(''); setSnIsEditing(false); setSnSummaryDraft('') }}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                  </button>
                  <p className="text-sm font-medium text-gray-900 truncate">{getSessionLabel(snSelectedSessionId)}</p>
                </div>

                {/* Editor / read content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {snIsEditing ? (
                    <div className="flex flex-col h-full">
                      <div className="flex-1 min-h-0">
                        <RichTextEditor
                          value={snSummaryDraft}
                          onChange={setSnSummaryDraft}
                          placeholder={locale === 'fr' ? 'Rédigez votre note de séance...' : locale === 'es' ? 'Escribe tu nota de sesión...' : 'Write your session note...'}
                          memberId={memberId}
                          locale={locale}
                          autoFocus
                          milestones={milestones}
                          noteTypes={snEditorNoteTypes}
                          memberName={member?.first_name}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSnIsEditing(false)
                            setSnSummaryDraft('')
                          }}
                        >
                          {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                        </Button>
                        <Button
                          onClick={() => handleSaveSessionNote(snSelectedSessionId, snSummaryDraft)}
                          disabled={snSavingSummary || !snSummaryDraft.trim()}
                          className="bg-gray-900 text-white hover:bg-gray-800"
                        >
                          {snSavingSummary ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          {locale === 'fr' ? 'Enregistrer' : locale === 'es' ? 'Guardar' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : snSessionSummaryNotes[snSelectedSessionId] ? (
                    <div>
                      <div
                        className="prose prose-sm max-w-none cursor-pointer hover:bg-gray-50 rounded-lg p-3 -m-3 transition-colors"
                        onClick={() => {
                          setSnSummaryDraft(snSessionSummaryNotes[snSelectedSessionId]!.content)
                          setSnIsEditing(true)
                        }}
                        dangerouslySetInnerHTML={{ __html: snSessionSummaryNotes[snSelectedSessionId]!.content }}
                      />
                      <p className="text-xs text-gray-400 mt-4">
                        {locale === 'fr' ? 'Cliquez pour modifier' : locale === 'es' ? 'Haz clic para editar' : 'Click to edit'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FileText className="w-10 h-10 text-gray-200 mb-3" />
                      <p className="text-gray-400 text-sm mb-3">
                        {locale === 'fr' ? 'Aucune note pour cette séance' : locale === 'es' ? 'Sin notas para esta sesión' : 'No notes for this session yet'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSnSummaryDraft('')
                          setSnIsEditing(true)
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        {locale === 'fr' ? 'Rédiger une note' : locale === 'es' ? 'Escribir una nota' : 'Write a note'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================ */}
      {/* BROWSE MODE                      */}
      {/* ================================ */}
      {viewMode === 'browse' && (
        <>
          {/* Unified toolbar */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 space-y-2.5">
            {/* Row 1: Type pills + search */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                <button
                  onClick={() => setTypeFilters(new Set())}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                    typeFilters.size === 0
                      ? 'bg-gray-200 text-gray-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {locale === 'fr' ? 'Tous' : locale === 'es' ? 'Todos' : 'All'}
                </button>
                {allNoteTypes.map(type => {
                  const active = typeFilters.has(type)
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setTypeFilters(prev => {
                          const next = new Set(prev)
                          if (next.has(type)) next.delete(type)
                          else next.add(type)
                          return next
                        })
                      }}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        active
                          ? `${getNoteColor(type).bg} ${getNoteColor(type).text} ring-1 ring-current ring-opacity-30`
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {t.members.noteTypes[type as keyof typeof t.members.noteTypes] || type}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Row 2: Session + milestone dropdowns + search */}
            <div className="flex items-center gap-2">
              {sessions.length > 0 && (
                <select
                  value={filterSessionId}
                  onChange={(e) => {
                    setFilterSessionId(e.target.value)
                    if (e.target.value) setNoteFilter('session')
                    else if (noteFilter === 'session') setNoteFilter('all')
                  }}
                  className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-200 max-w-[200px] transition-all ${
                    filterSessionId ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  <option value="">{locale === 'fr' ? 'Toutes les séances' : locale === 'es' ? 'Todas las sesiones' : 'All sessions'}</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{getSessionLabel(s.id)}</option>
                  ))}
                </select>
              )}
              {milestones.length > 0 && (
                <select
                  value={filterMilestoneId}
                  onChange={(e) => {
                    setFilterMilestoneId(e.target.value)
                    if (e.target.value) setNoteFilter('goal')
                    else if (noteFilter === 'goal') setNoteFilter('all')
                  }}
                  className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-gray-200 max-w-[200px] transition-all ${
                    filterMilestoneId ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  <option value="">{locale === 'fr' ? 'Tous les jalons' : locale === 'es' ? 'Todos los hitos' : 'All goals'}</option>
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              )}
              <div className="relative flex-1 min-w-[120px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher...' : locale === 'es' ? 'Buscar...' : 'Search...'}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Add Note Form */}
          <AnimatePresence>
            {showAddNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{t.members.notes.addNote}</h3>
                    <button onClick={() => {
                      setShowAddNote(false)
                      setNoteTitle('')
                      setNoteContent('')
                      setNoteType('general')
                      setSelectedSessionId('')
                      setSelectedMilestoneId('')
                      setNoteImages([])
                      setNoteImagePreviews([])
                    }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Session selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'fr' ? 'Lier à une séance (optionnel)' : locale === 'es' ? 'Vincular a una sesión (opcional)' : 'Link to Session (optional)'}
                    </label>
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                      <option value="">{locale === 'fr' ? 'Aucune séance' : locale === 'es' ? 'Ninguna sesión' : 'No session (general note)'}</option>
                      {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                          {getSessionLabel(session.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Goal / Milestone selector */}
                  {milestones.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'fr' ? 'Lier à un objectif (optionnel)' : locale === 'es' ? 'Vincular a un objetivo (opcional)' : 'Link to Goal (optional)'}
                      </label>
                      <select
                        value={selectedMilestoneId}
                        onChange={(e) => setSelectedMilestoneId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      >
                        <option value="">{locale === 'fr' ? 'Aucun axe de travail' : locale === 'es' ? 'Sin objetivo' : 'No goal'}</option>
                        {milestones.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.members.notes.noteTitle}
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder={locale === 'fr' ? 'Titre de la note...' : locale === 'es' ? 'Título de la nota...' : 'Note title...'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.members.notes.noteContent} *
                    </label>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder={locale === 'fr' ? 'Écrivez votre note ici...' : locale === 'es' ? 'Escribe tu nota aquí...' : 'Write your note here...'}
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                    />
                  </div>

                  {/* Note Type + Private */}
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.members.notes.noteType}
                      </label>
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as NoteType)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        {allNoteTypes.map(type => (
                          <option key={type} value={type}>
                            {t.members.noteTypes[type as keyof typeof t.members.noteTypes] || type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrivate}
                          onChange={(e) => setIsPrivate(e.target.checked)}
                          className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                        />
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{t.members.notes.private}</span>
                      </label>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ImagePlus className="w-4 h-4" />
                      {locale === 'fr' ? 'Ajouter des images' : locale === 'es' ? 'Agregar imágenes' : 'Add images'}
                    </button>

                    {noteImagePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {noteImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img src={preview} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowAddNote(false)
                        setNoteTitle('')
                        setNoteContent('')
                        setNoteType('general')
                        setSelectedSessionId('')
                        setSelectedMilestoneId('')
                        setNoteImages([])
                        setNoteImagePreviews([])
                      }}
                    >
                      {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                    </Button>
                    <Button
                      onClick={handleAddNote}
                      disabled={savingNote || !noteContent.trim()}
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      {savingNote ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : null}
                      {t.members.notes.save}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">
                {allNotes.length === 0
                  ? (locale === 'fr' ? 'Aucune note pour le moment' : locale === 'es' ? 'Aún no hay notas' : 'No notes yet')
                  : (locale === 'fr' ? 'Aucune note ne correspond aux filtres' : locale === 'es' ? 'Ninguna nota coincide con los filtros' : 'No notes match your filters')
                }
              </p>
              {allNotes.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'fr' ? 'Commencez par ajouter une note' : locale === 'es' ? 'Comienza agregando una nota' : 'Start by adding your first note'}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {editingNoteId === note.id ? (
                    /* Edit Mode */
                    <div className="p-5 space-y-3 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{t.members.notes.editNote}</h3>
                        <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {locale === 'fr' ? 'Séance' : locale === 'es' ? 'Sesión' : 'Session'}
                          </label>
                          <select
                            value={editSessionId}
                            onChange={(e) => setEditSessionId(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                          >
                            <option value="">{locale === 'fr' ? 'Aucune' : locale === 'es' ? 'Ninguna' : 'None'}</option>
                            {sessions.map(session => (
                              <option key={session.id} value={session.id}>{getSessionLabel(session.id)}</option>
                            ))}
                          </select>
                        </div>
                        {milestones.length > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {locale === 'fr' ? 'Objectif' : locale === 'es' ? 'Objetivo' : 'Goal'}
                            </label>
                            <select
                              value={editMilestoneId}
                              onChange={(e) => setEditMilestoneId(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                            >
                              <option value="">{locale === 'fr' ? 'Aucun' : locale === 'es' ? 'Ninguno' : 'None'}</option>
                              {milestones.map(m => (
                                <option key={m.id} value={m.id}>{m.title}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t.members.notes.noteTitle}</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{t.members.notes.noteContent} *</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={editNoteType}
                          onChange={(e) => setEditNoteType(e.target.value as NoteType)}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                          {allNoteTypes.map(type => (
                            <option key={type} value={type}>
                              {t.members.noteTypes[type as keyof typeof t.members.noteTypes] || type}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={editIsPrivate}
                            onChange={(e) => setEditIsPrivate(e.target.checked)}
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-200 w-3.5 h-3.5"
                          />
                          <Lock className="w-3 h-3" />
                          {t.members.notes.private}
                        </label>
                      </div>

                      {/* Existing + new images */}
                      {(existingImageUrls.length > 0 || editImagePreviews.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {existingImageUrls.map((url, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                              <button
                                onClick={() => removeExistingImage(index)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                          {editImagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="relative group">
                              <img src={preview} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                              <button
                                onClick={() => removeEditImage(index)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input ref={editImageInputRef} type="file" accept="image/*" multiple onChange={handleEditImageSelect} className="hidden" />

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => editImageInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                          {locale === 'fr' ? 'Images' : 'Images'}
                        </button>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={savingEdit || !editContent.trim()}
                            className="bg-gray-900 text-white hover:bg-gray-800"
                          >
                            {savingEdit ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                            ) : null}
                            {t.members.notes.save}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* View Mode — compact with hover actions */
                    <div className="group px-4 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Left: date column */}
                        <div className="flex-shrink-0 w-16 pt-0.5">
                          <p className="text-[11px] text-gray-400 tabular-nums leading-tight">
                            {new Date(note.created_at).toLocaleDateString(
                              locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
                              { day: 'numeric', month: 'short' }
                            )}
                          </p>
                          <p className="text-[10px] text-gray-300 tabular-nums">
                            {formatNoteTime(note.created_at)}
                          </p>
                        </div>

                        {/* Center: content */}
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getNoteColor(note.note_type).bg} ${getNoteColor(note.note_type).text}`}>
                              {t.members.noteTypes[note.note_type as keyof typeof t.members.noteTypes] || note.note_type}
                            </span>
                            {note.session_id && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                                <LinkIcon className="w-2.5 h-2.5" />
                                {getSessionLabelShort(note.session_id)}
                              </span>
                            )}
                            {note.milestone_id && (note as any).milestones?.title && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                                <Target className="w-2.5 h-2.5" />
                                {(note as any).milestones.title}
                              </span>
                            )}
                            {note.updated_at !== note.created_at && (
                              <span className="text-[10px] text-gray-300 italic">
                                ({locale === 'fr' ? 'modifiée' : locale === 'es' ? 'editada' : 'edited'})
                              </span>
                            )}
                          </div>

                          {note.title && (
                            <p className="text-sm font-medium text-gray-900 mb-0.5">{note.title}</p>
                          )}
                          <MarkdownRenderer content={note.content} className="break-all leading-relaxed" />

                          {note.image_urls && note.image_urls.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {note.image_urls.map((url, index) => (
                                <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200 hover:border-gray-400 transition-colors" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right: hover actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title={t.members.notes.editNote}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deletingNoteId === note.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                {locale === 'fr' ? 'Confirmer' : locale === 'es' ? 'Confirmar' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeletingNoteId(null)}
                                className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingNoteId(note.id)}
                              className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title={t.members.notes.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
