import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF9F7',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: 'linear-gradient(90deg, #0D9488, #14B8A6, #5EEAD4)',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#1F2937' }}>blooms</span>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#0D9488' }}>line</span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: 28, color: '#6B7280', fontWeight: 400, margin: 0, marginBottom: 48 }}>
          The platform for care between sessions.
        </p>

        {/* Three pillars */}
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24 }}>📅</span>
            </div>
            <span style={{ fontSize: 16, color: '#374151', fontWeight: 600 }}>Sessions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24 }}>📋</span>
            </div>
            <span style={{ fontSize: 16, color: '#374151', fontWeight: 600 }}>Resources</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24 }}>💚</span>
            </div>
            <span style={{ fontSize: 16, color: '#374151', fontWeight: 600 }}>Connection</span>
          </div>
        </div>

        {/* URL */}
        <p style={{ position: 'absolute', bottom: 32, fontSize: 16, color: '#9CA3AF' }}>
          bloomsline.com
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
