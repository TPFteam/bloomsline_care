'use client'

/**
 * Stylized phone / laptop chrome that wraps the resource preview. Pure
 * CSS, no images — keeps the visual minimal so the actual content stays
 * the focal point. The proportions roughly match a 6.1" phone (390x844)
 * and a 13" laptop.
 */

interface DeviceFrameProps {
  device: 'mobile' | 'desktop'
  children: React.ReactNode
}

export function DeviceFrame({ device, children }: DeviceFrameProps) {
  if (device === 'mobile') {
    return (
      // Width caps at 280 but scales down so the frame still fits cleanly
      // when the parent column is narrower than that (e.g. small laptop
      // viewports where the editor's sidebar is ~240px).
      <div className="mx-auto w-full" style={{ maxWidth: 280 }}>
        {/* Phone outer shell */}
        <div className="rounded-[2.2rem] bg-gray-900 p-2 shadow-xl shadow-gray-300/60">
          <div className="rounded-[1.7rem] overflow-hidden bg-white relative" style={{ aspectRatio: '9 / 19.5' }}>
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-5 z-30 text-[10px] font-semibold text-gray-900 bg-transparent pointer-events-none">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">●●●●</span>
                <span className="text-[9px]">📶</span>
                <span className="text-[9px]">🔋</span>
              </div>
            </div>
            {/* Notch */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-gray-900 z-40" />
            {/* Content area — children render below status bar */}
            <div className="absolute inset-0 pt-7 overflow-hidden flex flex-col">
              {children}
            </div>
            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-gray-900/40 z-40 pointer-events-none" />
          </div>
        </div>
      </div>
    )
  }

  // Desktop / laptop
  return (
    <div className="mx-auto w-full max-w-[680px]">
      {/* Browser chrome */}
      <div className="rounded-t-xl bg-gray-100 border border-gray-200 border-b-0 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-3 px-3 py-0.5 rounded-md bg-white text-[11px] text-gray-500 truncate">
          app.bloomsline.com/resources/…
        </div>
      </div>
      {/* Viewport */}
      <div className="rounded-b-xl border border-gray-200 border-t-0 bg-white overflow-hidden" style={{ height: 540 }}>
        <div className="h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}
