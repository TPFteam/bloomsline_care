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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { MemberFile, FileCategory, Member, EmergencyContact } from '@/types/member'

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

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileTitle, setFileTitle] = useState('')
  const [fileDescription, setFileDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('general')

  // Emergency contact edit states
  const [editingEmergency, setEditingEmergency] = useState(false)
  const [savingEmergency, setSavingEmergency] = useState(false)
  const [emergencyName, setEmergencyName] = useState(member.emergency_contact.name || '')
  const [emergencyRelationship, setEmergencyRelationship] = useState(member.emergency_contact.relationship || '')
  const [emergencyPhone, setEmergencyPhone] = useState(member.emergency_contact.phone || '')
  const [emergencyEmail, setEmergencyEmail] = useState(member.emergency_contact.email || '')
  const [emergencyNotes, setEmergencyNotes] = useState(member.emergency_contact.notes || '')

  useEffect(() => {
    fetchFiles()
  }, [memberId])

  const fetchFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('member_files')
        .select('*')
        .eq('member_id', memberId)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false })

      if (error && error.code !== '42P01') throw error

      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection - opens modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setFileTitle(file.name.replace(/\.[^/.]+$/, '')) // Remove extension for default title
    setFileDescription('')
    setSelectedCategory('general')
    setShowUploadModal(true)

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle actual upload after modal confirmation
  const handleFileUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${memberId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('member-files')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Save file metadata with title and description
      const { error: dbError } = await supabase
        .from('member_files')
        .insert({
          member_id: memberId,
          practitioner_id: user.id,
          file_name: fileTitle.trim() || selectedFile.name,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          storage_path: fileName,
          category: selectedCategory,
          description: fileDescription.trim() || null,
        })

      if (dbError) throw dbError

      toast.success(t.members.success.fileUploaded)
      setShowUploadModal(false)
      setSelectedFile(null)
      setFileTitle('')
      setFileDescription('')
      fetchFiles()
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
    setFileTitle('')
    setFileDescription('')
  }

  const handleView = async (file: MemberFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('member-files')
        .createSignedUrl(file.storage_path, 60 * 60) // 1 hour expiry

      if (error) throw error

      // Open in new tab
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Error viewing file:', error)
      toast.error('Failed to view file')
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
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async (file: MemberFile) => {
    if (!confirm(t.members.files.confirmDelete)) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('member-files')
        .remove([file.storage_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('member_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      toast.success('File deleted')
      fetchFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
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

      toast.success('Emergency contact updated')
      setEditingEmergency(false)
      onMemberUpdate()
    } catch (error) {
      console.error('Error updating emergency contact:', error)
      toast.error('Failed to update')
    } finally {
      setSavingEmergency(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl  border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 border-4 border-lavender-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 animate-pulse-glow"></div>
          <p className="text-gray-500 font-medium">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
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
                  <a href={`mailto:${member.email}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {member.email}
                  </a>
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
                  <a href={`tel:${member.phone}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {member.phone}
                  </a>
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

      {/* Header with Upload */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center ">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          {t.members.files.title}
        </h2>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-colors hover-lift"
        >
          <Upload className="w-4 h-4 mr-2" />
          {t.members.files.uploadFile}
        </Button>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40  z-50 flex items-center justify-center p-4"
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
                  Upload File
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5">
                {/* Selected File Preview */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-lavender-50 to-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-white  flex items-center justify-center">
                    {selectedFile.type.includes('image') ? (
                      <FileImage className="w-6 h-6 text-lavender-500" />
                    ) : selectedFile.type.includes('pdf') ? (
                      <FileType className="w-6 h-6 text-red-500" />
                    ) : (
                      <File className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-gray-400">(display name)</span>
                  </label>
                  <input
                    type="text"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                    placeholder="Enter a title for this file..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none bg-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-lavender-500" />
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="Add a description or notes about this file..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-gray-100 outline-none resize-none bg-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
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
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={handleCloseModal}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={uploading || !fileTitle.trim()}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Files List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl  border border-gray-200 overflow-hidden"
      >
        {files.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
              <div className="relative w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Folder className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {t.members.files.noFiles}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {t.members.files.noFilesDescription}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-colors hover-lift"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.members.files.uploadFile}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100/50">
            {/* Files */}
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.file_type)
              const catStyle = categoryColors[file.category]
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * index }}
                  className="p-5 hover:bg-white/60 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0  group-hover:shadow-md group-hover:scale-105 transition-all">
                      <FileIcon className="w-6 h-6 text-gray-500" />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {file.file_name}
                          </h4>
                          {file.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {file.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${catStyle.bg} ${catStyle.text}`}>
                              {t.members.fileCategories[file.category]}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatFileSize(file.file_size)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(file.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(file)}
                            className="h-9 w-9 p-0 text-gray-400 hover:text-teal-600 hover:bg-gray-50 rounded-xl transition-colors"
                            title="View file"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file)}
                            className="h-9 w-9 p-0 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file)}
                            className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

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
                        <a href={`tel:${member.emergency_contact.phone}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {member.emergency_contact.phone}
                        </a>
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
                        <a href={`mailto:${member.emergency_contact.email}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {member.emergency_contact.email}
                        </a>
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
