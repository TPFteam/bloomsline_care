// Simple analytics utilities for story views

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop'
  browser: string
}

export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent

  // Detect device type
  let deviceType: DeviceInfo['deviceType'] = 'desktop'
  if (/Mobi|Android/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'tablet'
  }

  // Detect browser
  let browser = 'Unknown'
  if (ua.includes('Firefox')) {
    browser = 'Firefox'
  } else if (ua.includes('Edg')) {
    browser = 'Edge'
  } else if (ua.includes('Chrome')) {
    browser = 'Chrome'
  } else if (ua.includes('Safari')) {
    browser = 'Safari'
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera'
  }

  return { deviceType, browser }
}

export interface StoryView {
  id: string
  story_id: string
  viewed_at: string
  device_type: string | null
  browser: string | null
  referrer: string | null
}
