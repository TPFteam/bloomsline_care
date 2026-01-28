import html2canvas from 'html2canvas'

interface ShareFlowOptions {
  element: HTMLElement
  locale: string
  date: string
}

export async function captureFlowAsImage({ element, locale, date }: ShareFlowOptions): Promise<Blob | null> {
  try {
    // Create a wrapper div with branding
    const wrapper = document.createElement('div')
    wrapper.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      background: linear-gradient(to bottom, #f0fdfa, #ecfdf5, #ffffff);
      padding: 24px;
      border-radius: 24px;
      width: ${element.offsetWidth + 48}px;
    `

    // Clone the element
    const clone = element.cloneNode(true) as HTMLElement
    clone.style.cssText = `
      background: rgba(255, 255, 255, 0.9);
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    `

    // Create header with date
    const header = document.createElement('div')
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      padding: 0 4px;
    `
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #4A9A86, #5AB39C); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        <span style="font-size: 14px; font-weight: 600; color: #374151;">${date}</span>
      </div>
    `

    // Create footer with branding
    const footer = document.createElement('div')
    footer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
    `
    footer.innerHTML = `
      <div style="position: relative; width: 28px; height: 28px;">
        ${generateLogoSVG()}
      </div>
      <span style="font-size: 14px; font-weight: 700; color: #374151; letter-spacing: -0.02em;">Bloomsline</span>
      <span style="font-size: 11px; color: #9CA3AF; margin-left: 4px;">${locale === 'fr' ? 'Mon bien-être' : 'My wellbeing'}</span>
    `

    wrapper.appendChild(header)
    wrapper.appendChild(clone)
    wrapper.appendChild(footer)
    document.body.appendChild(wrapper)

    // Capture the wrapper
    const canvas = await html2canvas(wrapper, {
      backgroundColor: null,
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      logging: false,
    })

    // Clean up
    document.body.removeChild(wrapper)

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png', 1.0)
    })
  } catch (error) {
    console.error('Error capturing flow:', error)
    return null
  }
}

export async function shareFlow(blob: Blob, locale: string): Promise<boolean> {
  const file = new File([blob], 'my-day-bloomsline.png', { type: 'image/png' })

  // Try Web Share API first (works on mobile)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: locale === 'fr' ? 'Ma journée - Bloomsline' : 'My Day - Bloomsline',
        text: locale === 'fr' ? 'Voici ma journée sur Bloomsline' : "Here's my day on Bloomsline",
      })
      return true
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err)
      }
      return false
    }
  }

  // Fallback: Download the image
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-day-bloomsline.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

function generateLogoSVG(): string {
  // Bloomsline flower logo as inline SVG
  return `
    <svg viewBox="0 0 40 40" width="28" height="28">
      <!-- Petals -->
      <ellipse cx="20" cy="12" rx="5" ry="9" fill="url(#petal-gradient)" transform="rotate(0 20 20)"/>
      <ellipse cx="20" cy="12" rx="5" ry="9" fill="url(#petal-gradient)" transform="rotate(60 20 20)"/>
      <ellipse cx="20" cy="12" rx="5" ry="9" fill="url(#petal-gradient)" transform="rotate(120 20 20)"/>
      <ellipse cx="20" cy="12" rx="5" ry="9" fill="url(#petal-gradient)" transform="rotate(180 20 20)"/>
      <ellipse cx="20" cy="12" rx="5" ry="9" fill="url(#petal-gradient)" transform="rotate(240 20 20)"/>
      <ellipse cx="20" cy="12" rx="5" ry="9" fill="url(#petal-gradient)" transform="rotate(300 20 20)"/>
      <!-- Center -->
      <circle cx="20" cy="20" r="8" fill="url(#center-gradient)"/>
      <defs>
        <linearGradient id="petal-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#D4856A"/>
          <stop offset="100%" stop-color="#E8A87C"/>
        </linearGradient>
        <linearGradient id="center-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4A9A86"/>
          <stop offset="100%" stop-color="#5AB39C"/>
        </linearGradient>
      </defs>
    </svg>
  `
}
