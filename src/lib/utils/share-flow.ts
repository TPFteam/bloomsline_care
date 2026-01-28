import html2canvas from 'html2canvas'

interface ShareFlowOptions {
  element: HTMLElement
  locale: string
  date: string
}

export async function captureFlowAsImage({ element, locale, date }: ShareFlowOptions): Promise<Blob | null> {
  try {
    // First capture the original element directly
    const originalCanvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      ignoreElements: (el) => {
        // Ignore any elements that might cause issues
        return el.tagName === 'IFRAME' || el.classList?.contains('ignore-capture')
      },
    })

    // Create a new canvas with branding
    const padding = 40
    const headerHeight = 60
    const footerHeight = 60
    const totalWidth = originalCanvas.width + padding * 2
    const totalHeight = originalCanvas.height + padding * 2 + headerHeight + footerHeight

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

    // Draw header
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(date, padding, padding + 35)

    // Draw small leaf icon before date
    drawLeafIcon(ctx, padding - 40, padding + 12, 28)

    // Draw the captured flow
    const flowY = padding + headerHeight

    // Add rounded rectangle background for the flow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    roundRect(ctx, padding - 10, flowY - 10, originalCanvas.width + 20, originalCanvas.height + 20, 24)
    ctx.fill()

    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 4
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    roundRect(ctx, padding - 10, flowY - 10, originalCanvas.width + 20, originalCanvas.height + 20, 24)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Draw the actual flow image
    ctx.drawImage(originalCanvas, padding, flowY)

    // Draw footer with branding
    const footerY = flowY + originalCanvas.height + 30

    // Draw Bloomsline logo
    drawBloomslineLogo(ctx, totalWidth / 2 - 80, footerY, 36)

    // Draw "Bloomsline" text
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Bloomsline', totalWidth / 2 - 35, footerY + 26)

    // Draw tagline
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(locale === 'fr' ? 'Mon bien-être' : 'My wellbeing', totalWidth / 2 + 95, footerY + 24)

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

// Helper function to draw leaf icon
function drawLeafIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)

  // Draw background circle
  ctx.fillStyle = '#4A9A86'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  // Draw leaf shape (simplified)
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const s = size / 24 // scale factor
  ctx.beginPath()
  ctx.moveTo(11 * s, 20 * s)
  ctx.bezierCurveTo(11 * s, 15 * s, 8 * s, 10 * s, 10 * s, 6 * s)
  ctx.bezierCurveTo(15 * s, 5 * s, 17 * s, 5 * s, 19 * s, 3 * s)
  ctx.bezierCurveTo(20 * s, 5 * s, 21 * s, 8 * s, 21 * s, 11 * s)
  ctx.bezierCurveTo(21 * s, 16 * s, 16 * s, 20 * s, 11 * s, 20 * s)
  ctx.stroke()

  ctx.restore()
}

// Helper function to draw Bloomsline logo
function drawBloomslineLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)

  const center = size / 2
  const petalWidth = size * 0.15
  const petalHeight = size * 0.35

  // Draw 6 petals
  for (let i = 0; i < 6; i++) {
    ctx.save()
    ctx.translate(center, center)
    ctx.rotate((i * 60 * Math.PI) / 180)

    // Petal gradient
    const petalGradient = ctx.createLinearGradient(0, -petalHeight, 0, 0)
    petalGradient.addColorStop(0, '#E8A87C')
    petalGradient.addColorStop(1, '#D4856A')
    ctx.fillStyle = petalGradient

    ctx.beginPath()
    ctx.ellipse(0, -center * 0.5, petalWidth, petalHeight, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Draw center circle
  const centerGradient = ctx.createLinearGradient(center - size * 0.2, center - size * 0.2, center + size * 0.2, center + size * 0.2)
  centerGradient.addColorStop(0, '#4A9A86')
  centerGradient.addColorStop(1, '#5AB39C')
  ctx.fillStyle = centerGradient
  ctx.beginPath()
  ctx.arc(center, center, size * 0.22, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
