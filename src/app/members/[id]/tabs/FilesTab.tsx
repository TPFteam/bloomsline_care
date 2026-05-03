'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Trash2,
  File,
  FileImage,
  FileSpreadsheet,
  FileType,
  Upload,
  Folder,
  FolderOpen,
  X,
  Info,
  Eye,
  Shield,
  Phone,
  Mail,
  Edit3,
  Plus,
  User,
  Calendar,
  Clock,
  Copy,
  MoreHorizontal,
  ChevronRight,
  FolderPlus,
  Loader2,
  Check,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Users,
} from 'lucide-react'
import { MaskedContact } from '@/components/ui/masked-contact'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/notes/RichTextEditor'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { MemberFile, FileCategory, Member, EmergencyContact, FolderBreadcrumb } from '@/types/member'

interface FilesTabProps {
  memberId: string
  member: Member
  onMemberUpdate: () => void
}

// Helper function to calculate time connected
function getTimeConnected(dateString: string): string {
  const now = new Date()
  const created = new Date(dateString)
  const diffMs = now.getTime() - created.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day'
  if (diffDays < 7) return `${diffDays} days`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`
  const years = Math.floor(diffDays / 365)
  const remainingMonths = Math.floor((diffDays % 365) / 30)
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
  return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
}

export default function FilesTab({ memberId, member, onMemberUpdate }: FilesTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<MemberFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<FolderBreadcrumb[]>([])

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFolderName, setUploadingFolderName] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({})
  const [fileTitle, setFileTitle] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('general')
  const [isDragging, setIsDragging] = useState(false)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // Thumbnail URLs for image files
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  // File preview modal state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<MemberFile | null>(null)
  const [docxHtml, setDocxHtml] = useState<string | null>(null)
  const [docxEditing, setDocxEditing] = useState(false)
  const [docxContent, setDocxContent] = useState('')
  const [docxLoading, setDocxLoading] = useState(false)
  const [previewZoom, setPreviewZoom] = useState(1)

  // Referral state
  const [referralSource, setReferralSource] = useState<string>(member.referral_source || '')
  const [referralName, setReferralName] = useState(member.referral_name || '')
  const [referralEmail, setReferralEmail] = useState(member.referral_email || '')
  const [savingReferral, setSavingReferral] = useState(false)
  const [editingReferral, setEditingReferral] = useState(false)
  const hasReferralSaved = !!(member.referral_source || member.referral_name)

  const handleSaveReferral = async () => {
    setSavingReferral(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({
          referral_source: referralSource || null,
          referral_name: referralName.trim() || null,
          referral_email: referralEmail.trim() || null,
        })
        .eq('id', memberId)
      if (error) throw error
      toast.success(locale === 'fr' ? 'Référence enregistrée' : 'Referral saved')
      setEditingReferral(false)
      onMemberUpdate()
    } catch {
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Failed to save')
    } finally {
      setSavingReferral(false)
    }
  }

  // New folder modal state
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameItem, setRenameItem] = useState<MemberFile | null>(null)
  const [renameName, setRenameName] = useState('')
  const [renaming, setRenaming] = useState(false)

  // Emergency contact edit states
  const [editingEmergency, setEditingEmergency] = useState(false)
  const [savingEmergency, setSavingEmergency] = useState(false)
  const [emergencyName, setEmergencyName] = useState(member.emergency_contact.name || '')
  const [emergencyRelationship, setEmergencyRelationship] = useState(member.emergency_contact.relationship || '')
  const [emergencyPhone, setEmergencyPhone] = useState(member.emergency_contact.phone || '')
  const [emergencyEmail, setEmergencyEmail] = useState(member.emergency_contact.email || '')
  const [emergencyNotes, setEmergencyNotes] = useState(member.emergency_contact.notes || '')

  useEffect(() => {
    fetchFolderContents(null, true)
  }, [memberId])

  const fetchFolderContents = async (folderId: string | null, isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First, try a simple fetch to check if folder columns exist
      const { data, error } = await supabase
        .from('member_files')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)

      if (error && error.code !== '42P01') throw error

      const allFiles = data || []

      // Check if folder columns exist by looking at the data
      const hasFolderSupport = allFiles.length === 0 || allFiles[0]?.is_folder !== undefined

      let filteredFiles: MemberFile[]

      if (hasFolderSupport) {
        // Filter by parent folder
        if (folderId === null) {
          // Root level: show files with no parent or null parent
          filteredFiles = allFiles.filter(f => !f.parent_folder_id)
        } else {
          // Subfolder: show files in this folder
          filteredFiles = allFiles.filter(f => f.parent_folder_id === folderId)
        }
      } else {
        // No folder support yet - show all files at root
        filteredFiles = allFiles
      }

      // Add default folder fields for backwards compatibility & sort
      const sortedData = filteredFiles
        .map(file => ({
          ...file,
          is_folder: file.is_folder ?? false,
          parent_folder_id: file.parent_folder_id ?? null,
        }))
        .sort((a, b) => {
          // Folders first
          if (a.is_folder && !b.is_folder) return -1
          if (!a.is_folder && b.is_folder) return 1
          // Then by name
          return a.file_name.localeCompare(b.file_name)
        })

      setFiles(sortedData)
      setCurrentFolderId(hasFolderSupport ? folderId : null)

      // Generate thumbnail URLs for image files
      const imageFiles = sortedData.filter(f => !f.is_folder && f.file_type?.startsWith('image/') && f.storage_path)
      if (imageFiles.length > 0) {
        const paths = imageFiles.map(f => f.storage_path)
        const { data: signedData } = await supabase.storage.from('member-files').createSignedUrls(paths, 3600)
        if (signedData) {
          const thumbMap: Record<string, string> = {}
          signedData.forEach((item, i) => {
            if (item.signedUrl) {
              const file = imageFiles[i]
              thumbMap[file.id] = item.signedUrl
            }
          })
          setThumbnails(thumbMap)
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildFolderPath = async (folderId: string): Promise<FolderBreadcrumb[]> => {
    const path: FolderBreadcrumb[] = []
    let currentId: string | null = folderId

    while (currentId) {
      const { data } = await supabase
        .from('member_files')
        .select('id, file_name, parent_folder_id')
        .eq('id', currentId)
        .single() as { data: { id: string; file_name: string; parent_folder_id: string | null } | null }

      if (data) {
        path.unshift({ id: data.id, name: data.file_name })
        currentId = data.parent_folder_id
      } else {
        break
      }
    }

    return path
  }

  const navigateToFolder = async (folderId: string | null) => {
    if (folderId === null) {
      setFolderPath([])
    } else {
      const path = await buildFolderPath(folderId)
      setFolderPath(path)
    }
    await fetchFolderContents(folderId)
  }

  const navigateToBreadcrumb = async (index: number) => {
    if (index === -1) {
      // Navigate to root
      await navigateToFolder(null)
    } else {
      const targetFolder = folderPath[index]
      const newPath = folderPath.slice(0, index + 1)
      setFolderPath(newPath)
      await fetchFolderContents(targetFolder.id)
    }
  }

  // Handle file selection - opens modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setSelectedFiles([file])
    setUploadingFolderName(null)
    setFileTitle(file.name.replace(/\.[^/.]+$/, ''))
    setFileDescription('')
    setSelectedCategory('general')
    setShowUploadModal(true)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const addFilesToUpload = (newFiles: File[]) => {
    setSelectedFiles(prev => {
      const combined = [...prev, ...newFiles].slice(0, 15)
      if (combined.length === 1) {
        setSelectedFile(combined[0])
        setFileTitle(combined[0].name.replace(/\.[^/.]+$/, ''))
      } else {
        setSelectedFile(null)
        setFileTitle('')
      }
      return combined
    })
  }

  const removeFileFromUpload = (index: number) => {
    setSelectedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index)
      if (updated.length === 1) {
        setSelectedFile(updated[0])
        setFileTitle(updated[0].name.replace(/\.[^/.]+$/, ''))
      } else if (updated.length === 0) {
        setSelectedFile(null)
        setFileTitle('')
      }
      return updated
    })
  }

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const newFiles = Array.from(fileList).slice(0, 15)
    setSelectedFiles(newFiles)
    setUploadingFolderName(null)
    if (newFiles.length === 1) {
      setSelectedFile(newFiles[0])
      setFileTitle(newFiles[0].name.replace(/\.[^/.]+$/, ''))
    } else {
      setSelectedFile(null)
      setFileTitle('')
    }
    setFileDescription('')
    setSelectedCategory('general')
    setShowUploadModal(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const newFiles = Array.from(fileList).filter(f => !f.name.startsWith('.')).slice(0, 15)
    if (newFiles.length === 0) return
    // Extract folder name from webkitRelativePath
    const folderName = newFiles[0]?.webkitRelativePath?.split('/')[0] || 'Folder'
    setSelectedFiles(newFiles)
    setUploadingFolderName(folderName)
    setSelectedFile(null)
    setFileTitle('')
    setFileDescription('')
    setSelectedCategory('general')
    setShowUploadModal(true)
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const items = e.dataTransfer.items
    const droppedFiles: File[] = []
    let folderName: string | null = null

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.()
        if (entry?.isDirectory) {
          folderName = entry.name
          const dirReader = (entry as any).createReader()
          const entries: any[] = await new Promise(resolve => {
            dirReader.readEntries((results: any[]) => resolve(results))
          })
          for (const fileEntry of entries) {
            if (fileEntry.isFile) {
              const file: File = await new Promise(resolve => fileEntry.file(resolve))
              if (!file.name.startsWith('.')) droppedFiles.push(file)
            }
          }
        } else if (entry?.isFile) {
          const file = items[i].getAsFile()
          if (file) droppedFiles.push(file)
        }
      }
    } else {
      droppedFiles.push(...Array.from(e.dataTransfer.files))
    }

    if (droppedFiles.length === 0) return
    const limited = droppedFiles.slice(0, 15)
    setSelectedFiles(limited)
    setUploadingFolderName(folderName)
    if (limited.length === 1 && !folderName) {
      setSelectedFile(limited[0])
      setFileTitle(limited[0].name.replace(/\.[^/.]+$/, ''))
    } else {
      setSelectedFile(null)
      setFileTitle('')
    }
    setFileDescription('')
    setSelectedCategory('general')
    setShowUploadModal(true)
  }

  // Handle actual upload after modal confirmation
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // If folder upload, create the folder first
      let targetFolderId = currentFolderId
      if (uploadingFolderName) {
        const { data: folderData, error: folderErr } = await supabase
          .from('member_files')
          .insert({
            member_id: memberId,
            practitioner_id: user.id,
            file_name: uploadingFolderName,
            is_folder: true,
            parent_folder_id: currentFolderId,
            file_type: '',
            storage_path: '',
            category: 'general',
          })
          .select('id')
          .single()
        if (folderErr) throw folderErr
        targetFolderId = folderData.id
      }

      const progress: Record<string, 'pending' | 'uploading' | 'done' | 'error'> = {}
      selectedFiles.forEach(f => { progress[f.name] = 'pending' })
      setUploadProgress({ ...progress })

      for (const file of selectedFiles) {
        progress[file.name] = 'uploading'
        setUploadProgress({ ...progress })

        try {
          const fileExt = file.name.split('.').pop()
          const storagePath = `${memberId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('member-files')
            .upload(storagePath, file)
          if (uploadError) throw uploadError

          const insertData: Record<string, unknown> = {
            member_id: memberId,
            practitioner_id: user.id,
            file_name: selectedFiles.length === 1 && fileTitle.trim() ? fileTitle.trim() : file.name.replace(/\.[^/.]+$/, ''),
            file_type: file.type,
            file_size: file.size,
            storage_path: storagePath,
            category: selectedCategory,
            description: selectedFiles.length === 1 ? (fileDescription.trim() || null) : null,
          }
          if (targetFolderId !== null || files.some(f => f.is_folder)) {
            insertData.is_folder = false
            insertData.parent_folder_id = targetFolderId
          }

          const { error: dbError } = await supabase.from('member_files').insert(insertData)
          if (dbError) throw dbError

          progress[file.name] = 'done'
        } catch {
          progress[file.name] = 'error'
        }
        setUploadProgress({ ...progress })
      }

      const doneCount = Object.values(progress).filter(s => s === 'done').length
      if (doneCount > 0) {
        toast.success(locale === 'fr' ? `${doneCount} fichier(s) importé(s)` : `${doneCount} file(s) uploaded`)
      }
      const errorCount = Object.values(progress).filter(s => s === 'error').length
      if (errorCount > 0) {
        toast.error(locale === 'fr' ? `${errorCount} fichier(s) en erreur` : `${errorCount} file(s) failed`)
      }

      setShowUploadModal(false)
      setSelectedFile(null)
      setSelectedFiles([])
      setUploadingFolderName(null)
      setUploadProgress({})
      setFileTitle('')
      setFileDescription('')
      fetchFolderContents(currentFolderId)
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error(t.members.errors.fileUploadFailed)
    } finally {
      setUploading(false)
    }
  }

  const handleCloseModal = () => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setSelectedFiles([])
    setUploadingFolderName(null)
    setUploadProgress({})
    setFileTitle('')
    setFileDescription('')
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setCreatingFolder(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('member_files')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          file_name: newFolderName.trim(),
          is_folder: true,
          parent_folder_id: currentFolderId,
          file_type: '',
          storage_path: '',
          category: 'general',
        })

      if (error) {
        // If error is about unknown columns, migration hasn't been applied
        if (error.message?.includes('is_folder') || error.message?.includes('parent_folder_id')) {
          toast.error(locale === 'fr' ? 'Fonctionnalité de dossiers non disponible' : 'Folder feature not available yet')
          setShowNewFolderModal(false)
          return
        }
        throw error
      }

      toast.success(locale === 'fr' ? 'Dossier créé' : 'Folder created')
      setShowNewFolderModal(false)
      setNewFolderName('')
      fetchFolderContents(currentFolderId)
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error(locale === 'fr' ? 'Échec de la création du dossier' : 'Failed to create folder')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleRename = async () => {
    if (!renameItem || !renameName.trim()) return

    setRenaming(true)
    try {
      const { error } = await supabase
        .from('member_files')
        .update({ file_name: renameName.trim() })
        .eq('id', renameItem.id)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Renommé avec succès' : 'Renamed successfully')
      setShowRenameModal(false)
      setRenameItem(null)
      setRenameName('')
      fetchFolderContents(currentFolderId)
    } catch (error) {
      console.error('Error renaming:', error)
      toast.error(locale === 'fr' ? 'Échec du renommage' : 'Failed to rename')
    } finally {
      setRenaming(false)
    }
  }

  const openRenameModal = (item: MemberFile) => {
    setRenameItem(item)
    setRenameName(item.file_name)
    setShowRenameModal(true)
  }

  const handleView = async (file: MemberFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('member-files')
        .createSignedUrl(file.storage_path, 60 * 60)

      if (error) throw error

      setPreviewUrl(data.signedUrl)
      setPreviewFile(file)
      setPreviewZoom(1)
      setDocxHtml(null)
      setDocxEditing(false)
      setDocxContent('')

      // Convert DOCX to HTML for preview
      const isDocx = file.file_name?.toLowerCase().endsWith('.docx') || file.file_type?.includes('wordprocessingml')
      if (isDocx) {
        setDocxLoading(true)
        try {
          const res = await fetch(data.signedUrl)
          const arrayBuffer = await res.arrayBuffer()
          const mammoth = await import('mammoth')
          const result = await mammoth.convertToHtml({ arrayBuffer }, {
            convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' })),
          })
          // Clean up empty images from skipped drawings
          result.value = result.value.replace(/<img[^>]*src=""[^>]*>/g, '')
          setDocxHtml(result.value)
          setDocxContent(result.value)
        } catch (err) {
          console.error('DOCX conversion error:', err)
        } finally {
          setDocxLoading(false)
        }
      }
    } catch (error) {
      console.error('Error viewing file:', error)
      toast.error(locale === 'fr' ? 'Impossible d\'afficher le fichier' : 'Failed to view file')
    }
  }

  const handleDownload = async (file: MemberFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('member-files')
        .download(file.storage_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error(locale === 'fr' ? 'Impossible de télécharger le fichier' : 'Failed to download file')
    }
  }

  const handleDelete = async (file: MemberFile) => {
    const confirmMessage = file.is_folder
      ? t.members.files.confirmDeleteFolder
      : t.members.files.confirmDelete

    if (!confirm(confirmMessage)) return

    try {
      // If it's a file, delete from storage first
      if (!file.is_folder && file.storage_path) {
        const { error: storageError } = await supabase.storage
          .from('member-files')
          .remove([file.storage_path])

        if (storageError) throw storageError
      }

      // Delete from database (cascade will handle children for folders)
      const { error: dbError } = await supabase
        .from('member_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      toast.success(file.is_folder
        ? (locale === 'fr' ? 'Dossier supprimé' : 'Folder deleted')
        : (locale === 'fr' ? 'Fichier supprimé' : 'File deleted')
      )
      fetchFolderContents(currentFolderId)
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error(locale === 'fr' ? 'Impossible de supprimer' : 'Failed to delete')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return FileImage
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet
    if (fileType.includes('pdf')) return FileType
    return File
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const categoryColors: Record<FileCategory, { bg: string; text: string; gradient: string }> = {
    general: { bg: 'bg-gray-100', text: 'text-gray-700', gradient: 'from-gray-100 to-gray-50' },
    intake: { bg: 'bg-blue-50', text: 'text-blue-700', gradient: 'from-blue-100 to-blue-50' },
    assessment: { bg: 'bg-purple-50', text: 'text-purple-700', gradient: 'from-purple-100 to-purple-50' },
    consent: { bg: 'bg-emerald-50', text: 'text-emerald-700', gradient: 'from-emerald-100 to-emerald-50' },
    insurance: { bg: 'bg-amber-50', text: 'text-amber-700', gradient: 'from-amber-100 to-amber-50' },
    correspondence: { bg: 'bg-coral-50', text: 'text-coral-700', gradient: 'from-coral-100 to-coral-50' },
    other: { bg: 'bg-gray-100', text: 'text-gray-700', gradient: 'from-gray-100 to-gray-50' },
  }

  // Check if emergency contact has any data
  const hasEmergencyData =
    member.emergency_contact.name ||
    member.emergency_contact.phone ||
    member.emergency_contact.email

  const handleSaveEmergency = async () => {
    setSavingEmergency(true)
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

      toast.success(locale === 'fr' ? 'Contact d\'urgence mis à jour' : 'Emergency contact updated')
      setEditingEmergency(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating emergency contact:', error)
      toast.error(locale === 'fr' ? 'Impossible de mettre à jour' : 'Failed to update')
    } finally {
      setSavingEmergency(false)
    }
  }

  // Separate folders and files
  const folders = files.filter(f => f.is_folder)
  const regularFiles = files.filter(f => !f.is_folder)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <span className="text-gray-500 text-sm">{locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleMultiFileSelect}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        {...{ webkitdirectory: '', directory: '' } as any}
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />

      {/* Contact Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            {locale === 'fr' ? 'Informations de Contact' : 'Contact Information'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          {member.email && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                  <MaskedContact value={member.email} type="email" className="text-sm font-medium text-gray-900" />
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(member.email!)
                  toast.success(locale === 'fr' ? 'Email copié' : 'Email copied')
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Phone */}
          {member.phone && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Téléphone' : 'Phone'}</p>
                  <MaskedContact value={member.phone} type="phone" className="text-sm font-medium text-gray-900" />
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(member.phone!)
                  toast.success(locale === 'fr' ? 'Téléphone copié' : 'Phone copied')
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Date of Birth */}
          {member.date_of_birth && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Date de Naissance' : 'Date of Birth'}</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(member.date_of_birth).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Time Connected */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Temps Connecté' : 'Time Connected'}</p>
              <p className="text-sm font-medium text-gray-900">
                {getTimeConnected(member.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* No contact info message */}
        {!member.email && !member.phone && !member.date_of_birth && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucune information de contact' : 'No contact information available'}</p>
          </div>
        )}
      </motion.div>

      {/* Referral Source Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            {locale === 'fr' ? 'Référence' : 'Referred by'}
          </h3>
          {!editingReferral && hasReferralSaved && (
            <button onClick={() => setEditingReferral(true)} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              {locale === 'fr' ? 'Modifier' : 'Edit'}
            </button>
          )}
        </div>

        {editingReferral || !hasReferralSaved ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'fr' ? 'Source de référence' : 'Referral source'}
              </label>
              <select
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none bg-white text-sm"
              >
                <option value="">{locale === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                <option value="practitioner">{locale === 'fr' ? 'Autre praticien' : 'Another practitioner'}</option>
                <option value="patient">{locale === 'fr' ? 'Patient existant' : 'Existing patient'}</option>
                <option value="online">{locale === 'fr' ? 'Recherche en ligne' : 'Online search'}</option>
                <option value="social_media">{locale === 'fr' ? 'Réseaux sociaux' : 'Social media'}</option>
                <option value="word_of_mouth">{locale === 'fr' ? 'Bouche-à-oreille' : 'Word of mouth'}</option>
                <option value="insurance">{locale === 'fr' ? 'Assurance / réseau santé' : 'Insurance / health network'}</option>
                <option value="other">{locale === 'fr' ? 'Autre' : 'Other'}</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Nom du référent' : 'Referrer name'}
                </label>
                <input
                  type="text"
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                  placeholder={locale === 'fr' ? 'Dr. Dupont' : 'Dr. Smith'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Email du référent' : 'Referrer email'}
                  <span className="text-gray-400 font-normal ml-1">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                </label>
                <input
                  type="email"
                  value={referralEmail}
                  onChange={(e) => setReferralEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {editingReferral && (
                <Button variant="ghost" size="sm" onClick={() => setEditingReferral(false)} className="rounded-xl">
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveReferral}
                disabled={savingReferral || !referralSource || !referralName.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
              >
                {savingReferral ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                {locale === 'fr' ? 'Enregistrer' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {referralSource && (
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{locale === 'fr' ? 'Source' : 'Source'}</p>
                <p className="text-sm font-medium text-gray-900">
                  {{ practitioner: locale === 'fr' ? 'Autre praticien' : 'Another practitioner', patient: locale === 'fr' ? 'Patient existant' : 'Existing patient', online: locale === 'fr' ? 'Recherche en ligne' : 'Online search', social_media: locale === 'fr' ? 'Réseaux sociaux' : 'Social media', word_of_mouth: locale === 'fr' ? 'Bouche-à-oreille' : 'Word of mouth', insurance: locale === 'fr' ? 'Assurance / réseau santé' : 'Insurance / health network', other: locale === 'fr' ? 'Autre' : 'Other' }[referralSource] || referralSource}
                </p>
              </div>
            )}
            {referralName && (
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{locale === 'fr' ? 'Nom' : 'Name'}</p>
                <p className="text-sm font-medium text-gray-900">{referralName}</p>
              </div>
            )}
            {referralEmail && (
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{referralEmail}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Header with Breadcrumb + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </h2>
          <nav className="flex items-center gap-1 text-sm">
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className={`font-medium transition-colors ${
                folderPath.length === 0
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.members.files.title}
            </button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={`font-medium transition-colors ${
                    index === folderPath.length - 1
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowNewFolderModal(true)}
            className="rounded-xl border-gray-200 hover:bg-gray-50"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            {t.members.files.newFolder}
          </Button>
          <Button
            onClick={() => { setSelectedFiles([]); setUploadingFolderName(null); setUploadProgress({}); setShowUploadModal(true) }}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t.members.files.uploadFile}
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-lavender-500" />
                  {locale === 'fr' ? 'Importer des fichiers' : 'Upload Files'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Drag & Drop Zone */}
                {selectedFiles.length === 0 && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      isDragging ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-teal-500' : 'text-gray-300'}`} />
                    <p className="text-sm text-gray-600 mb-1">
                      {locale === 'fr' ? 'Glissez-déposez des fichiers ou un dossier ici' : 'Drag & drop files or a folder here'}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      {locale === 'fr' ? 'Maximum 15 fichiers' : 'Up to 15 files'}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {locale === 'fr' ? 'Parcourir les fichiers' : 'Browse Files'}
                      </button>
                      <button
                        type="button"
                        onClick={() => folderInputRef.current?.click()}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5 inline mr-1.5" />
                        {locale === 'fr' ? 'Importer un dossier' : 'Upload Folder'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Folder name indicator */}
                {uploadingFolderName && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <Folder className="w-4 h-4" />
                    {locale === 'fr' ? `Dossier : ${uploadingFolderName}` : `Folder: ${uploadingFolderName}`}
                  </div>
                )}

                {/* Selected files list */}
                {selectedFiles.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        {selectedFiles.length} {locale === 'fr' ? 'fichier(s) sélectionné(s)' : 'file(s) selected'}
                      </p>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                        >
                          + {locale === 'fr' ? 'Ajouter' : 'Add more'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, i) => {
                        const status = uploadProgress[file.name]
                        return (
                          <div key={`${file.name}-${i}`} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                              {file.type.includes('image') ? <FileImage className="w-4 h-4 text-lavender-500" /> :
                               file.type.includes('pdf') ? <FileType className="w-4 h-4 text-red-500" /> :
                               <File className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                            {status === 'uploading' && <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />}
                            {status === 'done' && <Check className="w-4 h-4 text-emerald-500" />}
                            {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                            {!status && !uploading && (
                              <button type="button" onClick={() => removeFileFromUpload(i)} className="p-1 rounded hover:bg-gray-200 transition-colors">
                                <X className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Current folder info */}
                {currentFolderId && folderPath.length > 0 && !uploadingFolderName && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Folder className="w-4 h-4" />
                    <span>{locale === 'fr' ? 'Dans :' : 'In:'} {folderPath[folderPath.length - 1].name}</span>
                  </div>
                )}

                {/* Title + Description (only for single file) */}
                {selectedFiles.length === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Titre' : 'Title'} <span className="text-gray-400">({locale === 'fr' ? 'nom affiché' : 'display name'})</span>
                      </label>
                      <input
                        type="text"
                        value={fileTitle}
                        onChange={(e) => setFileTitle(e.target.value)}
                        placeholder={locale === 'fr' ? 'Entrez un titre...' : 'Enter a title...'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-lavender-500" />
                        Description <span className="text-gray-400">({locale === 'fr' ? 'optionnel' : 'optional'})</span>
                      </label>
                      <textarea
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        placeholder={locale === 'fr' ? 'Ajouter une description...' : 'Add a description...'}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white"
                      />
                    </div>
                  </>
                )}

                {/* Category */}
                {selectedFiles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Catégorie' : 'Category'}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as FileCategory)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                    >
                      <option value="general">{t.members.fileCategories.general}</option>
                      <option value="intake">{t.members.fileCategories.intake}</option>
                      <option value="assessment">{t.members.fileCategories.assessment}</option>
                      <option value="consent">{t.members.fileCategories.consent}</option>
                      <option value="insurance">{t.members.fileCategories.insurance}</option>
                      <option value="correspondence">{t.members.fileCategories.correspondence}</option>
                      <option value="other">{t.members.fileCategories.other}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button variant="ghost" onClick={handleCloseModal} className="rounded-xl">
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={uploading || selectedFiles.length === 0 || (selectedFiles.length === 1 && !fileTitle.trim())}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {locale === 'fr' ? 'Import en cours...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {selectedFiles.length > 1
                        ? (locale === 'fr' ? `Importer ${selectedFiles.length} fichiers` : `Upload ${selectedFiles.length} files`)
                        : (locale === 'fr' ? 'Importer' : 'Upload')}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewFolderModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-blue-500" />
                  {t.members.files.newFolder}
                </h3>
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.members.files.folderName}
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={locale === 'fr' ? 'Nom du dossier...' : 'Folder name...'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      handleCreateFolder()
                    }
                  }}
                />
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewFolderModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  {creatingFolder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {locale === 'fr' ? 'Création...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      {t.members.files.createFolder}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {showRenameModal && renameItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRenameModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-gray-500" />
                  {t.members.files.rename}
                </h3>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <input
                  type="text"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameName.trim()) {
                      handleRename()
                    }
                  }}
                />
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowRenameModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRename}
                  disabled={renaming || !renameName.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                >
                  {renaming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Files Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
      >
        {files.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
              <div className="relative w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                {currentFolderId ? (
                  <FolderOpen className="w-10 h-10 text-blue-600" />
                ) : (
                  <Folder className="w-10 h-10 text-blue-600" />
                )}
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {currentFolderId ? t.members.files.emptyFolder : t.members.files.noFiles}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {currentFolderId
                ? (locale === 'fr' ? 'Ajoutez des fichiers ou créez des sous-dossiers' : 'Add files or create subfolders')
                : t.members.files.noFilesDescription
              }
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNewFolderModal(true)}
                className="rounded-xl border-gray-200"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                {t.members.files.newFolder}
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-colors hover-lift"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.members.files.uploadFile}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {/* Grid View */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Folders */}
              {folders.map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * index }}
                  className="group relative bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-all border border-transparent hover:border-gray-200"
                  onClick={() => navigateToFolder(folder.id)}
                >
                  {/* Three-dot menu */}
                  <div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-white transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => navigateToFolder(folder.id)}>
                          <FolderOpen className="w-4 h-4 mr-2 text-gray-400" />
                          {t.members.files.open}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRenameModal(folder)}>
                          <Edit3 className="w-4 h-4 mr-2 text-gray-400" />
                          {t.members.files.rename}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(folder)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t.members.files.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Folder icon */}
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                    <Folder className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Folder name */}
                  <p className="text-sm font-medium text-gray-900 text-center truncate">
                    {folder.file_name}
                  </p>
                </motion.div>
              ))}

              {/* Files */}
              {regularFiles.map((file, index) => {
                const FileIcon = getFileIcon(file.file_type)
                const catStyle = categoryColors[file.category]
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * (folders.length + index) }}
                    className="group relative bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition-all border border-transparent hover:border-gray-200"
                    onClick={() => handleView(file)}
                  >
                    {/* Three-dot menu */}
                    <div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-white transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem onClick={() => handleView(file)}>
                            <Eye className="w-4 h-4 mr-2 text-gray-400" />
                            {t.members.files.view}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4 mr-2 text-gray-400" />
                            {t.members.files.download}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRenameModal(file)}>
                            <Edit3 className="w-4 h-4 mr-2 text-gray-400" />
                            {t.members.files.rename}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(file)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t.members.files.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* File icon or thumbnail */}
                    {thumbnails[file.id] ? (
                      <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 group-hover:scale-[1.02] transition-transform">
                        <img src={thumbnails[file.id]} alt={file.file_name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-xl ${catStyle.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform`}>
                        <FileIcon className={`w-6 h-6 ${catStyle.text}`} />
                      </div>
                    )}

                    {/* File name */}
                    <p className="text-sm font-medium text-gray-900 text-center truncate mb-1">
                      {file.file_name}
                    </p>

                    {/* File size */}
                    <p className="text-xs text-gray-400 text-center">
                      {formatFileSize(file.file_size)}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewUrl && previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[9000]"
          >
            {/* Floating controls — always on top */}
            <div className="absolute top-4 right-4 z-[9002] flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-xl px-2 py-1.5">
              {previewFile.file_type.includes('image') && (<>
                <button onClick={() => setPreviewZoom(z => Math.max(0.25, z - 0.25))} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-white/50 text-xs w-10 text-center">{Math.round(previewZoom * 100)}%</span>
                <button onClick={() => setPreviewZoom(z => Math.min(3, z + 0.25))} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/20 mx-1" />
              </>)}
              {docxHtml !== null && (
                <button
                  onClick={() => { setDocxEditing(!docxEditing); if (!docxEditing) setDocxContent(docxHtml) }}
                  className={`p-2 rounded-lg transition-colors ${docxEditing ? 'text-teal-400 bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  title={docxEditing ? (locale === 'fr' ? 'Mode lecture' : 'Read mode') : (locale === 'fr' ? 'Modifier' : 'Edit')}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => window.open(previewUrl, '_blank')} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title={locale === 'fr' ? 'Ouvrir dans un nouvel onglet' : 'Open in new tab'}>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button onClick={() => { setPreviewUrl(null); setPreviewFile(null) }} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filename — top left */}
            <div className="absolute top-4 left-4 z-[9002] flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-white text-sm font-medium truncate max-w-[300px]">{previewFile.file_name}</p>
              <span className="text-white/40 text-xs shrink-0">{formatFileSize(previewFile.file_size)}</span>
            </div>

            {/* Click backdrop to close */}
            <div className="absolute inset-0 z-[9000]" onClick={() => { setPreviewUrl(null); setPreviewFile(null) }} />

            {/* Content */}
            <div className="absolute inset-0 z-[9001] flex items-center justify-center p-12 pt-16 pointer-events-none">
              {previewFile.file_type.includes('image') ? (
                <img
                  src={previewUrl}
                  alt={previewFile.file_name}
                  className="max-w-full max-h-full object-contain transition-transform duration-200 pointer-events-auto"
                  style={{ transform: `scale(${previewZoom})` }}
                />
              ) : previewFile.file_type.includes('pdf') ? (
                <iframe
                  src={`${previewUrl}#toolbar=0`}
                  className="w-full h-full rounded-xl bg-white pointer-events-auto"
                  style={{ maxWidth: '900px' }}
                  title={previewFile.file_name}
                />
              ) : docxHtml !== null ? (
                /* DOCX preview — read mode or edit mode */
                <div className="w-full max-w-[800px] pointer-events-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                  {docxLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                  ) : docxEditing ? (
                    <div className="flex-1 bg-white rounded-xl overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-auto">
                        <RichTextEditor
                          value={docxContent}
                          onChange={setDocxContent}
                          memberId={memberId}
                          locale={locale}
                          placeholder=""
                          compact
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-white rounded-xl overflow-auto flex flex-col">
                      <div
                        className="flex-1 p-8 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: docxHtml }}
                      />
                      <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50 rounded-b-xl shrink-0">
                        <p className="text-xs text-gray-400">
                          {locale === 'fr'
                            ? 'Ce document peut contenir des images ou du contenu manuscrit non affiché. Téléchargez pour voir le document complet.'
                            : 'This document may contain images or handwritten content not shown. Download to view the full document.'}
                        </p>
                        <a
                          href={previewUrl}
                          download={previewFile.file_name}
                          className="shrink-0 ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {locale === 'fr' ? 'Télécharger' : 'Download'}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-white/60 pointer-events-auto">
                  <File className="w-16 h-16 mx-auto mb-4 text-white/30" />
                  <p className="text-lg mb-2">{previewFile.file_name}</p>
                  <p className="text-sm text-white/40 mb-1">{formatFileSize(previewFile.file_size)}</p>
                  <p className="text-sm mb-6">{locale === 'fr' ? 'Aperçu non disponible pour ce type de fichier' : 'Preview not available for this file type'}</p>
                  <div className="flex items-center justify-center gap-3">
                    <a
                      href={previewUrl}
                      download={previewFile.file_name}
                      className="px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {locale === 'fr' ? 'Télécharger' : 'Download'}
                    </a>
                    <button
                      onClick={() => window.open(previewUrl, '_blank')}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                    >
                      {locale === 'fr' ? 'Ouvrir dans un nouvel onglet' : 'Open in new tab'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                  disabled={savingEmergency}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg"
                >
                  {savingEmergency ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </motion.div>
          ) : hasEmergencyData ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name & Relationship */}
                {member.emergency_contact.name && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Nom' : 'Name'}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {member.emergency_contact.name}
                        {member.emergency_contact.relationship && (
                          <span className="text-gray-500 font-normal"> · {member.emergency_contact.relationship}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {member.emergency_contact.phone && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{locale === 'fr' ? 'Téléphone' : 'Phone'}</p>
                        <MaskedContact value={member.emergency_contact.phone} type="phone" className="text-sm font-medium text-gray-900" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(member.emergency_contact.phone!)
                        toast.success(locale === 'fr' ? 'Téléphone copié' : 'Phone copied')
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Email */}
                {member.emergency_contact.email && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                        <MaskedContact value={member.emergency_contact.email} type="email" className="text-sm font-medium text-gray-900" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(member.emergency_contact.email!)
                        toast.success(locale === 'fr' ? 'Email copié' : 'Email copied')
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {member.emergency_contact.notes && (
                <p className="text-sm text-gray-500 mt-4 p-3 rounded-xl bg-gray-50">
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
  )
}
