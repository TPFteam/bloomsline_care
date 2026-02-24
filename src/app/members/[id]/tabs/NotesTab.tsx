'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Trash2,
  Lock,
  Unlock,
  ImagePlus,
  Pencil,
  Calendar,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { ProgressNote, NoteType, Session as MemberSession } from '@/types/member'
import type { PromptKey } from '@/lib/assist/prompts'

interface NotesTabProps {
  memberId: string
  sessions: MemberSession[]
  notes: ProgressNote[]
  onNotesUpdate: () => void
}

type ViewMode = 'browse' | 'notepad'
type NoteFilter = 'all' | 'session' | 'general'

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

const noteTypeColors: Record<NoteType, { bg: string; text: string }> = {
  general: { bg: 'bg-gray-100', text: 'text-gray-700' },
  assessment: { bg: 'bg-blue-50', text: 'text-blue-700' },
  treatment_plan: { bg: 'bg-purple-50', text: 'text-purple-700' },
  milestone: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  concern: { bg: 'bg-red-50', text: 'text-red-700' },
  observation: { bg: 'bg-amber-50', text: 'text-amber-700' },
}

const noteTypes: NoteType[] = ['general', 'observation', 'assessment', 'treatment_plan', 'concern']

export default function NotesTab({ memberId, sessions, notes: initialNotes, onNotesUpdate }: NotesTabProps) {
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

  // ==============================
  // NOTEPAD MODE STATE
  // ==============================
  const padStorageKey = `notepad-context-${memberId}`

  // Restore locked context from localStorage on mount
  const getInitialPadState = () => {
    if (typeof window === 'undefined') return { sessionId: '', milestoneId: '', noteType: 'general' as NoteType, locked: false }
    try {
      const stored = localStorage.getItem(padStorageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          sessionId: parsed.sessionId || '',
          milestoneId: parsed.milestoneId || '',
          noteType: (parsed.noteType || 'general') as NoteType,
          locked: parsed.locked || false,
        }
      }
    } catch {}
    return { sessionId: '', milestoneId: '', noteType: 'general' as NoteType, locked: false }
  }

  const initialPad = getInitialPadState()
  const [padSessionId, setPadSessionId] = useState<string>(initialPad.sessionId)
  const [padMilestoneId, setPadMilestoneId] = useState<string>(initialPad.milestoneId)
  const [padNoteType, setPadNoteType] = useState<NoteType>(initialPad.noteType)
  const [padLocked, setPadLocked] = useState(initialPad.locked)
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

  // Persist notepad context to localStorage when locked
  const savePadContext = useCallback((sessionId: string, milestoneId: string, noteType: NoteType, locked: boolean) => {
    try {
      if (locked) {
        localStorage.setItem(padStorageKey, JSON.stringify({ sessionId, milestoneId, noteType, locked: true }))
      } else {
        localStorage.removeItem(padStorageKey)
      }
    } catch {}
  }, [padStorageKey])

  const togglePadLock = () => {
    const newLocked = !padLocked
    setPadLocked(newLocked)
    savePadContext(padSessionId, padMilestoneId, padNoteType, newLocked)
  }

  // Update localStorage when session/type/milestone change while locked
  useEffect(() => {
    if (padLocked) {
      savePadContext(padSessionId, padMilestoneId, padNoteType, true)
    }
  }, [padSessionId, padMilestoneId, padNoteType, padLocked, savePadContext])

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
  const [typeFilter, setTypeFilter] = useState<NoteType | 'all'>('all')
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
          note_type: 'observation',
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
  // BROWSE MODE LOGIC
  // ==============================

  // Filter notes
  const filteredNotes = allNotes.filter(note => {
    if (noteFilter === 'session' && !note.session_id) return false
    if (noteFilter === 'general' && note.session_id) return false
    if (typeFilter !== 'all' && note.note_type !== typeFilter) return false
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
      {/* Header: title + mode toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t.members.profile.notes}
          </h2>
          <p className="text-sm text-gray-500">
            {allNotes.length} {allNotes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* ================================ */}
      {/* NOTEPAD MODE                     */}
      {/* ================================ */}
      {viewMode === 'notepad' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
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
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${noteTypeColors[note.note_type].bg} ${noteTypeColors[note.note_type].text}`}>
                                    {t.members.noteTypes[note.note_type as keyof typeof t.members.noteTypes]}
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
                                  {note.is_private && (
                                    <Lock className="w-2.5 h-2.5 text-gray-300" />
                                  )}
                                </div>

                                {note.title && (
                                  <p className="text-sm font-medium text-gray-900">{note.title}</p>
                                )}
                                <p className="text-sm text-gray-700 whitespace-pre-wrap break-all leading-relaxed">{note.content}</p>

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
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
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
            {/* Session selector + note type pills + lock */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <select
                value={padSessionId}
                onChange={(e) => setPadSessionId(e.target.value)}
                disabled={padLocked}
                className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-200 max-w-[240px] transition-all ${
                  padLocked
                    ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <option value="">{locale === 'fr' ? 'Notes générales' : locale === 'es' ? 'Notas generales' : 'General notes'}</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {getSessionLabel(session.id)}
                  </option>
                ))}
              </select>

              {/* Lock/Unlock icon */}
              <button
                onClick={togglePadLock}
                className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                  padLocked
                    ? 'text-white bg-gray-900 hover:bg-gray-800'
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                }`}
                title={padLocked
                  ? (locale === 'fr' ? 'Déverrouiller la séance' : locale === 'es' ? 'Desbloquear sesión' : 'Unlock session')
                  : (locale === 'fr' ? 'Verrouiller la séance' : locale === 'es' ? 'Bloquear sesión' : 'Lock session')
                }
              >
                {padLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              {/* Goal / Milestone selector */}
              {milestones.length > 0 && (
                <select
                  value={padMilestoneId}
                  onChange={(e) => setPadMilestoneId(e.target.value)}
                  disabled={padLocked}
                  className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200 max-w-[200px] transition-all ${
                    padLocked
                      ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                      : padMilestoneId
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

              <div className="flex items-center gap-1">
                {noteTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setPadNoteType(type)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      padNoteType === type
                        ? `${noteTypeColors[type].bg} ${noteTypeColors[type].text} ring-1 ring-current ring-opacity-30`
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t.members.noteTypes[type as keyof typeof t.members.noteTypes]}
                  </button>
                ))}
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

            <div className="flex items-end border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-gray-200">
              {/* Left action buttons */}
              <div className="flex items-center gap-0.5 pl-2 pb-2 flex-shrink-0">
                <input
                  ref={notepadImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePadImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => notepadImageInputRef.current?.click()}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title={locale === 'fr' ? 'Ajouter une image' : locale === 'es' ? 'Agregar imagen' : 'Add image'}
                >
                  <ImagePlus className="w-4 h-4" />
                </button>

                {/* Bloom Assist sparkle button */}
                <div className="relative" ref={assistMenuRef}>
                  <button
                    onClick={() => setShowAssistMenu(prev => !prev)}
                    disabled={assistLoading}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showAssistMenu || assistLoading
                        ? 'text-purple-600 bg-purple-50'
                        : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                    title={t.members.bloomAssist?.buttonTooltip || 'Quick AI insights'}
                  >
                    {assistLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>

                  {/* Assist popover menu */}
                  <AnimatePresence>
                    {showAssistMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50"
                      >
                        <div className="px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                          <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {t.members.bloomAssist?.title || 'Bloom Assist'}
                          </p>
                        </div>
                        <div className="py-1">
                          {ASSIST_PROMPT_KEYS.map(key => (
                            <button
                              key={key}
                              onClick={() => handleBloomAssist(key)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                            >
                              {t.members.bloomAssist?.prompts?.[key as keyof typeof t.members.bloomAssist.prompts] || key}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Textarea */}
              <div className="flex-1 relative min-w-0">
                <textarea
                  ref={notepadInputRef}
                  value={padInput}
                  onChange={(e) => setPadInput(e.target.value)}
                  onKeyDown={handlePadKeyDown}
                  placeholder={locale === 'fr' ? 'Écrivez une note... (Entrée pour sauvegarder)' : locale === 'es' ? 'Escribe una nota... (Enter para guardar)' : 'Write a note... (Enter to save, Shift+Enter for new line)'}
                  rows={1}
                  className="w-full bg-transparent px-2 py-2.5 pr-9 text-sm focus:outline-none resize-none leading-relaxed"
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
                  className="absolute right-2 bottom-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
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
        </div>
      )}

      {/* ================================ */}
      {/* BROWSE MODE                      */}
      {/* ================================ */}
      {viewMode === 'browse' && (
        <>
          {/* Actions bar */}
          <div className="flex items-center justify-end">
            <Button
              onClick={() => setShowAddNote(true)}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.members.notes.addNote}
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Link filter */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {([
                  { id: 'all' as NoteFilter, label: locale === 'fr' ? 'Toutes' : locale === 'es' ? 'Todas' : 'All' },
                  { id: 'session' as NoteFilter, label: locale === 'fr' ? 'Liées à une séance' : locale === 'es' ? 'De sesión' : 'Session Notes' },
                  { id: 'general' as NoteFilter, label: locale === 'fr' ? 'Générales' : locale === 'es' ? 'Generales' : 'General' },
                ]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setNoteFilter(f.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      noteFilter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NoteType | 'all')}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <option value="all">{locale === 'fr' ? 'Tous les types' : locale === 'es' ? 'Todos los tipos' : 'All Types'}</option>
                {noteTypes.map(type => (
                  <option key={type} value={type}>
                    {t.members.noteTypes[type as keyof typeof t.members.noteTypes]}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher dans les notes...' : locale === 'es' ? 'Buscar en las notas...' : 'Search notes...'}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
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
                        {noteTypes.map(type => (
                          <option key={type} value={type}>
                            {t.members.noteTypes[type as keyof typeof t.members.noteTypes]}
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
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {allNotes.length === 0
                  ? (locale === 'fr' ? 'Aucune note pour le moment' : locale === 'es' ? 'Aún no hay notas' : 'No notes yet')
                  : (locale === 'fr' ? 'Aucune note ne correspond aux filtres' : locale === 'es' ? 'Ninguna nota coincide con los filtros' : 'No notes match your filters')
                }
              </p>
              {allNotes.length === 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  {locale === 'fr' ? 'Commencez par ajouter une note' : locale === 'es' ? 'Comienza agregando una nota' : 'Start by adding your first note'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {editingNoteId === note.id ? (
                    /* Edit Mode */
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{t.members.notes.editNote}</h3>
                        <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Session selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'fr' ? 'Lier à une séance (optionnel)' : locale === 'es' ? 'Vincular a una sesión (opcional)' : 'Link to Session (optional)'}
                        </label>
                        <select
                          value={editSessionId}
                          onChange={(e) => setEditSessionId(e.target.value)}
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
                            value={editMilestoneId}
                            onChange={(e) => setEditMilestoneId(e.target.value)}
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.members.notes.noteTitle}</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.members.notes.noteContent} *</label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t.members.notes.noteType}</label>
                          <select
                            value={editNoteType}
                            onChange={(e) => setEditNoteType(e.target.value as NoteType)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                          >
                            {noteTypes.map(type => (
                              <option key={type} value={type}>
                                {t.members.noteTypes[type as keyof typeof t.members.noteTypes]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editIsPrivate}
                              onChange={(e) => setEditIsPrivate(e.target.checked)}
                              className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                            />
                            <Lock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{t.members.notes.private}</span>
                          </label>
                        </div>
                      </div>

                      {/* Existing images */}
                      {existingImageUrls.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {locale === 'fr' ? 'Images existantes' : locale === 'es' ? 'Imágenes existentes' : 'Existing images'}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {existingImageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                <button
                                  onClick={() => removeExistingImage(index)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New images for edit */}
                      <div>
                        <input
                          ref={editImageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleEditImageSelect}
                          className="hidden"
                        />
                        <button
                          onClick={() => editImageInputRef.current?.click()}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <ImagePlus className="w-4 h-4" />
                          {locale === 'fr' ? 'Ajouter des images' : locale === 'es' ? 'Agregar imágenes' : 'Add images'}
                        </button>
                        {editImagePreviews.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {editImagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img src={preview} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                <button
                                  onClick={() => removeEditImage(index)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={cancelEditing}>
                          {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                        </Button>
                        <Button
                          onClick={handleSaveEdit}
                          disabled={savingEdit || !editContent.trim()}
                          className="bg-gray-900 text-white hover:bg-gray-800"
                        >
                          {savingEdit ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : null}
                          {t.members.notes.save}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Badges row */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${noteTypeColors[note.note_type].bg} ${noteTypeColors[note.note_type].text}`}>
                              {t.members.noteTypes[note.note_type as keyof typeof t.members.noteTypes]}
                            </span>
                            {note.session_id && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                <LinkIcon className="w-3 h-3" />
                                {getSessionLabel(note.session_id)}
                              </span>
                            )}
                            {note.milestone_id && (note as any).milestones?.title && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                <Target className="w-3 h-3" />
                                {(note as any).milestones.title}
                              </span>
                            )}
                            {note.is_private && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <Lock className="w-3 h-3" />
                                {t.members.notes.private}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          {note.title && (
                            <h4 className="font-medium text-gray-900 mb-1">{note.title}</h4>
                          )}

                          {/* Content */}
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-all">{note.content}</p>

                          {/* Images */}
                          {note.image_urls && note.image_urls.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {note.image_urls.map((url, index) => (
                                <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={url}
                                    alt=""
                                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Date */}
                          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatNoteDate(note.created_at)}
                            {note.updated_at !== note.created_at && (
                              <span className="ml-2">
                                ({locale === 'fr' ? 'modifiée' : locale === 'es' ? 'editada' : 'edited'})
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title={t.members.notes.editNote}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deletingNoteId === note.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                {locale === 'fr' ? 'Confirmer' : locale === 'es' ? 'Confirmar' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setDeletingNoteId(null)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingNoteId(note.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title={t.members.notes.delete}
                            >
                              <Trash2 className="w-4 h-4" />
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
