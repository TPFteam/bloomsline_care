'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ZoomIn, ZoomOut, Download, RotateCcw } from 'lucide-react'
import type { ContentBlock } from '@/types/story'

interface BlockRendererProps {
  blocks: ContentBlock[]
}

interface TouchState {
  startX: number
  startY: number
  startDistance: number
  startScale: number
  lastX: number
  lastY: number
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; caption?: string; index?: number; total?: number; allImages?: string[] } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const touchState = useRef<TouchState | null>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  // Set up portal container on mount
  useEffect(() => {
    setPortalContainer(document.body)
  }, [])

  // Reset position and zoom when image changes, and lock body scroll
  useEffect(() => {
    if (lightboxImage) {
      setZoomLevel(1)
      setPosition({ x: 0, y: 0 })
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${window.scrollY}px`
    } else {
      // Restore body scroll
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [lightboxImage])

  // Get distance between two touch points
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Get center point between two touches
  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY }
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    }
  }

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start pan
      touchState.current = {
        startX: e.touches[0].clientX - position.x,
        startY: e.touches[0].clientY - position.y,
        startDistance: 0,
        startScale: zoomLevel,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY
      }
      setIsDragging(true)
    } else if (e.touches.length === 2) {
      // Two finger touch - start pinch zoom
      e.preventDefault()
      const distance = getTouchDistance(e.touches)
      touchState.current = {
        startX: position.x,
        startY: position.y,
        startDistance: distance,
        startScale: zoomLevel,
        lastX: getTouchCenter(e.touches).x,
        lastY: getTouchCenter(e.touches).y
      }
    }
  }, [position, zoomLevel])

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current) return

    if (e.touches.length === 1) {
      // Single touch pan
      e.preventDefault()
      const newX = e.touches[0].clientX - touchState.current.startX
      const newY = e.touches[0].clientY - touchState.current.startY
      setPosition({ x: newX, y: newY })
    } else if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault()
      const distance = getTouchDistance(e.touches)
      const scale = (distance / touchState.current.startDistance) * touchState.current.startScale
      const newZoom = Math.min(Math.max(scale, 0.5), 4)
      setZoomLevel(newZoom)

      // Adjust position to zoom towards center of pinch
      const center = getTouchCenter(e.touches)
      const deltaX = center.x - touchState.current.lastX
      const deltaY = center.y - touchState.current.lastY
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      touchState.current.lastX = center.x
      touchState.current.lastY = center.y
    }
  }, [])

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false)

      // Snap back to center if zoom is 1 or less
      if (zoomLevel <= 1) {
        setPosition({ x: 0, y: 0 })
        setZoomLevel(1)
      }

      touchState.current = null
    } else if (e.touches.length === 1) {
      // Switched from pinch to single touch
      touchState.current = {
        startX: e.touches[0].clientX - position.x,
        startY: e.touches[0].clientY - position.y,
        startDistance: 0,
        startScale: zoomLevel,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY
      }
    }
  }, [zoomLevel, position])

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.5), 4))
  }, [])

  // Handle mouse drag for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    touchState.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
      startDistance: 0,
      startScale: zoomLevel,
      lastX: e.clientX,
      lastY: e.clientY
    }
  }, [position, zoomLevel])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !touchState.current) return
    e.preventDefault()
    const newX = e.clientX - touchState.current.startX
    const newY = e.clientY - touchState.current.startY
    setPosition({ x: newX, y: newY })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    touchState.current = null
  }, [])

  // Handle double tap to zoom
  const lastTap = useRef<number>(0)
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      // Double tap detected
      if (zoomLevel > 1) {
        // Reset zoom
        setZoomLevel(1)
        setPosition({ x: 0, y: 0 })
      } else {
        // Zoom to 2x at tap position
        setZoomLevel(2)
      }
    }
    lastTap.current = now
  }, [zoomLevel])

  // Navigate to next/prev image
  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (!lightboxImage?.allImages || lightboxImage.allImages.length <= 1) return

    const currentIndex = lightboxImage.index || 0
    let newIndex: number

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % lightboxImage.allImages.length
    } else {
      newIndex = currentIndex === 0 ? lightboxImage.allImages.length - 1 : currentIndex - 1
    }

    setLightboxImage({
      ...lightboxImage,
      url: lightboxImage.allImages[newIndex],
      index: newIndex
    })
  }, [lightboxImage])

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

        // Get all image URLs for gallery navigation
        const allImageUrls = mediaItems.filter((i: any) => i.fileType === 'image').map((i: any) => i.url)

        return (
          <figure className="my-8">
            {mediaItems.length > 0 && (
              <div className={`grid gap-4 ${mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {mediaItems.map((item: any, index: number) => (
                  <div key={index}>
                    {item.fileType === 'image' && (
                      <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer"
                           onClick={() => {
                             const imageIndex = allImageUrls.indexOf(item.url)
                             setZoomLevel(1)
                             setPosition({ x: 0, y: 0 })
                             setLightboxImage({
                               url: item.url,
                               caption: block.content.caption,
                               index: imageIndex,
                               total: allImageUrls.length,
                               allImages: allImageUrls
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

      {/* Enhanced Image Lightbox with Touch Gestures - Rendered via Portal */}
      {lightboxImage && portalContainer && createPortal(
        <div
          className="fixed top-0 left-0 right-0 bottom-0 bg-[#f8fafb] flex flex-col"
          style={{ zIndex: 99999, height: '100dvh', width: '100vw' }}
          ref={containerRef}
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {lightboxImage.total && lightboxImage.total > 1 && (
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                    {(lightboxImage.index || 0) + 1} / {lightboxImage.total}
                  </span>
                )}
                {lightboxImage.caption && (
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {lightboxImage.caption}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setLightboxImage(null)
                  setZoomLevel(1)
                  setPosition({ x: 0, y: 0 })
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Image Container with Touch Gestures */}
          <div
            className={`flex-1 flex items-center justify-center overflow-hidden touch-none p-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onTouchStart={(e) => {
              handleTouchStart(e)
              handleDoubleTap(e)
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={lightboxImage.url}
              alt={lightboxImage.caption || 'Full size image'}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none',
              }}
              className="rounded-xl shadow-lg pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Navigation Arrows (for multiple images) */}
          {lightboxImage.allImages && lightboxImage.allImages.length > 1 && (
            <>
              <button
                onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white shadow-lg hover:bg-gray-50 rounded-full transition-all border border-gray-200"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => navigateImage('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white shadow-lg hover:bg-gray-50 rounded-full transition-all border border-gray-200"
                aria-label="Next image"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Footer Controls */}
          <div className="bg-white border-t border-gray-200">
            <div className="flex flex-col items-center p-4">
              {/* Control Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                {/* Zoom Out */}
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.5))}
                  disabled={zoomLevel <= 0.5}
                  className="p-3 hover:bg-white rounded-full transition-all disabled:opacity-40"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-5 h-5 text-gray-700" />
                </button>

                {/* Zoom Level */}
                <span className="text-sm font-medium text-gray-700 min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>

                {/* Zoom In */}
                <button
                  onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.5))}
                  disabled={zoomLevel >= 4}
                  className="p-3 hover:bg-white rounded-full transition-all disabled:opacity-40"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-5 h-5 text-gray-700" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Reset */}
                <button
                  onClick={() => {
                    setZoomLevel(1)
                    setPosition({ x: 0, y: 0 })
                  }}
                  className="p-3 hover:bg-white rounded-full transition-all"
                  aria-label="Reset"
                >
                  <RotateCcw className="w-5 h-5 text-gray-700" />
                </button>

                {/* Download */}
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = lightboxImage.url
                    link.download = `image-${Date.now()}.jpg`
                    link.click()
                  }}
                  className="p-3 hover:bg-white rounded-full transition-all"
                  aria-label="Download"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Hint text */}
              <p className="text-gray-400 text-xs mt-3 md:hidden">
                Pinch to zoom • Double-tap to zoom • Drag to pan
              </p>
              <p className="text-gray-400 text-xs mt-3 hidden md:block">
                Scroll to zoom • Drag to pan
              </p>
            </div>
          </div>
        </div>,
        portalContainer
      )}
    </>
  )
}
