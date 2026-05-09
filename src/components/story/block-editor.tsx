'use client'

import { useState } from 'react'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  FileImage,
  Minus,
  Plus,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ContentBlock, ContentBlockType } from '@/types/story'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/context'
import { motion, AnimatePresence } from 'framer-motion'

interface BlockEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null)
  const { locale } = useLanguage()
  const supabase = createClient()

  const generateBlockId = () => Math.random().toString(36).substring(7)

  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: generateBlockId(),
      type,
      content: getDefaultContent(type),
      order: blocks.length
    }
    onChange([...blocks, newBlock])
    setShowBlockMenu(false)
  }

  const getDefaultContent = (type: ContentBlockType) => {
    switch (type) {
      case 'text':
        return { text: '' }
      case 'heading':
        return { text: '', level: 2 }
      case 'list':
        return { items: [''], ordered: false }
      case 'media':
        return { items: [], caption: '' }
      case 'divider':
        return {}
      default:
        return {}
    }
  }

  const updateBlock = (id: string, content: any) => {
    onChange(blocks.map(block => block.id === id ? { ...block, content } : block))
  }

  const removeBlock = (id: string) => {
    onChange(blocks.filter(block => block.id !== id))
  }

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === blocks.length - 1)
    ) return

    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]

    // Update order
    newBlocks.forEach((block, i) => block.order = i)
    onChange(newBlocks)
  }

  const handleFileUpload = async (blockId: string, file: File) => {
    setUploadingBlockId(blockId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate file
      if (file.size > 50 * 1024 * 1024) {
        toast.error(locale === 'fr' ? 'Fichier trop volumineux. Taille max : 50 Mo' : 'File is too large. Max size is 50MB')
        return
      }

      // Detect file type
      let fileType: 'image' | 'video' | 'audio' = 'image'
      if (file.type.startsWith('video/')) {
        fileType = 'video'
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio'
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('story-media')
        .upload(fileName, file)

      if (error) throw error

      // Bucket is now private (post-20260509 migration). Issue a long-lived
      // signed URL.
      const { data: signed } = await supabase.storage
        .from('story-media')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365)
      const publicUrl = signed?.signedUrl || ''

      // Update block with file type info - add to items array
      const block = blocks.find(b => b.id === blockId)
      if (block && block.type === 'media') {
        const newItem = {
          url: publicUrl,
          fileType,
          fileName: file.name,
          alt: file.name
        }
        updateBlock(blockId, {
          ...block.content,
          items: [...(block.content.items || []), newItem]
        })
      }

      toast.success(locale === 'fr' ? 'Fichier téléchargé avec succès' : 'File uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(locale === 'fr' ? 'Impossible de télécharger le fichier' : 'Failed to upload file')
    } finally {
      setUploadingBlockId(null)
    }
  }

  const renderBlock = (block: ContentBlock, index: number) => {
    const isFirst = index === 0
    const isLast = index === blocks.length - 1

    return (
      <motion.div
        key={block.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="group relative"
      >
        {/* Block Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-100 p-5 hover:border-amber-200 hover:shadow-md transition-all duration-200 relative">
          {block.type === 'text' && (
            <textarea
              value={block.content.text || ''}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="Start writing your story..."
              className="w-full p-0 border-0 text-gray-700 placeholder:text-gray-400 focus:ring-0 focus:outline-none resize-none min-h-[120px] text-base leading-relaxed"
              autoFocus
            />
          )}

          {block.type === 'heading' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => updateBlock(block.id, { ...block.content, level })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      block.content.level === level
                        ? 'bg-gradient-to-r from-purple-200 to-purple-300 text-purple-800 shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                    }`}
                  >
                    H{level}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={block.content.text || ''}
                onChange={(e) => updateBlock(block.id, { ...block.content, text: e.target.value })}
                placeholder="Enter heading..."
                className={`w-full p-0 border-0 text-gray-800 placeholder:text-gray-400 focus:ring-0 focus:outline-none font-bold ${
                  block.content.level === 1 ? 'text-3xl' :
                  block.content.level === 2 ? 'text-2xl' : 'text-xl'
                }`}
                autoFocus
              />
            </div>
          )}

          {block.type === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateBlock(block.id, { ...block.content, ordered: false })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !block.content.ordered
                      ? 'bg-gradient-to-r from-emerald-200 to-emerald-300 text-emerald-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'
                  }`}
                >
                  • Bullets
                </button>
                <button
                  onClick={() => updateBlock(block.id, { ...block.content, ordered: true })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    block.content.ordered
                      ? 'bg-gradient-to-r from-emerald-200 to-emerald-300 text-emerald-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'
                  }`}
                >
                  1. Numbers
                </button>
              </div>
              <div className="space-y-2">
                {block.content.items.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <span className="text-gray-400 font-medium pt-2 w-6 flex-shrink-0">
                      {block.content.ordered ? `${i + 1}.` : '•'}
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...block.content.items]
                        newItems[i] = e.target.value
                        updateBlock(block.id, { ...block.content, items: newItems })
                      }}
                      placeholder="List item..."
                      className="flex-1 p-2 border-0 border-b border-gray-200 text-gray-700 placeholder:text-gray-400 focus:border-emerald-400 focus:ring-0 outline-none transition-colors bg-transparent"
                    />
                    {block.content.items.length > 1 && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (i > 0) {
                              const newItems = [...block.content.items]
                              ;[newItems[i], newItems[i - 1]] = [newItems[i - 1], newItems[i]]
                              updateBlock(block.id, { ...block.content, items: newItems })
                            }
                          }}
                          disabled={i === 0}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (i < block.content.items.length - 1) {
                              const newItems = [...block.content.items]
                              ;[newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]]
                              updateBlock(block.id, { ...block.content, items: newItems })
                            }
                          }}
                          disabled={i === block.content.items.length - 1}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const newItems = block.content.items.filter((_: any, idx: number) => idx !== i)
                            updateBlock(block.id, { ...block.content, items: newItems })
                          }}
                          className="p-1 hover:bg-red-50 rounded text-red-500 transition-all"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  updateBlock(block.id, { ...block.content, items: [...block.content.items, ''] })
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5 px-2 py-1 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add item
              </button>
            </div>
          )}

          {block.type === 'media' && (
            <div className="space-y-3">
              {/* Display uploaded media items in a grid */}
              {block.content.items && block.content.items.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {block.content.items.map((item: any, index: number) => (
                    <div key={index} className="relative group">
                      {item.fileType === 'image' && (
                        <img src={item.url} alt={item.alt} className="w-full h-48 object-cover rounded-xl shadow-md" />
                      )}
                      {item.fileType === 'video' && (
                        <video src={item.url} controls className="w-full h-48 object-cover rounded-xl shadow-md bg-black" />
                      )}
                      {item.fileType === 'audio' && (
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl h-48 flex items-center">
                          <audio src={item.url} controls className="w-full" />
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const newItems = block.content.items.filter((_: any, i: number) => i !== index)
                          updateBlock(block.id, { ...block.content, items: newItems })
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button - always show to allow adding more files */}
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 group cursor-pointer">
                <input
                  type="file"
                  id={`media-${block.id}`}
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(block.id, file)
                  }}
                  className="hidden"
                  disabled={uploadingBlockId === block.id}
                />
                <label htmlFor={`media-${block.id}`} className="cursor-pointer">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-amber-300 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm group-hover:shadow-md transition-shadow">
                    <Plus className="w-6 h-6 text-amber-700" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {uploadingBlockId === block.id ? 'Uploading...' : block.content.items?.length > 0 ? 'Add More' : 'Upload Media'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Image, video, or audio
                  </p>
                </label>
              </div>

              {/* Caption for entire media block */}
              {block.content.items && block.content.items.length > 0 && (
                <input
                  type="text"
                  value={block.content.caption || ''}
                  onChange={(e) => updateBlock(block.id, { ...block.content, caption: e.target.value })}
                  placeholder="Add a caption for this collection..."
                  className="w-full p-2 border-0 border-b border-gray-200 text-sm text-gray-600 italic placeholder:text-gray-400 focus:border-amber-400 focus:ring-0 outline-none transition-colors"
                />
              )}
            </div>
          )}

          {block.type === 'divider' && (
            <div className="py-2">
              <div className="border-t-2 border-gray-300 w-full rounded-full"></div>
            </div>
          )}

          {/* Inline Block Controls */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => moveBlock(block.id, 'up')}
              disabled={isFirst}
              className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move up"
            >
              <ChevronUp className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => moveBlock(block.id, 'down')}
              disabled={isLast}
              className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move down"
            >
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>
            <div className="w-px h-4 bg-gray-300"></div>
            <button
              onClick={() => removeBlock(block.id)}
              className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
              title="Delete block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const blockTypes: { type: ContentBlockType; icon: any; label: string; description: string; color: string; bgColor: string }[] = [
    { type: 'text', icon: AlignLeft, label: 'Paragraph', description: 'Write your thoughts', color: 'from-blue-200 to-blue-300', bgColor: 'bg-blue-50' },
    { type: 'heading', icon: Heading1, label: 'Heading', description: 'Section title', color: 'from-purple-200 to-purple-300', bgColor: 'bg-purple-50' },
    { type: 'list', icon: List, label: 'List', description: 'Bullet or numbered', color: 'from-emerald-200 to-emerald-300', bgColor: 'bg-emerald-50' },
    { type: 'media', icon: FileImage, label: 'Media', description: 'Image, video, or audio', color: 'from-amber-200 to-amber-300', bgColor: 'bg-amber-50' },
    { type: 'divider', icon: Minus, label: 'Divider', description: 'Separate sections', color: 'from-gray-200 to-gray-300', bgColor: 'bg-gray-50' },
  ]

  return (
    <div className="space-y-3">
      {/* Empty State */}
      {blocks.length === 0 && !showBlockMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Plus className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Building Your Story</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Add text, images, videos, and more to create a rich story
          </p>
        </motion.div>
      )}

      {/* Render blocks */}
      <AnimatePresence>
        {blocks.map((block, index) => renderBlock(block, index))}
      </AnimatePresence>

      {/* Add Block Button */}
      <div className="relative">
        <AnimatePresence>
          {!showBlockMenu ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlockMenu(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-4 hover:border-amber-400 hover:bg-gradient-to-br hover:from-amber-50/50 hover:to-transparent transition-all duration-200 group"
            >
              <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-amber-600 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="font-medium">Add Block</span>
              </div>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/90 backdrop-blur-xl border-2 border-amber-300 rounded-3xl p-6 shadow-2xl shadow-amber-500/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Add a Block</h3>
                  <p className="text-sm text-gray-500">Choose what you'd like to add</p>
                </div>
                <button
                  onClick={() => setShowBlockMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {blockTypes.map(({ type, icon: Icon, label, description, color, bgColor }) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addBlock(type)}
                    className={`flex flex-col items-start gap-3 p-4 rounded-2xl ${bgColor} border-2 border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-200 text-left group`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
