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

    // Create final canvas with branding
    const padding = 40
    const headerHeight = 60
    const footerHeight = 70
    const totalWidth = img.width + padding * 2
    const totalHeight = img.height + padding * 2 + headerHeight + footerHeight

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

    // Draw header with date
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(date, padding + 45, padding + 38)

    // Draw small leaf icon before date
    drawLeafIcon(ctx, padding, padding + 10, 32)

    // Draw the captured flow
    const flowY = padding + headerHeight

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

    // Draw footer with branding
    const footerY = flowY + img.height + 35

    // Draw Bloomsline logo
    const logoX = totalWidth / 2 - 90
    drawBloomslineLogo(ctx, logoX, footerY - 5, 40)

    // Draw "Bloomsline" text
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Bloomsline', logoX + 50, footerY + 28)

    // Draw tagline
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    const tagline = locale === 'fr' ? 'Mon bien-être' : 'My wellbeing'
    ctx.fillText(tagline, logoX + 175, footerY + 26)

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

  // Draw background rounded rectangle
  const bgGradient = ctx.createLinearGradient(0, 0, size, size)
  bgGradient.addColorStop(0, '#4A9A86')
  bgGradient.addColorStop(1, '#5AB39C')
  ctx.fillStyle = bgGradient
  roundRect(ctx, 0, 0, size, size, size * 0.25)
  ctx.fill()

  // Draw leaf shape
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const s = size / 24
  ctx.beginPath()
  // Leaf path
  ctx.moveTo(12 * s, 19 * s)
  ctx.bezierCurveTo(12 * s, 14 * s, 8 * s, 9 * s, 10 * s, 5 * s)
  ctx.bezierCurveTo(14 * s, 4 * s, 16 * s, 4 * s, 18 * s, 2 * s)
  ctx.bezierCurveTo(19 * s, 4 * s, 20 * s, 7 * s, 20 * s, 10 * s)
  ctx.bezierCurveTo(20 * s, 15 * s, 16 * s, 19 * s, 12 * s, 19 * s)
  ctx.stroke()

  // Stem
  ctx.beginPath()
  ctx.moveTo(5 * s, 21 * s)
  ctx.bezierCurveTo(7 * s, 17 * s, 10 * s, 14 * s, 12 * s, 12 * s)
  ctx.stroke()

  ctx.restore()
}

// Helper function to draw Bloomsline logo
function drawBloomslineLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)

  const center = size / 2
  const petalWidth = size * 0.13
  const petalHeight = size * 0.32

  // Draw 6 petals
  for (let i = 0; i < 6; i++) {
    ctx.save()
    ctx.translate(center, center)
    ctx.rotate((i * 60 * Math.PI) / 180)

    // Petal gradient
    const petalGradient = ctx.createLinearGradient(0, -petalHeight * 1.5, 0, 0)
    petalGradient.addColorStop(0, '#E8A87C')
    petalGradient.addColorStop(1, '#D4856A')
    ctx.fillStyle = petalGradient

    ctx.beginPath()
    ctx.ellipse(0, -center * 0.45, petalWidth, petalHeight, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // Draw center circle
  const centerGradient = ctx.createLinearGradient(center - size * 0.15, center - size * 0.15, center + size * 0.15, center + size * 0.15)
  centerGradient.addColorStop(0, '#4A9A86')
  centerGradient.addColorStop(1, '#5AB39C')
  ctx.fillStyle = centerGradient
  ctx.beginPath()
  ctx.arc(center, center, size * 0.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
