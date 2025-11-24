'use client'

import { useState } from 'react'
import { X, ZoomIn, ZoomOut, Maximize2, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ContentBlock } from '@/types/story'

interface BlockRendererProps {
  blocks: ContentBlock[]
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string; index?: number; total?: number } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Safety check: ensure blocks is an array
  if (!blocks || !Array.isArray(blocks)) {
    return null
  }

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
            {block.content.text}
          </p>
        )

      case 'heading':
        const level = block.content.level as 1 | 2 | 3
        const headingClasses = {
          1: 'text-4xl font-bold text-foreground mb-6 mt-8',
          2: 'text-3xl font-bold text-foreground mb-5 mt-7',
          3: 'text-2xl font-bold text-foreground mb-4 mt-6'
        }
        const HeadingContent = block.content.text

        if (level === 1) {
          return <h1 className={headingClasses[1]}>{HeadingContent}</h1>
        } else if (level === 2) {
          return <h2 className={headingClasses[2]}>{HeadingContent}</h2>
        } else {
          return <h3 className={headingClasses[3]}>{HeadingContent}</h3>
        }

      case 'list':
        const ListTag = block.content.ordered ? 'ol' : 'ul'
        return (
          <ListTag className={`mb-6 space-y-2 ${
            block.content.ordered
              ? 'list-decimal list-inside'
              : 'list-disc list-inside'
          }`}>
            {block.content.items.map((item: string, index: number) => (
              <li key={index} className="text-gray-700 leading-relaxed">
                {item}
              </li>
            ))}
          </ListTag>
        )

      case 'media':
        // Handle both old format (single url/fileType) and new format (items array)
        const mediaItems = block.content.items || (block.content.url ? [{
          url: block.content.url,
          fileType: block.content.fileType,
          fileName: block.content.fileName,
          alt: block.content.alt
        }] : [])

        return (
          <figure className="my-8">
            {mediaItems.length > 0 && (
              <div className={`grid gap-4 ${mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {mediaItems.map((item: any, index: number) => (
                  <div key={index}>
                    {item.fileType === 'image' && (
                      <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer"
                           onClick={() => {
                             setZoomLevel(1) // Reset zoom when opening
                             setLightboxImage({
                               url: item.url,
                               caption: block.content.caption,
                               index: index,
                               total: mediaItems.filter((i: any) => i.fileType === 'image').length
                             })
                           }}>
                        <img
                          src={item.url}
                          alt={item.alt || 'Story image'}
                          className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Zoom overlay - only shows on hover */}
                        <div className="absolute inset-0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
                            <ZoomIn className="w-6 h-6 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    )}

                    {item.fileType === 'video' && (
                      <div className="relative rounded-xl overflow-hidden shadow-lg group">
                        <video
                          src={item.url}
                          controls
                          controlsList="nodownload"
                          className="w-full h-auto bg-black"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {item.fileType === 'audio' && (
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 shadow-lg">
                        <audio
                          src={item.url}
                          controls
                          controlsList="nodownload"
                          className="w-full"
                          preload="metadata"
                        >
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {block.content.caption && (
              <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                {block.content.caption}
              </figcaption>
            )}
          </figure>
        )

      case 'divider':
        return (
          <hr className="my-8 border-t-2 border-gray-200" />
        )

      default:
        return null
    }
  }

  return (
    <>
      <div className="prose prose-lg max-w-none">
        {blocks.map((block) => (
          <div key={block.id}>
            {renderBlock(block)}
          </div>
        ))}
      </div>

      {/* Enhanced Image Lightbox Modal - Popup Style */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => {
            setLightboxImage(null)
            setZoomLevel(1)
          }}
        >
          {/* Modal Card */}
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {lightboxImage.total && lightboxImage.total > 1 && (
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                    {(lightboxImage.index || 0) + 1} / {lightboxImage.total}
                  </span>
                )}
                {lightboxImage.caption && (
                  <span className="text-sm font-medium text-gray-700 truncate max-w-md">
                    {lightboxImage.caption}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setLightboxImage(null)
                  setZoomLevel(1)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-50">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Full size image'}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.3s ease',
                }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Footer with Controls */}
            <div className="flex items-center justify-center p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                {/* Zoom Out */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setZoomLevel(prev => Math.max(0.5, prev - 0.25))
                  }}
                  disabled={zoomLevel <= 0.5}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <ZoomOut className="w-5 h-5 text-gray-700" />
                </button>

                {/* Zoom Level Display */}
                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>

                {/* Zoom In */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setZoomLevel(prev => Math.min(3, prev + 0.25))
                  }}
                  disabled={zoomLevel >= 3}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <ZoomIn className="w-5 h-5 text-gray-700" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-2"></div>

                {/* Reset Zoom */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setZoomLevel(1)
                  }}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-all"
                  aria-label="Reset zoom"
                  title="Reset zoom"
                >
                  <Maximize2 className="w-5 h-5 text-gray-700" />
                </button>

                {/* Download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const link = document.createElement('a')
                    link.href = lightboxImage.url
                    link.download = `image-${Date.now()}.jpg`
                    link.click()
                  }}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-all"
                  aria-label="Download"
                  title="Download image"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
