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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { MemberFile, FileCategory } from '@/types/member'

interface FilesTabProps {
  memberId: string
}

export default function FilesTab({ memberId }: FilesTabProps) {
  const { t } = useLanguage()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-8 text-center">
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

      {/* Header with Upload */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-lavender-600" />
          </div>
          {t.members.files.title}
        </h2>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50 transition-smooth hover-lift"
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[1.5rem] shadow-2xl max-w-lg w-full overflow-hidden"
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
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none resize-none bg-white"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200/80 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none bg-white"
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
                  className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50"
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
        className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 overflow-hidden"
      >
        {files.length === 0 ? (
          <div className="p-16 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-lavender-400/30 to-mint-400/30 rounded-3xl blur-xl" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-lavender-100 to-lavender-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Folder className="w-10 h-10 text-lavender-600" />
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
              className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50 px-6 transition-smooth hover-lift"
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
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
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
                            className="h-9 w-9 p-0 text-gray-400 hover:text-mint-600 hover:bg-mint-50 rounded-xl transition-smooth"
                            title="View file"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file)}
                            className="h-9 w-9 p-0 text-gray-400 hover:text-lavender-600 hover:bg-lavender-50 rounded-xl transition-smooth"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file)}
                            className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-smooth"
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
    </div>
  )
}
