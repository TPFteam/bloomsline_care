'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const maskedLocal = local.length <= 2 ? '*'.repeat(local.length) : local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
  const dotIdx = domain.lastIndexOf('.')
  if (dotIdx <= 0) return `${maskedLocal}@${'*'.repeat(domain.length)}`
  const maskedDomain = '*'.repeat(dotIdx) + domain.slice(dotIdx)
  return `${maskedLocal}@${maskedDomain}`
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length <= 4) return '*'.repeat(digits.length)
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
}

interface MaskedContactProps {
  value: string
  type: 'email' | 'phone'
  className?: string
}

export function MaskedContact({ value, type, className }: MaskedContactProps) {
  const [visible, setVisible] = useState(false)
  const masked = type === 'email' ? maskEmail(value) : maskPhone(value)

  return (
    <span className={`inline-flex items-center gap-1 ${className || ''}`}>
      <span>{visible ? value : masked}</span>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVisible(!visible) }}
        className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        title={visible ? 'Hide' : 'Show'}
      >
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  )
}
