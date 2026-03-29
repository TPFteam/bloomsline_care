'use client'

import { useState } from 'react'
import { CirclePlay, X, Maximize2, Minimize2 } from 'lucide-react'

interface TutorialItem {
  url: string
  title: string
}

interface TutorialVideoProps {
  url?: string
  title?: string
  videos?: TutorialItem[]
  size?: 'sm' | 'md'
}

export function TutorialVideo({ url, title, videos, size = 'sm' }: TutorialVideoProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [activeVideo, setActiveVideo] = useState<TutorialItem | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const items: TutorialItem[] = videos || (url ? [{ url, title: title || 'Tutorial' }] : [])
  const isSingle = items.length === 1

  const handleClick = () => {
    if (isSingle) {
      setActiveVideo(items[0])
      setFullscreen(false)
    } else {
      setShowMenu(!showMenu)
    }
  }

  const openVideo = (item: TutorialItem) => {
    setActiveVideo(item)
    setShowMenu(false)
    setFullscreen(false)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={handleClick}
          title={title || 'Tutorial'}
          className={`group relative inline-flex items-center justify-center rounded-full transition-all hover:scale-110 ${
            size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
          }`}
        >
          <CirclePlay className={`text-gray-300 group-hover:text-teal-500 transition-colors ${size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'}`} />
        </button>

        {/* Multi-video menu */}
        {showMenu && !isSingle && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setShowMenu(false)} />
            <div className="absolute top-full right-0 mt-2 z-[9999] bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[240px]">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => openVideo(item)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                >
                  <CirclePlay className="w-4 h-4 text-teal-500 flex-shrink-0" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Video player */}
      {activeVideo && (
        <div
          className={`fixed z-[9999] ${
            fullscreen
              ? 'inset-0 bg-black/90 flex items-center justify-center p-4'
              : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          }`}
          onClick={fullscreen ? () => setActiveVideo(null) : undefined}
        >
          <div
            className={`bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
              fullscreen
                ? 'max-w-[90vw] max-h-[85vh]'
                : 'w-[560px]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/50">
              <p className="text-xs font-medium text-gray-400 truncate">{activeVideo.title}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title={fullscreen ? 'Minimize' : 'Maximize'}
                >
                  {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video */}
            <video
              src={activeVideo.url}
              controls
              autoPlay
              className={fullscreen ? 'max-w-[90vw] max-h-[80vh]' : 'w-full'}
            />
          </div>
        </div>
      )}
    </>
  )
}
