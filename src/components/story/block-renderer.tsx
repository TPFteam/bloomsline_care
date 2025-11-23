'use client'

import { useState } from 'react'
import { X, ZoomIn, Maximize2 } from 'lucide-react'
import type { ContentBlock } from '@/types/story'

interface BlockRendererProps {
  blocks: ContentBlock[]
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string } | null>(null)

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

      case 'image':
        return (
          <figure className="my-8">
            <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer"
                 onClick={() => setLightboxImage({ url: block.content.url, caption: block.content.caption })}>
              <img
                src={block.content.url}
                alt={block.content.alt || block.content.caption || 'Story image'}
                className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
              />
              {/* Zoom overlay - only shows on hover */}
              <div className="absolute inset-0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
                  <ZoomIn className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
            {block.content.caption && (
              <figcaption className="text-center text-sm text-gray-500 mt-3 italic">
                {block.content.caption}
              </figcaption>
            )}
          </figure>
        )

      case 'video':
        return (
          <figure className="my-8">
            <div className="relative rounded-xl overflow-hidden shadow-lg group">
              <video
                src={block.content.url}
                controls
                controlsList="nodownload"
                className="w-full h-auto bg-black"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              {/* Fullscreen hint */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg px-3 py-2 pointer-events-none">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Maximize2 className="w-4 h-4" />
                  <span>Click for fullscreen</span>
                </div>
              </div>
            </div>
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

      {/* Image Lightbox Modal - Modern with Blur */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-lg hover:shadow-xl transition-all z-10 border border-gray-200"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          <div className="max-w-6xl max-h-full w-full h-full flex flex-col items-center justify-center">
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || 'Full size image'}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              {lightboxImage.caption && (
                <p className="text-gray-700 text-center mt-4 text-base font-medium">
                  {lightboxImage.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
