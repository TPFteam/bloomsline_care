'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  ZoomIn,
  ZoomOut,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
import { useFloatingNotes } from '@/lib/floating-notes/context'
import { EditSessionModal } from '@/components/EditSessionModal'
import { getUserPreferences, updateUserPreferences } from '@/lib/services/preferences'
import { TutorialVideo } from '@/components/ui/tutorial-video'

interface NotesTabProps {
  memberId: string
  sessions: MemberSession[]
  notes: ProgressNote[]
  onNotesUpdate: () => void
  onSessionsUpdate?: () => void
  member?: Member
  highlightNoteId?: string
}

type ActiveCategory = 'sessions' | 'observations' | 'browse'
type NoteFilter = 'all' | 'session' | 'general' | 'goal'

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

// Matches TAG_COLOR_PALETTE order from RichTextEditor (by DEFAULT_NOTE_TYPES index)
// 0 red, 1 blue, 2 orange, 3 violet, 4 yellow, 5 pink, 6 emerald, 7 indigo, 8 cyan, 9 fuchsia
const noteTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  general:             { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-l-red-400' },
  recurrence:          { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-l-blue-400' },
  hypothese:           { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-l-orange-400' },
  symptome:            { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-l-violet-400' },
  transfert:           { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-l-yellow-400' },
  contre_transfert:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-l-pink-400' },
  ajustement_envisage: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400' },
  milestone:           { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-l-green-400' },
}
// Follows TAG_COLOR_PALETTE indices 7+ for custom types
const extraColorPool = [
  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-l-indigo-400' },
  { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-l-cyan-400' },
  { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-l-fuchsia-400' },
  { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-l-red-400' },
  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-l-blue-400' },
  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-l-orange-400' },
  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-l-violet-400' },
  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-l-yellow-400' },
  { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-l-pink-400' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400' },
]
const dynamicColorCache: Record<string, { bg: string; text: string; border: string }> = {}
let colorIndex = 0
const getNoteColor = (type: string) => {
  if (noteTypeColors[type]) return noteTypeColors[type]
  if (!dynamicColorCache[type]) {
    dynamicColorCache[type] = extraColorPool[colorIndex % extraColorPool.length]
    colorIndex++
  }
  return dynamicColorCache[type]
}

/** Strip HTML tags and decode entities like &nbsp; */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

// Extract only text inside <mark data-tag="..."> for the given tag types
function extractTaggedText(html: string, tags: string[]): string {
  const fragments: string[] = []
  for (const tag of tags) {
    const regex = new RegExp(`<mark[^>]*data-tag="${tag}"[^>]*>(.*?)</mark>`, 'gis')
    let match
    while ((match = regex.exec(html)) !== null) {
      const text = stripHtml(match[1]).trim()
      if (text) fragments.push(text)
    }
  }
  return fragments.join(' ... ')
}

// Same but returns structured fragments with tag info
function extractTaggedFragments(html: string, tags: string[]): { tag: string; label: string; text: string }[] {
  const fragments: { tag: string; label: string; text: string }[] = []
  for (const tag of tags) {
    const regex = new RegExp(`<mark[^>]*data-tag="${tag}"[^>]*?data-tag-label="([^"]*)"[^>]*>(.*?)</mark>`, 'gis')
    let match
    while ((match = regex.exec(html)) !== null) {
      const text = stripHtml(match[2]).trim()
      if (text) fragments.push({ tag, label: match[1], text })
    }
    // Fallback: try without data-tag-label
    if (!fragments.some(f => f.tag === tag)) {
      const fallbackRegex = new RegExp(`<mark[^>]*data-tag="${tag}"[^>]*>(.*?)</mark>`, 'gis')
      let m
      while ((m = fallbackRegex.exec(html)) !== null) {
        const text = stripHtml(m[1]).trim()
        if (text) fragments.push({ tag, label: tag, text })
      }
    }
  }
  return fragments
}

const defaultNoteTypes: readonly string[] = DEFAULT_NOTE_TYPES
const fixedNoteTypes: readonly string[] = FIXED_NOTE_TYPES
const deletableDefaults: readonly string[] = DELETABLE_DEFAULT_NOTE_TYPES

export default function NotesTab({ memberId, sessions, notes: initialNotes, onNotesUpdate, onSessionsUpdate, member, highlightNoteId }: NotesTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editImageInputRef = useRef<HTMLInputElement>(null)
  const notepadInputRef = useRef<HTMLTextAreaElement>(null)
  const notepadStreamRef = useRef<HTMLDivElement>(null)
  const notepadImageInputRef = useRef<HTMLInputElement>(null)

  // Floating notes
  const { floatingNote, openFloat, dockNote } = useFloatingNotes()

  // Zoom
  const [notesZoom, setNotesZoom] = useState(100)
  useEffect(() => {
    getUserPreferences().then(prefs => setNotesZoom(prefs.notes_zoom))
  }, [])
  const handleZoomChange = useCallback((delta: number) => {
    setNotesZoom(prev => {
      const next = Math.min(200, Math.max(80, prev + delta))
      updateUserPreferences({ notes_zoom: next })
      return next
    })
  }, [])

  // Category & selection
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('sessions')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // External highlight (e.g. from Pulse citation click) — switch to Browse subtab,
  // auto-select the note (renders the detail pane), and scroll its row into view.
  useEffect(() => {
    if (!highlightNoteId) return
    // The "Browse" UI tab maps internally to activeCategory === 'observations'
    // (the 'sessions' category shows session cards, not individual notes).
    setActiveCategory('observations')
    setSelectedItemId(highlightNoteId)
    setEditingNoteId(null)
    setDeletingNoteId(null)
    const t = setTimeout(() => {
      const el = document.querySelector(`[data-note-row="${highlightNoteId}"]`) as HTMLElement | null
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
    return () => clearTimeout(t)
  }, [highlightNoteId])

  // Edit session modal
  const [editingSessionModal, setEditingSessionModal] = useState(false)

  // All notes (fetched without limit)
  const [allNotes, setAllNotes] = useState<ProgressNote[]>(initialNotes)
  const [loading, setLoading] = useState(true)

  // Milestones for linking
  const [milestones, setMilestones] = useState<{ id: string; title: string; status: string }[]>([])

  // Custom note types
  const [customNoteTypes, setCustomNoteTypes] = useState<string[]>([])
  const [hiddenDefaults, setHiddenDefaults] = useState<string[]>([])
  // Whether this practitioner sees the legacy 7 defaults or just the 2 fixed ones.
  // Existing practitioners (signed up before this change) keep the legacy set;
  // new signups start with only `recurrence` + `hypothese` as defaults.
  const [usesLegacyDefaults, setUsesLegacyDefaults] = useState<boolean>(false)

  // Fetch the legacy-tags flag for the current user
  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      supabase
        .from('users')
        .select('uses_legacy_default_tags')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return
          setUsesLegacyDefaults(!!data?.uses_legacy_default_tags)
        })
    })
    return () => { cancelled = true }
  }, [supabase])
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false)
  const [customTypeValue, setCustomTypeValue] = useState('')
  const customTypeInputRef = useRef<HTMLInputElement>(null)
  const [customTypeMenu, setCustomTypeMenu] = useState<{ type: string; x: number; y: number } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [renamingType, setRenamingType] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const customTypeMenuRef = useRef<HTMLDivElement>(null)
  const longPressTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Effective default tags depend on the legacy flag:
  //   legacy practitioner → all 7 (recurrence, hypothese, general, symptome, transfert, contre_transfert, ajustement_envisage)
  //   new practitioner    → just 2 (recurrence, hypothese)
  const effectiveDefaultTags: readonly string[] = usesLegacyDefaults
    ? defaultNoteTypes
    : fixedNoteTypes
  const visibleDefaults = effectiveDefaultTags.filter(t => !hiddenDefaults.includes(t))
  const allNoteTypes = [...visibleDefaults, ...customNoteTypes]

  // ==============================
  // NOTEPAD MODE STATE
  // ==============================
  const [padSessionId, setPadSessionId] = useState<string>('')
  const [padMilestoneId, setPadMilestoneId] = useState<string>('')
  const [padNoteType, setPadNoteType] = useState<NoteType>('')
  const [padInput, setPadInput] = useState('')
  const [padRichContent, setPadRichContent] = useState('')
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
  // SESSION NOTES SUB-TAB STATE
  // ==============================
  const [snSelectedSessionId, setSnSelectedSessionId] = useState<string>('')
  const [snSummaryDraft, setSnSummaryDraft] = useState('')
  const [snSavingSummary, setSnSavingSummary] = useState(false)
  const [snSessionSummaryNotes, setSnSessionSummaryNotes] = useState<Record<string, { id: string; content: string; created_at: string; attachments?: { url: string; filename: string; size: number }[] } | null>>({})
  const [snEditorNoteTypes, setSnEditorNoteTypes] = useState<{ type: string; label: string }[]>([])
  const [snIsEditing, setSnIsEditing] = useState(false)
  const snAutoSavedId = useRef<string | null>(null) // track autosaved note id without triggering re-render
  const [snShowPast, setSnShowPast] = useState(false)
  const [snAttachments, setSnAttachments] = useState<{ url: string; filename: string; size: number }[]>([])
  const [snLightboxIndex, setSnLightboxIndex] = useState<number | null>(null)
  const [snLightboxZoom, setSnLightboxZoom] = useState(1)
  // Session detail editing (unified with note editing)
  const [snEditSessionType, setSnEditSessionType] = useState('')
  const [snEditSessionFormat, setSnEditSessionFormat] = useState('')
  const [snEditDuration, setSnEditDuration] = useState(60)
  const [practitionerSessionTypes, setPractitionerSessionTypes] = useState<{ id: string; name: string; duration: number }[]>([])

  // Fetch practitioner's configured session types
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('booking_settings').select('session_types').eq('user_id', user.id).single().then(({ data }) => {
        if (data?.session_types) setPractitionerSessionTypes(data.session_types as { id: string; name: string; duration: number }[])
      })
    })
  }, [supabase])

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
  const [browseSessionFilters, setBrowseSessionFilters] = useState<string[]>([])
  const [browseMilestoneFilters, setBrowseMilestoneFilters] = useState<string[]>([])
  // Airtable-style filter conditions (value is array for multi-select)
  const [browseFilterRows, setBrowseFilterRows] = useState<{ field: string; operator: string; values: string[] }[]>([])
  const [filterConjunction, setFilterConjunction] = useState<'and' | 'or'>('and')
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<number | null>(null)
  const [filterDropdownPending, setFilterDropdownPending] = useState<string[]>([])
  const [showSessions, setShowSessions] = useState(true)
  const [browseHighlightTag, setBrowseHighlightTag] = useState<string | undefined>()
  const [showGoals, setShowGoals] = useState(true)
  const [showTagged, setShowTagged] = useState(true)
  const [obsConjunction, setObsConjunction] = useState<'and' | 'or'>('and')

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

  // Fetch milestone comments and merge as virtual notes for Browse
  const [milestoneComments, setMilestoneComments] = useState<ProgressNote[]>([])
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Only fetch comments for milestones belonging to THIS member
      const { data: memberMilestones } = await supabase
        .from('milestones')
        .select('id')
        .eq('member_id', memberId)
      const milestoneIds = memberMilestones?.map(m => m.id) || []
      if (milestoneIds.length === 0) { setMilestoneComments([]); return }

      const { data } = await supabase
        .from('milestone_comments')
        .select('*, milestones(title)')
        .eq('practitioner_id', user.id)
        .in('milestone_id', milestoneIds)
        .order('created_at', { ascending: false })
      if (data) {
        // Convert comments to ProgressNote-like shape for Browse filtering
        setMilestoneComments(data.map((c: any) => ({
          id: `comment-${c.id}`,
          member_id: memberId,
          practitioner_id: c.practitioner_id,
          content: c.content,
          note_type: c.tag || 'general',
          title: (c.milestones as any)?.title ? `${(c.milestones as any).title}` : '',
          session_id: null,
          milestone_id: c.milestone_id,
          created_at: c.created_at,
          updated_at: c.updated_at,
          image_urls: null,
          is_private: false,
        } as ProgressNote)))
      }
    })()
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

  const handleEditorAddType = useCallback((typeName: string) => {
    const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined
    const label = noteTypeLabels?.[typeName] || typeName.replace(/_/g, ' ')
    setSnEditorNoteTypes(prev => {
      if (prev.some(nt => nt.type === typeName)) return prev
      return [...prev, { type: typeName, label }]
    })
    // Also add to observation custom types
    setCustomNoteTypes(prev => prev.includes(typeName) ? prev : [...prev, typeName])
    saveCustomType(typeName)
  }, [t, saveCustomType])

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

    if (padNoteType === typeName) setPadNoteType('')
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

  // Wrappers for RichTextEditor tag management
  const handleEditorRenameType = (oldName: string, newName: string) => {
    renameCustomType(oldName, newName)
    const val = newName.trim().toLowerCase().replace(/\s+/g, '_')
    if (val && val !== oldName) {
      const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined
      const label = noteTypeLabels?.[val] || val.replace(/_/g, ' ')
      setSnEditorNoteTypes(prev => prev.map(nt => nt.type === oldName ? { type: val, label } : nt))
    }
  }

  const handleEditorDeleteType = async (typeName: string, reassignTo: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Reassign notes whose note_type matches
    await supabase.from('progress_notes')
      .update({ note_type: reassignTo })
      .eq('practitioner_id', user.id)
      .eq('note_type', typeName)

    // 2. For notes with inline <mark data-tag="typeName"> in content,
    //    unwrap the mark tags (keep text, remove the mark wrapper)
    //    Uses DOM parsing as fallback if regex fails (nested/malformed marks)
    const notesWithInlineTag = allNotes.filter(n =>
      n.content.includes(`data-tag="${typeName}"`)
    )
    for (const note of notesWithInlineTag) {
      let updated = note.content
      try {
        // Try regex first (fast path)
        updated = note.content.replace(
          new RegExp(`<mark[^>]*data-tag="${typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>(.*?)</mark>`, 'gis'),
          '$1'
        )
        // If regex didn't change anything, try DOM-based unwrap as fallback
        if (updated === note.content) {
          const doc = new DOMParser().parseFromString(note.content, 'text/html')
          const marks = doc.querySelectorAll(`mark[data-tag="${typeName}"]`)
          marks.forEach(mark => {
            const parent = mark.parentNode
            if (parent) {
              while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
              parent.removeChild(mark)
            }
          })
          updated = doc.body.innerHTML
        }
      } catch {
        // Last resort: DOM-based unwrap
        try {
          const doc = new DOMParser().parseFromString(note.content, 'text/html')
          doc.querySelectorAll(`mark[data-tag="${typeName}"]`).forEach(mark => {
            const parent = mark.parentNode
            if (parent) {
              while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
              parent.removeChild(mark)
            }
          })
          updated = doc.body.innerHTML
        } catch { /* give up gracefully */ }
      }
      if (updated !== note.content) {
        await supabase.from('progress_notes')
          .update({ content: updated })
          .eq('id', note.id)
      }
    }

    deleteNoteType(typeName)
    setSnEditorNoteTypes(prev => prev.filter(nt => nt.type !== typeName))
    fetchAllNotes()
    onNotesUpdate()
  }

  const getTagNoteCount = (typeName: string): number => {
    return allNotes.filter(n =>
      n.note_type === typeName || n.content.includes(`data-tag="${typeName}"`)
    ).length
  }

  // Close custom type menu on outside click + clamp to viewport
  useEffect(() => {
    if (!customTypeMenu) return
    const handleClick = (e: MouseEvent) => {
      if (customTypeMenuRef.current && !customTypeMenuRef.current.contains(e.target as Node)) {
        setCustomTypeMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    // Clamp menu position to stay within viewport
    requestAnimationFrame(() => {
      const menu = customTypeMenuRef.current
      if (!menu) return
      const rect = menu.getBoundingClientRect()
      let { x, y } = customTypeMenu
      if (rect.right > window.innerWidth - 8) x = window.innerWidth - rect.width - 8
      if (rect.bottom > window.innerHeight - 8) y = window.innerHeight - rect.height - 8
      if (x < 8) x = 8
      if (y < 8) y = 8
      if (x !== customTypeMenu.x || y !== customTypeMenu.y) {
        menu.style.left = `${x}px`
        menu.style.top = `${y}px`
      }
    })
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
          note_type: padNoteType || 'general',
          is_private: true,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        })

      if (error) throw error

      setPadInput('')
      setPadImages([])
      setPadImagePreviews([])
      setPadNoteType('')
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

  const handlePadRichSubmit = useCallback(async () => {
    const stripped = padRichContent.replace(/<[^>]*>/g, '').trim()
    if (!stripped) return
    if (padSaving) return

    setPadSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('progress_notes')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          session_id: padSessionId || null,
          milestone_id: padMilestoneId || null,
          title: null,
          content: padRichContent,
          note_type: padNoteType || 'general',
          is_private: true,
        })

      if (error) throw error

      setPadRichContent('')
      setPadNoteType('')
      fetchAllNotes()
      onNotesUpdate()
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error(t.members.errors.noteFailed)
    } finally {
      setPadSaving(false)
    }
  }, [padRichContent, padSaving, padSessionId, padMilestoneId, padNoteType, memberId])

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
          notepadStreamRef.current.scrollTo({ top: notepadStreamRef.current.scrollHeight, behavior: 'smooth' })
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

  // Observation notes (non-session-summary, newest first)
  const observationNotes = allNotes.filter(n => n.note_type !== 'session_summary')

  // Notes for notepad stream (chronological — oldest first)
  const notepadNotes = [...observationNotes].reverse()

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
    .filter(s => s.status === 'completed' || s.status === 'no_show' || s.status === 'cancelled' ||
      (s.status === 'scheduled' && new Date(s.scheduled_at) < now))
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  // Fetch session summary notes
  useEffect(() => {
    const fetchSessionSummaryNotes = async () => {
      const sessionIds = sessions.map(s => s.id)
      if (sessionIds.length === 0) return

      const { data, error } = await supabase
        .from('progress_notes')
        .select('id, content, created_at, session_id, attachments')
        .in('session_id', sessionIds)
        .eq('note_type', 'session_summary')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const summaryBySession: Record<string, { id: string; content: string; created_at: string; attachments?: { url: string; filename: string; size: number }[] } | null> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((note: any) => {
          if (note.session_id && !summaryBySession[note.session_id]) {
            summaryBySession[note.session_id] = {
              id: note.id,
              content: note.content,
              created_at: note.created_at,
              attachments: note.attachments || [],
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

      // Defaults shown depend on legacy flag — see effectiveDefaultTags above
      const baseDefaults = usesLegacyDefaults ? DEFAULT_NOTE_TYPES : FIXED_NOTE_TYPES
      const types: { type: string; label: string }[] = baseDefaults.map(nt => ({
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
  }, [supabase, t, usesLegacyDefaults])

  const handleSaveSessionNote = async (sessionId: string, content: string) => {
    if (!content.trim() && snAttachments.length === 0) return

    setSnSavingSummary(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const existing = snSessionSummaryNotes[sessionId]
      const existingId = existing?.id || snAutoSavedId.current

      if (existingId) {
        const { error } = await supabase
          .from('progress_notes')
          .update({ content: content.trim(), attachments: snAttachments, updated_at: new Date().toISOString() })
          .eq('id', existingId)

        if (error) throw error

        setSnSessionSummaryNotes(prev => ({
          ...prev,
          [sessionId]: { id: existingId, content: content.trim(), created_at: existing?.created_at || new Date().toISOString() },
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
            attachments: snAttachments,
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

      // Also update session details if changed
      try {
        await supabase
          .from('sessions')
          .update({
            session_type: snEditSessionType,
            session_format: snEditSessionFormat,
            duration_minutes: snEditDuration,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
      } catch (sessionErr) {
        console.warn('Could not update session details:', sessionErr)
      }

      snAutoSavedId.current = null
      setSnIsEditing(false)
      setSnSummaryDraft('')
      setSnAttachments([])
      fetchAllNotes()
      onNotesUpdate()
      onSessionsUpdate?.()
      toast.success(locale === 'fr' ? 'Séance enregistrée' : locale === 'es' ? 'Sesión guardada' : 'Session saved')
    } catch (error) {
      console.error('Error saving session summary:', error)
      toast.error(locale === 'fr' ? 'Échec de l\'enregistrement' : locale === 'es' ? 'Error al guardar' : 'Failed to save note')
    } finally {
      setSnSavingSummary(false)
    }
  }

  // Autosave for session notes — saves quietly without resetting editor
  const handleAutoSaveSessionNote = useCallback(async (content: string) => {
    if (!content.trim() || !selectedItemId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = snSessionSummaryNotes[selectedItemId]
    const existingId = existing?.id || snAutoSavedId.current
    if (existingId) {
      await supabase
        .from('progress_notes')
        .update({ content: content.trim(), updated_at: new Date().toISOString() })
        .eq('id', existingId)
    } else {
      const { data } = await supabase
        .from('progress_notes')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          session_id: selectedItemId,
          content: content.trim(),
          note_type: 'session_summary',
          is_private: true,
        })
        .select('id, content, created_at')
        .single()
      if (data) {
        // Store ID in ref so subsequent autosaves use UPDATE — no state change to avoid editor remount
        snAutoSavedId.current = data.id
      }
    }
  }, [selectedItemId, snSessionSummaryNotes, memberId, supabase])

  // ==============================
  // BROWSE MODE LOGIC
  // ==============================

  // Combine notes + milestone comments for Browse
  const browseNotes = [...allNotes, ...milestoneComments].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Filter notes
  const filteredNotes = browseNotes.filter(note => {
    // Legacy category filters
    if (noteFilter === 'session' && !note.session_id) return false
    if (noteFilter === 'session' && filterSessionId && note.session_id !== filterSessionId) return false
    if (noteFilter === 'general' && note.session_id) return false
    if (noteFilter === 'goal' && !note.milestone_id) return false
    if (noteFilter === 'goal' && filterMilestoneId && note.milestone_id !== filterMilestoneId) return false

    // Quick category toggles
    const isSessionNote = !!note.session_id || note.note_type === 'session_summary'
    const isGoalNote = !!note.milestone_id || !!note.title
    const isTaggedNote = !isSessionNote && !isGoalNote
    if (!showSessions && isSessionNote) return false
    if (!showGoals && isGoalNote) return false
    if (!showTagged && isTaggedNote) return false

    // Sentence-style filter rows with AND/OR conjunction
    const activeFilterRows = browseFilterRows.filter(row =>
      row.values.length > 0 || ['is_empty', 'is_not_empty'].includes(row.operator)
    )
    if (activeFilterRows.length > 0) {
      const rowResults = activeFilterRows.map(row => {
        if (row.field === 'tag') {
          const matchesAny = row.values.some(v => note.note_type === v || note.content.includes(`data-tag="${v}"`))
          return row.operator === 'is' ? matchesAny : !matchesAny
        } else if (row.field === 'goal') {
          if (row.operator === 'is') return row.values.includes(note.milestone_id || '')
          if (row.operator === 'is_not') return !row.values.includes(note.milestone_id || '')
          if (row.operator === 'is_empty') return !note.milestone_id
          if (row.operator === 'is_not_empty') return !!note.milestone_id
        } else if (row.field === 'session') {
          if (row.operator === 'is') return row.values.includes(note.session_id || '')
          if (row.operator === 'is_not') return !row.values.includes(note.session_id || '')
          if (row.operator === 'is_empty') return !note.session_id
          if (row.operator === 'is_not_empty') return !!note.session_id
        }
        return true
      })
      const passes = filterConjunction === 'and'
        ? rowResults.every(Boolean)
        : rowResults.some(Boolean)
      if (!passes) return false
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const plainContent = note.content.replace(/<[^>]*>/g, '').toLowerCase()
      const matchesTitle = note.title?.toLowerCase().includes(q)
      if (!matchesTitle && !plainContent.includes(q)) return false
    }
    return true
  })

  // Old-style filtered notes for Observations tab (uses pill filters with AND/OR)
  const obsFilteredNotes = browseNotes.filter(note => {
    // Collect results for each active filter group
    const conditions: boolean[] = []

    if (typeFilters.size > 0) {
      const wantsNoTag = typeFilters.has('__no_tag__')
      const tagFilters = [...typeFilters].filter(tf => tf !== '__no_tag__')
      const hasInlineTag = allNoteTypes.some(t2 => note.content.includes(`data-tag="${t2}"`))
      const hasExplicitType = note.note_type !== 'general' && allNoteTypes.includes(note.note_type)
      const hasAnyTag = hasInlineTag || hasExplicitType
      const matchesNoTag = wantsNoTag && !hasAnyTag
      const matchesTagFilter = tagFilters.length > 0 && (
        tagFilters.some(tag => note.note_type === tag) ||
        tagFilters.some(tag => note.content.includes(`data-tag="${tag}"`))
      )
      conditions.push(matchesNoTag || matchesTagFilter)
    }
    if (browseSessionFilters.length > 0) {
      conditions.push(!!(note.session_id && browseSessionFilters.includes(note.session_id)))
    }
    if (browseMilestoneFilters.length > 0) {
      conditions.push(!!(note.milestone_id && browseMilestoneFilters.includes(note.milestone_id)))
    }

    if (conditions.length > 0) {
      const passes = obsConjunction === 'and' ? conditions.every(Boolean) : conditions.some(Boolean)
      if (!passes) return false
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const plainContent = note.content.replace(/<[^>]*>/g, '').toLowerCase()
      if (!note.title?.toLowerCase().includes(q) && !plainContent.includes(q)) return false
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
    if (!editContent.replace(/<[^>]*>/g, '').trim()) {
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

  // Delete session note
  const handleDeleteSessionNote = async (sessionId: string) => {
    const existing = snSessionSummaryNotes[sessionId]
    if (!existing) return
    try {
      const { error } = await supabase
        .from('progress_notes')
        .delete()
        .eq('id', existing.id)
      if (error) throw error
      setSnSessionSummaryNotes(prev => ({ ...prev, [sessionId]: null }))
      setSnIsEditing(false)
      setSnSummaryDraft('')
      setDeletingNoteId(null)
      fetchAllNotes()
      onNotesUpdate()
      toast.success(locale === 'fr' ? 'Note supprimée' : locale === 'es' ? 'Nota eliminada' : 'Note deleted')
    } catch (error) {
      console.error('Error deleting session note:', error)
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

  // Selected note (browse)
  const selectedNote = (activeCategory === 'browse' || activeCategory === 'observations') && selectedItemId
    ? allNotes.find(n => n.id === selectedItemId) || milestoneComments.find(n => n.id === selectedItemId) || null
    : null

  // Selected session
  const selectedSession = activeCategory === 'sessions' && selectedItemId
    ? sessions.find(s => s.id === selectedItemId) || null
    : null
  const SelectedSessionIcon = selectedSession ? (snFormatIcon[selectedSession.session_format] || User) : User


  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '500px', maxHeight: 'calc(100vh - 200px)' }}>
      {/* Category tabs + zoom — always full width at top */}
      <div className="flex items-center border-b border-gray-100 bg-white flex-shrink-0">
        {([
          { key: 'sessions' as const, icon: FileText, label: 'Observations' },
          { key: 'observations' as const, icon: Search, label: locale === 'fr' ? 'Parcourir' : 'Browse' },
          // { key: 'browse' as const, icon: List, label: locale === 'fr' ? 'Parcourir+' : 'Browse+' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveCategory(tab.key)
              setSelectedItemId(null)
              setEditingNoteId(null)
              setDeletingNoteId(null)
            }}
            className={`flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-medium transition-all border-b-2 ${
              activeCategory === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        {/* Tutorial + Zoom controls */}
        <div className="flex items-center gap-1 ml-auto pr-3">
          <TutorialVideo
            videos={[
              {
                url: 'https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/ajouter%20des%20tags.mov',
                title: locale === 'fr' ? 'Taguer vos notes' : 'Tag your notes',
              },
              {
                url: 'https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/filtrer%20ses%20notes.mov',
                title: locale === 'fr' ? 'Naviguer dans vos notes' : 'Navigate your notes',
              },
              {
                url: 'https://sfzlbjdjqbzxruwzebjc.supabase.co/storage/v1/object/public/tutorials/short-video-demo-practitioners-app/personnaliser%20ses%20tags.mov',
                title: locale === 'fr' ? 'Personnaliser vos tags' : 'Customize your tags',
              },
            ]}
          />
        </div>
        <div className="flex items-center gap-0.5 pr-3">
          <button
            onClick={() => handleZoomChange(-10)}
            disabled={notesZoom <= 80}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={locale === 'fr' ? 'Réduire' : 'Zoom out'}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-gray-400 tabular-nums w-8 text-center">{notesZoom}%</span>
          <button
            onClick={() => handleZoomChange(10)}
            disabled={notesZoom >= 200}
            className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title={locale === 'fr' ? 'Agrandir' : 'Zoom in'}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
      {/* ================================ */}
      {/* LEFT PANEL                       */}
      {/* ================================ */}
      <div className={`${activeCategory === 'browse' || activeCategory === 'observations' ? 'w-0 overflow-hidden border-0' : 'w-60 lg:w-80 border-r border-gray-100'} flex flex-col flex-shrink-0 transition-all`}>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {/* SESSIONS ITEMS */}
          {activeCategory === 'sessions' && (
            sessions.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  {locale === 'fr' ? 'Aucune séance' : 'No sessions'}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {snUpcoming.length > 0 && (
                  <div>
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {locale === 'fr' ? 'À venir' : 'Upcoming'}
                        <span className="ml-auto px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold normal-case tracking-normal">
                          {snUpcoming.length}
                        </span>
                      </p>
                    </div>
                    <div className="px-2 space-y-0.5">
                      {snUpcoming.map(s => {
                        const hasNote = !!snSessionSummaryNotes[s.id]
                        const notePreview = snSessionSummaryNotes[s.id]?.content ? stripHtml(snSessionSummaryNotes[s.id]!.content).slice(0, 60) : ''
                        const isSelected = selectedItemId === s.id
                        const FormatIcon = snFormatIcon[s.session_format] || User
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedItemId(s.id)
                              setSnSelectedSessionId(s.id)
                              setSnIsEditing(false)
                              setSnSummaryDraft('')
                              snAutoSavedId.current = null
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-blue-50 ring-1 ring-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <FormatIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-xs truncate ${isSelected || !hasNote ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                                    {t.members.sessionTypes[s.session_type as keyof typeof t.members.sessionTypes] || s.session_type}
                                  </p>
                                  <span className="text-[10px] text-gray-400 ml-auto tabular-nums flex-shrink-0">
                                    {new Date(s.scheduled_at).toLocaleDateString(
                                      locale === 'fr' ? 'fr-FR' : 'en-US',
                                      { weekday: 'short', month: 'short', day: 'numeric' }
                                    )}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                  {hasNote
                                    ? notePreview
                                    : (locale === 'fr' ? 'Pas encore de note...' : 'No note yet...')
                                  }
                                </p>
                              </div>
                              {!hasNote && (
                                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {snUpcoming.length > 0 && snCompleted.length > 0 && (
                  <div className="mx-4 my-1.5 border-t border-gray-100" />
                )}

                {snCompleted.length > 0 && (
                  <div>
                    <div className="px-4 pt-2 pb-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        {locale === 'fr' ? 'Terminées' : 'Completed'}
                        <span className="ml-auto px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold normal-case tracking-normal">
                          {snCompleted.length}
                        </span>
                      </p>
                    </div>
                    <div className="px-2 space-y-0.5">
                      {snCompleted.map(s => {
                        const hasNote = !!snSessionSummaryNotes[s.id]
                        const notePreview = snSessionSummaryNotes[s.id]?.content ? stripHtml(snSessionSummaryNotes[s.id]!.content).slice(0, 60) : ''
                        const isSelected = selectedItemId === s.id
                        const FormatIcon = snFormatIcon[s.session_format] || User
                        const statusStyle: Record<string, { bg: string; text: string; label: string; labelFr: string }> = {
                          completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Completed', labelFr: 'Terminée' },
                          no_show: { bg: 'bg-red-50', text: 'text-red-600', label: 'No show', labelFr: 'Absent' },
                          cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled', labelFr: 'Annulée' },
                          scheduled: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Missed', labelFr: 'Manquée' },
                        }
                        const st = statusStyle[s.status] || statusStyle.completed
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setSelectedItemId(s.id)
                              setSnSelectedSessionId(s.id)
                              setSnIsEditing(false)
                              setSnSummaryDraft('')
                              snAutoSavedId.current = null
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-blue-50 ring-1 ring-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isSelected ? 'bg-gray-900 text-white' : hasNote ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                <FormatIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className={`text-xs truncate ${isSelected || !hasNote ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                                    {t.members.sessionTypes[s.session_type as keyof typeof t.members.sessionTypes] || s.session_type}
                                  </p>
                                  <span className="text-[10px] text-gray-400 ml-auto tabular-nums flex-shrink-0">
                                    {new Date(s.scheduled_at).toLocaleDateString(
                                      locale === 'fr' ? 'fr-FR' : 'en-US',
                                      { weekday: 'short', month: 'short', day: 'numeric' }
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {s.status !== 'completed' && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0 ${st.bg} ${st.text}`}>
                                      {locale === 'fr' ? st.labelFr : st.label}
                                    </span>
                                  )}
                                  <p className="text-[11px] text-gray-400 truncate">
                                    {hasNote
                                      ? notePreview
                                      : (locale === 'fr' ? 'Pas encore de note...' : 'No note yet...')
                                    }
                                  </p>
                                </div>
                              </div>
                              {!hasNote && (
                                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-2" title={locale === 'fr' ? 'Vide' : 'Empty'} />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Browse mode hides left panel items list — filters move to right panel */}
        </div>
      </div>


      {/* ================================ */}
      {/* RIGHT PANEL                      */}
      {/* ================================ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white min-h-0">


        {/* ---- SESSIONS: EMPTY STATE (nothing selected) ---- */}
        {activeCategory === 'sessions' && !selectedItemId && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <FileText className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              {locale === 'fr' ? 'Sélectionnez une séance pour rédiger ou voir sa note' : locale === 'es' ? 'Selecciona una sesión para escribir o ver su nota' : 'Select a session to write or view its note'}
            </p>
          </div>
        )}

        {/* ---- SESSIONS: SESSION DETAIL (selected) ---- */}
        {activeCategory === 'sessions' && selectedItemId && selectedSession && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Session header */}
            <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-gray-100">
              <button
                onClick={() => { setSelectedItemId(null); setSnIsEditing(false); setSnSummaryDraft('') }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                <SelectedSessionIcon className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {t.members.sessionTypes[selectedSession.session_type as keyof typeof t.members.sessionTypes] || selectedSession.session_type}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(selectedSession.scheduled_at).toLocaleDateString(
                    locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US',
                    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }
                  )}
                  {' · '}
                  {t.members.sessionFormats[selectedSession.session_format as keyof typeof t.members.sessionFormats] || selectedSession.session_format}
                  {' · '}
                  {selectedSession.duration_minutes} {t.members.sessions.minutes}
                </p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                selectedSession.status === 'completed' ? 'bg-emerald-50 text-emerald-700'
                : selectedSession.status === 'scheduled' ? 'bg-blue-50 text-blue-700'
                : selectedSession.status === 'cancelled' ? 'bg-gray-100 text-gray-500'
                : selectedSession.status === 'no_show' ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-700'
              }`}>
                {t.members.sessionStatus[selectedSession.status as keyof typeof t.members.sessionStatus] || selectedSession.status}
              </span>
            </div>

            {/* Edit Session Modal */}
            <EditSessionModal
              session={editingSessionModal ? selectedSession : null}
              onClose={() => setEditingSessionModal(false)}
              onSave={() => onSessionsUpdate?.()}
            />

            {/* Cancellation reason */}
            {(selectedSession.status === 'cancelled' || selectedSession.status === 'no_show') && ((selectedSession as any).cancellation_reason || selectedSession.notes) && (
              <div className="mx-5 mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    {(selectedSession as any).cancellation_reason && (
                      <span className="text-gray-600 font-medium">
                        {(() => {
                          const reasons: Record<string, string> = {
                            client_request: locale === 'fr' ? 'Demande du patient' : 'Client request',
                            practitioner_unavailable: locale === 'fr' ? 'Praticien indisponible' : 'Practitioner unavailable',
                            scheduling_conflict: locale === 'fr' ? "Conflit d'agenda" : 'Scheduling conflict',
                            illness: locale === 'fr' ? 'Maladie' : 'Illness',
                            personal_reasons: locale === 'fr' ? 'Raisons personnelles' : 'Personal reasons',
                            rescheduled: locale === 'fr' ? 'Reprogrammée' : 'Rescheduled',
                            no_communication: locale === 'fr' ? 'Aucune communication' : 'No communication',
                            forgot: locale === 'fr' ? 'Patient a oublié' : 'Client forgot',
                            late_cancellation: locale === 'fr' ? 'Annulation tardive' : 'Late cancellation',
                            technical_issue: locale === 'fr' ? 'Problème technique' : 'Technical issue',
                            emergency: locale === 'fr' ? 'Urgence' : 'Emergency',
                            other: locale === 'fr' ? 'Autre' : 'Other',
                          }
                          return reasons[(selectedSession as any).cancellation_reason] || (selectedSession as any).cancellation_reason
                        })()}
                      </span>
                    )}
                    {(selectedSession as any).cancellation_reason && selectedSession.notes && <span className="text-gray-300 mx-1">·</span>}
                    {selectedSession.notes && <span className="text-gray-400">{selectedSession.notes.replace(/&nbsp;/g, ' ').replace(/<[^>]*>/g, '')}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Editor / read content */}
            <div className="flex-1 overflow-y-auto px-5">
              {/* Unified action bar — always visible */}
              {!snIsEditing && (
                <div className="flex items-center justify-end gap-1 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      const existing = snSessionSummaryNotes[selectedItemId]
                      setSnSummaryDraft(existing?.content || '')
                      setSnAttachments(existing?.attachments || [])
                      setSnEditSessionType(selectedSession.session_type)
                      setSnEditSessionFormat(selectedSession.session_format)
                      setSnEditDuration(selectedSession.duration_minutes)
                      setSnIsEditing(true)
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    title={locale === 'fr' ? 'Modifier' : 'Edit'}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {snSessionSummaryNotes[selectedItemId] && (
                    <button
                      type="button"
                      onClick={() => setDeletingNoteId(snSessionSummaryNotes[selectedItemId]!.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {snIsEditing ? (
                <div className="flex flex-col">
                  {/* Session detail fields */}
                  <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{locale === 'fr' ? 'Type' : 'Type'}</label>
                      <select value={snEditSessionType} onChange={(e) => { setSnEditSessionType(e.target.value); const match = practitionerSessionTypes.find(t => t.id === e.target.value); if (match) setSnEditDuration(match.duration) }} className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">
                        {practitionerSessionTypes.length > 0 ? (
                          practitionerSessionTypes.map(st => {
                            const frNames: Record<string, string> = { initial: 'Consultation initiale', follow_up: 'Séance de suivi', check_in: 'Point de situation' }
                            const label = locale === 'fr' && frNames[st.id] ? frNames[st.id] : st.name
                            return <option key={st.id} value={st.id}>{label}</option>
                          })
                        ) : (
                          <>
                            <option value="initial_consultation">{locale === 'fr' ? 'Consultation initiale' : 'Initial Consultation'}</option>
                            <option value="follow_up">{locale === 'fr' ? 'Séance de suivi' : 'Follow-up'}</option>
                            <option value="check_in">{locale === 'fr' ? 'Point de situation' : 'Check-in'}</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{locale === 'fr' ? 'Format' : 'Format'}</label>
                      <select value={snEditSessionFormat} onChange={(e) => setSnEditSessionFormat(e.target.value)} className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">
                        <option value="in_person">{locale === 'fr' ? 'En personne' : 'In person'}</option>
                        <option value="virtual">{locale === 'fr' ? 'Vidéo' : 'Video'}</option>
                        <option value="phone">{locale === 'fr' ? 'Téléphone' : 'Phone'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{locale === 'fr' ? 'Durée' : 'Duration'}</label>
                      <select value={snEditDuration} onChange={(e) => setSnEditDuration(parseInt(e.target.value))} className="w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white">
                        {[15, 20, 25, 30, 45, 50, 60, 75, 90, 120].map(d => (
                          <option key={d} value={d}>{d} min</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={notesZoom !== 100 ? { zoom: notesZoom / 100 } : undefined}>
                    <RichTextEditor
                      value={snSummaryDraft}
                      onChange={setSnSummaryDraft}
                      placeholder={locale === 'fr' ? 'Rédigez votre note de séance...' : locale === 'es' ? 'Escribe tu nota de sesión...' : 'Write your session note...'}
                      memberId={memberId}
                      locale={locale}
                      autoFocus
                      milestones={milestones}
                      noteTypes={snEditorNoteTypes}
                      lockedTypes={effectiveDefaultTags as unknown as string[]}
                      onAddType={handleEditorAddType}
                      onRenameType={handleEditorRenameType}
                      onDeleteType={handleEditorDeleteType}
                      getTagNoteCount={getTagNoteCount}
                      maxTypes={7}
                      memberName={member?.first_name}
                      attachments={snAttachments}
                      onAttachmentsChange={setSnAttachments}
                      attachmentStoragePath={`notes/${memberId}/${selectedItemId}`}
                      onAutoSave={handleAutoSaveSessionNote}
                      toolbarActions={
                        <div className="flex items-center gap-1.5">
                          {snSessionSummaryNotes[selectedItemId] && (
                              <button
                                type="button"
                                onClick={() => setDeletingNoteId(snSessionSummaryNotes[selectedItemId]!.id)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSnIsEditing(false)
                              setSnSummaryDraft('')
                            }}
                            className="px-2.5 py-1 rounded-md text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                          >
                            {locale === 'fr' ? 'Annuler' : locale === 'es' ? 'Cancelar' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveSessionNote(selectedItemId, snSummaryDraft)}
                            disabled={snSavingSummary || (!snSummaryDraft.trim() && snAttachments.length === 0)}
                            className="px-2.5 py-1 rounded-md text-xs bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {snSavingSummary ? (
                              <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                            ) : null}
                            {locale === 'fr' ? 'Enregistrer' : locale === 'es' ? 'Guardar' : 'Save'}
                          </button>
                        </div>
                      }
                    />
                  </div>
                </div>
              ) : snSessionSummaryNotes[selectedItemId] ? (
                <div className="py-4">
                  {/* Read-only attachment thumbnails */}
                  {(snSessionSummaryNotes[selectedItemId]!.attachments || []).length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap mb-4 pb-3 border-b border-gray-100">
                      {(snSessionSummaryNotes[selectedItemId]!.attachments || []).map((att, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSnLightboxIndex(i); setSnLightboxZoom(1) }}
                          className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden hover:border-teal-300 hover:shadow-sm transition-all bg-white"
                        >
                          <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {snSessionSummaryNotes[selectedItemId]!.content.trim() && (
                    <MarkdownRenderer
                      content={snSessionSummaryNotes[selectedItemId]!.content.replace(/&nbsp;/g, ' ')}
                      className="leading-relaxed"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col" style={notesZoom !== 100 ? { zoom: notesZoom / 100 } : undefined}>
                  <RichTextEditor
                    value={snSummaryDraft}
                    onChange={setSnSummaryDraft}
                    placeholder={locale === 'fr' ? 'Commencez à écrire vos notes de séance...' : locale === 'es' ? 'Comience a escribir sus notas de sesión...' : 'Start writing your session notes...'}
                    memberId={memberId}
                    locale={locale}
                    autoFocus
                    milestones={milestones}
                    noteTypes={snEditorNoteTypes}
                    memberName={member?.first_name}
                    attachments={snAttachments}
                    onAttachmentsChange={setSnAttachments}
                    attachmentStoragePath={`notes/${memberId}/${selectedItemId}`}
                    onAutoSave={handleAutoSaveSessionNote}
                    toolbarActions={
                      <button
                        type="button"
                        onClick={() => handleSaveSessionNote(selectedItemId, snSummaryDraft)}
                        disabled={snSavingSummary || (!snSummaryDraft.trim() && snAttachments.length === 0)}
                        className="px-2.5 py-1 rounded-md text-xs bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        {snSavingSummary ? (
                          <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                        ) : null}
                        {locale === 'fr' ? 'Enregistrer' : locale === 'es' ? 'Guardar' : 'Save'}
                      </button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- OBSERVATIONS: OLD BROWSE with pill filters + card list ---- */}
        {activeCategory === 'observations' && !selectedItemId && (
          <div className="flex-1 flex min-h-0">
            {/* Left: pill filters */}
            <div className="w-56 lg:w-72 border-r border-gray-100 p-3 space-y-3 flex flex-col overflow-y-auto flex-shrink-0">
              <div className="relative flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 bg-gray-50"
                />
              </div>
              {/* AND/OR toggle — hidden for now */}
              <div className="flex-shrink-0">
                <label className="block text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  {locale === 'fr' ? 'Types' : 'Tags'}
                </label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setTypeFilters(new Set())}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${typeFilters.size === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {locale === 'fr' ? 'Tous' : 'All'}
                  </button>
                  {allNoteTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setTypeFilters(prev => { const next = new Set(prev); if (next.has(type)) next.delete(type); else next.add(type); return next })}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${typeFilters.has(type) ? `${getNoteColor(type).bg} ${getNoteColor(type).text} ring-1 ring-current ring-opacity-30` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      {t.members.noteTypes[type as keyof typeof t.members.noteTypes] || type}
                    </button>
                  ))}
                  <button
                    onClick={() => setTypeFilters(prev => { const next = new Set(prev); if (next.has('__no_tag__')) next.delete('__no_tag__'); else next.add('__no_tag__'); return next })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${typeFilters.has('__no_tag__') ? 'bg-gray-700 text-white ring-1 ring-gray-500 ring-opacity-30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {locale === 'fr' ? 'Sans tag' : 'No tag'}
                  </button>
                </div>
              </div>
              {/* Goals filter — hidden for now */}
              {sessions.length > 0 && (
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider flex-shrink-0">
                    {locale === 'fr' ? 'Séances' : 'Sessions'}
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 flex-1 overflow-y-auto">
                    <button
                      onClick={() => setBrowseSessionFilters([])}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${browseSessionFilters.length === 0 ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    >
                      <span className={`text-xs font-medium ${browseSessionFilters.length === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                        {locale === 'fr' ? 'Toutes' : 'All'}
                      </span>
                      {browseSessionFilters.length === 0 && (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 ml-auto"><Check className="w-2.5 h-2.5 text-white" /></div>
                      )}
                    </button>
                    {sessions.map(s => {
                      const selected = browseSessionFilters.includes(s.id)
                      const FormatIcon = snFormatIcon[s.session_format] || User
                      return (
                        <button
                          key={s.id}
                          onClick={() => setBrowseSessionFilters(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${selected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                        >
                          <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0"><FormatIcon className="w-3 h-3 text-white" /></div>
                          <span className="text-xs text-gray-700 flex-1 truncate">
                            {new Date(s.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {selected && (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-white" /></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 flex-shrink-0">
                <span className="text-[10px] text-gray-400">{obsFilteredNotes.length} / {browseNotes.length}</span>
                {(searchQuery || typeFilters.size > 0 || browseMilestoneFilters.length > 0 || browseSessionFilters.length > 0) && (
                  <button onClick={() => { setSearchQuery(''); setTypeFilters(new Set()); setBrowseMilestoneFilters([]); setBrowseSessionFilters([]) }} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
                    {locale === 'fr' ? 'Effacer' : 'Clear'}
                  </button>
                )}
              </div>
            </div>
            {/* Right: card list */}
            <div className="flex-1 overflow-y-auto">
              {obsFilteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <FileText className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="text-gray-400 text-sm">{locale === 'fr' ? 'Aucune note ne correspond aux filtres' : 'No notes match your filters'}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {(() => {
                    const activeTypes = [...typeFilters].filter(tf => tf !== '__no_tag__')
                    // When filtering by tag, explode each note into one row per matching tag
                    const rows: { note: typeof obsFilteredNotes[0]; tag: { type: string; label: string } | null; tagContent: string }[] = []
                    for (const note of obsFilteredNotes) {
                      if (activeTypes.length > 0) {
                        for (const v of activeTypes) {
                          const tagRegex = new RegExp(`<mark[^>]*data-tag="${v}"[^>]*?data-tag-label="([^"]*)"[^>]*>(.*?)</mark>`, 'gis')
                          let m
                          while ((m = tagRegex.exec(note.content)) !== null) {
                            const text = stripHtml(m[2]).trim()
                            if (text) rows.push({ note, tag: { type: v, label: m[1] }, tagContent: text })
                          }
                        }
                      } else {
                        const tagMatch = note.content.match(/<mark[^>]*data-tag="([^"]*)"[^>]*?data-tag-label="([^"]*)"/)
                        let derivedTag: { type: string; label: string } | null = tagMatch
                          ? { type: tagMatch[1], label: tagMatch[2] }
                          : null
                        // Goal notes (milestone_comments) don't have inline <mark> tags;
                        // they store their tag in `note_type` directly. Surface it here so
                        // goal-note rows show a tag pill like session notes.
                        if (!derivedTag && note.milestone_id && note.note_type && note.note_type !== 'general') {
                          const noteTypeLabels = (t.members as any)?.noteTypes as Record<string, string> | undefined
                          const label = noteTypeLabels?.[note.note_type] || note.note_type.replace(/_/g, ' ')
                          derivedTag = { type: note.note_type, label }
                        }
                        rows.push({ note, tag: derivedTag, tagContent: stripHtml(note.content) })
                      }
                    }
                    return rows.map((row, idx) => {
                      const { note, tag, tagContent } = row
                      const tagColors = tag ? getNoteColor(tag.type) : null
                      return (
                        <button
                          key={`${note.id}-${idx}`}
                          onClick={() => { if (!note.milestone_id) { setSelectedItemId(note.id); setEditingNoteId(null); setDeletingNoteId(null); setBrowseHighlightTag(tag?.type) } }}
                          className={`w-full text-left px-4 py-3 transition-colors ${note.milestone_id ? 'cursor-default' : 'hover:bg-gray-50/50 cursor-pointer'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-16 pt-0.5">
                              <p className="text-[11px] text-gray-400 tabular-nums leading-tight">
                                {new Date(note.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-[10px] text-gray-300 tabular-nums">{formatNoteTime(note.created_at)}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                {note.session_id && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 flex-shrink-0">
                                    <LinkIcon className="w-2.5 h-2.5" />{getSessionLabelShort(note.session_id)}
                                  </span>
                                )}
                                {(note.title || (note as any).milestones?.title) && (() => {
                                  const goalTitle = (note.title || (note as any).milestones?.title) as string
                                  const truncated = goalTitle.length > 20 ? goalTitle.slice(0, 20) + '...' : goalTitle
                                  const prefix = locale === 'fr' ? 'Axe de travail' : locale === 'es' ? 'Objetivo' : 'Goal'
                                  return (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] text-emerald-600 flex-shrink-0"
                                      title={`${prefix} · ${goalTitle}`}
                                    >
                                      <Target className="w-2.5 h-2.5" />
                                      <span>{prefix} · {truncated}</span>
                                    </span>
                                  )
                                })()}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {tag && tagColors && (
                                  <span className={`inline-flex items-center px-1 py-0 rounded text-[9px] font-semibold flex-shrink-0 ${tagColors.bg} ${tagColors.text}`}>{tag.label}</span>
                                )}
                                <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed min-w-0">{tagContent}</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observations: note detail */}
        {activeCategory === 'observations' && selectedItemId && selectedNote && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-gray-100">
              <button onClick={() => setSelectedItemId(null)} className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getNoteColor(selectedNote.note_type).bg} ${getNoteColor(selectedNote.note_type).text}`}>
                {t.members.noteTypes[selectedNote.note_type as keyof typeof t.members.noteTypes] || selectedNote.note_type}
              </span>
              <p className="text-sm font-medium text-gray-900 truncate flex-1">{selectedNote.title || 'Note'}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span>{formatNoteDate(selectedNote.created_at)}</span>
                {selectedNote.updated_at !== selectedNote.created_at && (
                  <span className="italic">({locale === 'fr' ? 'modifiée' : 'edited'})</span>
                )}
              </div>
              {/* Linked session */}
              {selectedNote.session_id && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => {
                      setActiveCategory('sessions')
                      setSelectedItemId(selectedNote.session_id)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    {getSessionLabelShort(selectedNote.session_id)}
                    <span className="text-blue-400 text-[10px]">{locale === 'fr' ? '→ voir la séance' : '→ view session'}</span>
                  </button>
                </div>
              )}
              {/* Linked goal — show all notes for this milestone */}
              {selectedNote.milestone_id ? (() => {
                const goalTitle = selectedNote.title || (selectedNote as any).milestones?.title || ''
                const goalNotes = allNotes.filter(n => n.milestone_id === selectedNote.milestone_id).sort((a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-emerald-100">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">{goalTitle}</span>
                      <span className="text-[10px] text-emerald-400">{goalNotes.length} {locale === 'fr' ? 'notes' : 'notes'}</span>
                    </div>
                    <div className="space-y-3">
                      {goalNotes.map(gNote => {
                        const isActive = gNote.id === selectedNote.id
                        const tagMatch = gNote.content.match(/<mark[^>]*data-tag="([^"]*)"[^>]*?data-tag-label="([^"]*)"/)
                        const tag = tagMatch ? { type: tagMatch[1], label: tagMatch[2] } : null
                        const colors = tag ? getNoteColor(tag.type) : null
                        return (
                          <div
                            key={gNote.id}
                            ref={isActive ? (el) => { if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100) } : undefined}
                            className={`rounded-lg p-3 transition-all ${isActive ? 'ring-2 ring-blue-300 bg-blue-50/30 animate-pulse' : 'bg-gray-50'}`}
                            style={isActive ? { animationDuration: '1.5s', animationIterationCount: '2' } : undefined}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              {tag && colors && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>{tag.label}</span>
                              )}
                              <span className="text-[10px] text-gray-400">{formatNoteDate(gNote.created_at)}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">{stripHtml(gNote.content)}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })() : (
                <MarkdownRenderer content={selectedNote.content} highlightTag={browseHighlightTag} />
              )}
            </div>
          </div>
        )}

        {/* ---- BROWSE: FILTERS + NOTES LIST (nothing selected) ---- */}
        {activeCategory === 'browse' && !selectedItemId && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter bar */}
            <div className="border-b border-gray-100 px-4 py-2 flex-shrink-0 space-y-1.5">
              {/* Search + add filter + count — single row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBrowseFilterRows(prev => [...prev, { field: 'tag', operator: 'is', values: [] }])}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  {locale === 'fr' ? 'Filtre' : 'Filter'}
                </button>
                {/* Quick category toggles */}
                <button
                  onClick={() => setShowSessions(p => !p)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-colors flex-shrink-0 ${showSessions ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setShowGoals(p => !p)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-colors flex-shrink-0 ${showGoals ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                >
                  {locale === 'fr' ? 'Axes' : 'Goals'}
                </button>
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={locale === 'fr' ? 'Rechercher...' : 'Search...'}
                    className="w-full pl-7 pr-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50"
                  />
                </div>
                {(searchQuery || browseFilterRows.length > 0) && (
                  <button
                    onClick={() => { setSearchQuery(''); setBrowseFilterRows([]); setFilterConjunction('and') }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 underline flex-shrink-0"
                  >
                    {locale === 'fr' ? 'Effacer' : 'Clear'}
                  </button>
                )}
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {filteredNotes.length} / {browseNotes.length}
                </span>
              </div>
              {/* Filter rows */}
              {browseFilterRows.map((row, idx) => {
                const fieldLabels: Record<string, string> = locale === 'fr'
                  ? { tag: 'Tag', goal: 'Axe', session: 'Séance' }
                  : { tag: 'Tag', goal: 'Goal', session: 'Session' }
                const opLabels: Record<string, string> = locale === 'fr'
                  ? { is: 'est', is_not: "n'est pas", is_empty: 'est vide', is_not_empty: "n'est pas vide" }
                  : { is: 'is', is_not: 'is not', is_empty: 'is empty', is_not_empty: 'is not empty' }
                const operators = row.field === 'tag'
                  ? ['is', 'is_not']
                  : ['is', 'is_not', 'is_empty', 'is_not_empty']
                const needsValue = !['is_empty', 'is_not_empty'].includes(row.operator)
                const valueOptions: { id: string; label: string }[] = row.field === 'tag'
                  ? allNoteTypes.map(type => ({ id: type, label: t.members.noteTypes[type as keyof typeof t.members.noteTypes] || type }))
                  : row.field === 'goal'
                    ? milestones.map(m => ({ id: m.id, label: m.title }))
                    : sessions.map(s => ({
                        id: s.id,
                        label: new Date(s.scheduled_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
                      }))

                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    {/* Conjunction */}
                    <div className="w-12 flex-shrink-0 text-right">
                      {idx === 0 ? (
                        <span className="text-[11px] text-gray-400 font-medium pr-1">
                          {locale === 'fr' ? 'Où' : 'Where'}
                        </span>
                      ) : (
                        <select
                          value={filterConjunction}
                          onChange={e => setFilterConjunction(e.target.value as 'and' | 'or')}
                          className="text-[11px] text-gray-500 bg-transparent border-b border-gray-300 px-1 py-0.5 focus:outline-none focus:border-gray-500 w-full appearance-none cursor-pointer"
                        >
                          <option value="and">{locale === 'fr' ? 'et' : 'and'}</option>
                          <option value="or">{locale === 'fr' ? 'ou' : 'or'}</option>
                        </select>
                      )}
                    </div>
                    {/* Field */}
                    <select
                      value={row.field}
                      onChange={e => {
                        const next = [...browseFilterRows]
                        next[idx] = { field: e.target.value, operator: 'is', values: [] }
                        setBrowseFilterRows(next)
                      }}
                      className="text-[11px] font-medium text-gray-700 bg-transparent border-b border-gray-300 px-1 py-0.5 focus:outline-none focus:border-gray-500 appearance-none cursor-pointer"
                    >
                      {Object.entries(fieldLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {/* Operator */}
                    <select
                      value={row.operator}
                      onChange={e => {
                        const next = [...browseFilterRows]
                        next[idx] = { ...next[idx], operator: e.target.value, values: ['is_empty', 'is_not_empty'].includes(e.target.value) ? [] : next[idx].values }
                        setBrowseFilterRows(next)
                      }}
                      className="text-[11px] text-gray-600 bg-transparent border-b border-gray-300 px-1 py-0.5 focus:outline-none focus:border-gray-500 appearance-none cursor-pointer"
                    >
                      {operators.map(op => (
                        <option key={op} value={op}>{opLabels[op]}</option>
                      ))}
                    </select>
                    {/* Values */}
                    {needsValue && (
                      <div className="relative flex items-center gap-1 flex-wrap flex-1 min-w-0 border-b border-gray-300 px-1 py-0.5">
                        {row.values.map(val => {
                          const opt = valueOptions.find(o => o.id === val)
                          return (
                            <span key={val} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-700">
                              {opt?.label || val}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const next = [...browseFilterRows]
                                  next[idx] = { ...next[idx], values: next[idx].values.filter(v => v !== val) }
                                  setBrowseFilterRows(next)
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          )
                        })}
                        <button
                          onClick={() => {
                            if (filterDropdownOpen === idx) {
                              setFilterDropdownOpen(null)
                            } else {
                              setFilterDropdownPending([...row.values])
                              setFilterDropdownOpen(idx)
                            }
                          }}
                          className="text-[11px] text-gray-400 hover:text-gray-600 px-1 py-0.5"
                        >
                          {row.values.length ? '+' : (locale === 'fr' ? 'Choisir...' : 'Select...')}
                        </button>
                        {filterDropdownOpen === idx && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[240px] flex flex-col">
                            <div className="overflow-y-auto flex-1 py-1">
                              {valueOptions.map(opt => {
                                const optColors = row.field === 'tag' ? getNoteColor(opt.id) : null
                                return (
                                <label key={opt.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-[11px]">
                                  <input
                                    type="checkbox"
                                    checked={filterDropdownPending.includes(opt.id)}
                                    onChange={() => setFilterDropdownPending(prev =>
                                      prev.includes(opt.id) ? prev.filter(v => v !== opt.id) : [...prev, opt.id]
                                    )}
                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-300 w-3.5 h-3.5"
                                  />
                                  {optColors ? (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${optColors.bg} ${optColors.text}`}>{opt.label}</span>
                                  ) : (
                                    <span className="text-gray-700">{opt.label}</span>
                                  )}
                                </label>
                                )
                              })}
                            </div>
                            <div className="border-t border-gray-100 px-2 py-1.5 flex justify-end gap-1.5">
                              <button onClick={() => setFilterDropdownOpen(null)} className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1">
                                {locale === 'fr' ? 'Annuler' : 'Cancel'}
                              </button>
                              <button
                                onClick={() => {
                                  const next = [...browseFilterRows]
                                  next[idx] = { ...next[idx], values: filterDropdownPending }
                                  setBrowseFilterRows(next)
                                  setFilterDropdownOpen(null)
                                }}
                                className="text-[10px] font-medium text-white bg-gray-900 rounded px-3 py-1 hover:bg-gray-800"
                              >
                                {locale === 'fr' ? 'Appliquer' : 'Apply'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Delete row */}
                    <button onClick={() => setBrowseFilterRows(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-gray-300 hover:text-gray-500 flex-shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
            {/* Results table */}
            <div className="flex-1 overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <FileText className="w-10 h-10 text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">
                  {allNotes.length === 0
                    ? (locale === 'fr' ? 'Aucune note pour le moment' : 'No notes yet')
                    : (locale === 'fr' ? 'Aucune note ne correspond aux filtres' : 'No notes match your filters')
                  }
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider w-20">Date</th>
                    <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider w-28">{locale === 'fr' ? 'Type' : 'Type'}</th>
                    <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider w-32">Tag</th>
                    <th className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Contenu' : 'Content'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(() => {
                    // Group consecutive notes by session_id for session notes
                    const activeTagFilter = browseFilterRows.find(r => r.field === 'tag' && r.operator === 'is' && r.values.length > 0)
                    const groups: { key: string; notes: typeof filteredNotes }[] = []
                    for (const note of filteredNotes) {
                      const groupKey = note.session_id || note.id // non-session notes get their own group
                      const lastGroup = groups[groups.length - 1]
                      if (lastGroup && lastGroup.key === groupKey) {
                        lastGroup.notes.push(note)
                      } else {
                        groups.push({ key: groupKey, notes: [note] })
                      }
                    }

                    return groups.flatMap(group => {
                      const first = group.notes[0]
                      const isSession = !!first.session_id
                      const isOrphanedSession = first.note_type === 'session_summary' && !first.session_id
                      const goalTitle = first.title || ((first as any).milestones?.title)
                      const rowCount = group.notes.length

                      return group.notes.map((note, noteIdx) => {
                        // Tag extraction per note
                        const noteTypeLabel = note.note_type !== 'general' && note.note_type !== 'session_summary' && !note.content.includes(`data-tag="${note.note_type}"`)
                          ? (t.members.noteTypes[note.note_type as keyof typeof t.members.noteTypes] || note.note_type)
                          : null
                        const typeColors = noteTypeLabel ? getNoteColor(note.note_type) : null
                        let firstTag: { type: string; label: string } | null = null
                        if (activeTagFilter) {
                          for (const v of activeTagFilter.values) {
                            const m = note.content.match(new RegExp(`<mark[^>]*data-tag="${v}"[^>]*?data-tag-label="([^"]*)"`, 'i'))
                            if (m) { firstTag = { type: v, label: m[1] }; break }
                          }
                        }
                        if (!firstTag) {
                          const tagMatch = note.content.match(/<mark[^>]*data-tag="([^"]*)"[^>]*?data-tag-label="([^"]*)"/)
                          firstTag = tagMatch ? { type: tagMatch[1], label: tagMatch[2] } : null
                        }
                        const tagColors = firstTag ? getNoteColor(firstTag.type) : null
                        const isFirstInGroup = noteIdx === 0

                        return (
                          <tr
                            key={note.id}
                            data-note-row={note.id}
                            onClick={() => {
                              setSelectedItemId(note.id)
                              setEditingNoteId(null)
                              setDeletingNoteId(null)
                            }}
                            className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${isOrphanedSession ? 'bg-red-50/30' : ''} ${!isFirstInGroup ? 'border-t-0' : ''} ${highlightNoteId === note.id ? 'ring-2 ring-amber-300 ring-inset bg-amber-50/40' : ''}`}
                          >
                            {/* Date + Type — only on first row of group */}
                            {isFirstInGroup ? (
                              <>
                                <td className="px-4 py-2.5 align-top" rowSpan={rowCount}>
                                  <p className="text-[11px] text-gray-500 tabular-nums whitespace-nowrap">
                                    {new Date(note.created_at).toLocaleDateString(
                                      locale === 'fr' ? 'fr-FR' : 'en-US',
                                      { day: 'numeric', month: 'short' }
                                    )}
                                  </p>
                                </td>
                                <td className="px-3 py-2.5 align-top" rowSpan={rowCount}>
                                  <div className="flex flex-col gap-0.5">
                                    {isOrphanedSession && (
                                      <div className="flex items-center gap-1.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium w-fit bg-red-50 text-red-500">
                                          {locale === 'fr' ? 'Séance supprimée' : 'Deleted session'}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm(locale === 'fr' ? 'Supprimer cette note ?' : 'Delete this note?')) {
                                              supabase.from('progress_notes').delete().eq('id', note.id).then(() => {
                                                setAllNotes(prev => prev.filter(n => n.id !== note.id))
                                                toast.success(locale === 'fr' ? 'Note supprimée' : 'Note deleted')
                                              })
                                            }
                                          }}
                                          className="p-0.5 text-red-300 hover:text-red-500 transition-colors"
                                          title={locale === 'fr' ? 'Supprimer' : 'Delete'}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                    {isSession && (
                                      <>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium w-fit bg-blue-50 text-blue-700">
                                          Session
                                        </span>
                                        <span className="text-[10px] text-blue-600 truncate">
                                          {getSessionLabelShort(first.session_id!)}
                                        </span>
                                      </>
                                    )}
                                    {!isSession && !isOrphanedSession && goalTitle && (
                                      <span className="text-[11px] font-medium text-gray-700 truncate">{goalTitle}</span>
                                    )}
                                  </div>
                                </td>
                              </>
                            ) : null}
                            {/* Tag */}
                            <td className="px-3 py-2.5 align-top">
                              {noteTypeLabel && typeColors ? (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors.bg} ${typeColors.text}`}>
                                  {noteTypeLabel}
                                </span>
                              ) : firstTag && tagColors ? (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${tagColors.bg} ${tagColors.text}`}>
                                  {firstTag.label}
                                </span>
                              ) : null}
                            </td>
                            {/* Content */}
                            <td className="px-3 py-2.5 align-top">
                              <p className="text-xs text-gray-600 line-clamp-3">{stripHtml(note.content)}</p>
                            </td>
                          </tr>
                        )
                      })
                    })
                  })()}
                </tbody>
              </table>
            )}
          </div>
          </div>
        )}

        {/* ---- BROWSE: NOTE DETAIL (selected) ---- */}
        {activeCategory === 'browse' && selectedItemId && selectedNote && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-gray-100">
              <button
                onClick={() => setSelectedItemId(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${getNoteColor(selectedNote.note_type).bg} ${getNoteColor(selectedNote.note_type).text}`}>
                {t.members.noteTypes[selectedNote.note_type as keyof typeof t.members.noteTypes] || selectedNote.note_type}
              </span>
              <p className="text-sm font-medium text-gray-900 truncate flex-1">
                {selectedNote.title || (locale === 'fr' ? 'Note' : 'Note')}
              </p>
            </div>

            {/* Body (read-only) */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <span>{formatNoteDate(selectedNote.created_at)}</span>
                  {selectedNote.updated_at !== selectedNote.created_at && (
                    <span className="italic">({locale === 'fr' ? 'modifiée' : locale === 'es' ? 'editada' : 'edited'})</span>
                  )}
                </div>

                {/* Orphaned session warning */}
                {selectedNote.note_type === 'session_summary' && !selectedNote.session_id && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-xs text-red-600">
                      {locale === 'fr' ? 'La séance liée a été supprimée.' : 'The linked session was deleted.'}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(locale === 'fr' ? 'Supprimer cette note ?' : 'Delete this note?')) {
                          supabase.from('progress_notes').delete().eq('id', selectedNote.id).then(() => {
                            setAllNotes(prev => prev.filter(n => n.id !== selectedNote.id))
                            setSelectedItemId(null)
                            toast.success(locale === 'fr' ? 'Note supprimée' : 'Note deleted')
                          })
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 underline ml-auto flex-shrink-0"
                    >
                      {locale === 'fr' ? 'Supprimer la note' : 'Delete note'}
                    </button>
                  </div>
                )}

                {/* Linked session / goal */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {selectedNote.session_id && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <LinkIcon className="w-3 h-3" />
                      {getSessionLabelShort(selectedNote.session_id)}
                    </span>
                  )}
                  {selectedNote.milestone_id && (selectedNote as any).milestones?.title && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Target className="w-3 h-3" />
                      {(selectedNote as any).milestones.title}
                    </span>
                  )}
                </div>

                {selectedNote.title && (
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{selectedNote.title}</h3>
                )}
                {(() => {
                  const activeTags = [...typeFilters].filter(t => t !== '__no_tag__')
                  if (activeTags.length > 0) {
                    // Inject highlight styles: dim all text, make matching marks pop
                    const highlightCss = `
                      .browse-highlight { color: rgba(107, 114, 128, 0.45); }
                      .browse-highlight mark[data-tag] { opacity: 0.4; }
                      ${activeTags.map(tag =>
                        `.browse-highlight mark[data-tag="${tag}"] { opacity: 1 !important; background-color: var(--tag-bg, #fef9c3) !important; padding: 2px 4px; border-radius: 3px; box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.3); color: #111827 !important; }`
                      ).join('\n')}
                    `
                    return (
                      <>
                        <style>{highlightCss}</style>
                        <MarkdownRenderer
                          content={selectedNote.content}
                          className="leading-relaxed browse-highlight"
                        />
                      </>
                    )
                  }
                  return (
                    <MarkdownRenderer
                      content={selectedNote.content}
                      className="leading-relaxed"
                    />
                  )
                })()}

                {selectedNote.image_urls && selectedNote.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedNote.image_urls.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
      </div>

      {/* Delete confirmation modal */}
      {/* Image lightbox gallery with navigation + zoom */}
      {snLightboxIndex !== null && (() => {
        const idx = snLightboxIndex!
        const images = (selectedItemId ? snSessionSummaryNotes[selectedItemId]?.attachments : null) || snAttachments || []
        const currentUrl = images[idx]?.url
        if (!currentUrl) return null
        return (
          <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center" onClick={() => { setSnLightboxIndex(null); setSnLightboxZoom(1) }}>
            {/* Close button — top right */}
            <button type="button" onClick={() => { setSnLightboxIndex(null); setSnLightboxZoom(1) }} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10">
              <X className="w-5 h-5" />
            </button>

            {/* Bottom center: navigation + zoom */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 z-10" onClick={(e) => e.stopPropagation()}>
              {images.length > 1 && (
                <button type="button" disabled={idx <= 0} onClick={() => { setSnLightboxIndex(idx - 1); setSnLightboxZoom(1) }} className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {images.length > 1 && (
                <span className="text-white/70 text-xs min-w-[2rem] text-center">{idx + 1}/{images.length}</span>
              )}
              {images.length > 1 && (
                <button type="button" disabled={idx >= images.length - 1} onClick={() => { setSnLightboxIndex(idx + 1); setSnLightboxZoom(1) }} className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              {images.length > 1 && <div className="w-px h-5 bg-white/20" />}
              <button type="button" onClick={() => setSnLightboxZoom(z => Math.max(0.5, z - 0.25))} className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center text-lg">−</button>
              <span className="text-white/70 text-xs min-w-[2.5rem] text-center">{Math.round(snLightboxZoom * 100)}%</span>
              <button type="button" onClick={() => setSnLightboxZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center text-lg">+</button>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center overflow-auto p-8" onClick={(e) => e.stopPropagation()}>
              <img
                src={currentUrl}
                alt=""
                className="rounded-lg shadow-2xl transition-transform duration-200"
                style={{ transform: `scale(${snLightboxZoom})`, maxWidth: snLightboxZoom <= 1 ? '100%' : 'none', maxHeight: snLightboxZoom <= 1 ? '100%' : 'none' }}
              />
            </div>
          </div>
        )
      })()}

      {deletingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeletingNoteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'fr' ? 'Supprimer cette note ?' : 'Delete this note?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {locale === 'fr' ? 'Cette action est irréversible.' : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingNoteId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  handleDeleteSessionNote(selectedItemId!)
                  setDeletingNoteId(null)
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                {locale === 'fr' ? 'Supprimer' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
