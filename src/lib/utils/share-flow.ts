import { toPng } from 'html-to-image'

interface ShareFlowOptions {
  element: HTMLElement
  locale: string
  date: string
}

export async function captureFlowAsImage({ element, locale, date }: ShareFlowOptions): Promise<Blob | null> {
  try {
    // Capture the element as PNG data URL
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true, // Skip font loading to avoid issues
      filter: (node) => {
        // Skip any problematic elements
        if (node instanceof Element) {
          return !node.classList?.contains('ignore-capture')
        }
        return true
      },
    })

    // Load the image
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = dataUrl
    })

    // Create final canvas with branding (no header - captured image has date already)
    const padding = 40
    const footerHeight = 70
    const totalWidth = img.width + padding * 2
    const totalHeight = img.height + padding * 2 + footerHeight

    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = totalWidth
    finalCanvas.height = totalHeight
    const ctx = finalCanvas.getContext('2d')

    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, totalHeight)
    gradient.addColorStop(0, '#f0fdfa')
    gradient.addColorStop(0.5, '#ecfdf5')
    gradient.addColorStop(1, '#ffffff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, totalWidth, totalHeight)

    // Draw the captured flow (no header offset needed)
    const flowY = padding

    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 4

    // Draw white rounded background
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, padding - 10, flowY - 10, img.width + 20, img.height + 20, 24)
    ctx.fill()

    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Draw the actual flow image
    ctx.drawImage(img, padding, flowY)

    // Draw footer with branding - centered layout (no logo)
    const footerY = flowY + img.height + 35
    const centerX = totalWidth / 2

    // Draw "Bloomsline" text centered
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Bloomsline', centerX, footerY + 20)

    // Draw website below brand name
    ctx.fillStyle = '#4A9A86'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.fillText('bloomsline.com', centerX, footerY + 44)

    // Convert to blob
    return new Promise((resolve) => {
      finalCanvas.toBlob((blob) => {
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
        title: locale === 'fr' ? 'Ma journée - Bloomsline' : locale === 'es' ? 'Mi día - Bloomsline' : 'My Day - Bloomsline',
        text: locale === 'fr' ? 'Voici ma journée sur Bloomsline' : locale === 'es' ? 'Aquí está mi día en Bloomsline' : "Here's my day on Bloomsline",
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

// Helper function to draw rounded rectangle
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

