'use client'

import { useState, useMemo } from 'react'
import { getCountries, getCountryCallingCode, parsePhoneNumber, CountryCode } from 'libphonenumber-js'

// Flag emoji from country code
function getFlag(cc: string): string {
  return cc.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
}

// Priority countries (shown at top of dropdown)
const PRIORITY = ['FR', 'BE', 'CH', 'CA', 'LU', 'MA', 'TN', 'DZ', 'SN', 'CI', 'CM', 'US', 'GB', 'DE', 'ES', 'IT']

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string) => void
  placeholder?: string
  className?: string
  defaultCountry?: string
}

export function PhoneInput({ value, onChange, placeholder, className = '', defaultCountry = 'FR' }: PhoneInputProps) {
  // Parse existing value to detect country
  const parsed = useMemo(() => {
    if (!value) return null
    try {
      const p = parsePhoneNumber(value.startsWith('+') ? value : `+${value}`)
      return p?.isValid() ? p : null
    } catch { return null }
  }, [value])

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => {
    if (parsed?.country) return parsed.country
    return (defaultCountry as CountryCode) || 'FR'
  })

  const allCountries = useMemo(() => {
    const countries = getCountries().map(cc => ({
      code: cc,
      dialCode: `+${getCountryCallingCode(cc)}`,
      flag: getFlag(cc),
    }))
    // Sort: priority countries first, then alphabetical
    const prioritySet = new Set(PRIORITY)
    const priority = PRIORITY.map(cc => countries.find(c => c.code === cc)!).filter(Boolean)
    const rest = countries.filter(c => !prioritySet.has(c.code)).sort((a, b) => a.code.localeCompare(b.code))
    return [...priority, ...rest]
  }, [])

  const currentDialCode = `+${getCountryCallingCode(selectedCountry)}`

  // Extract the local part (without country code) for display
  const localNumber = useMemo(() => {
    if (!value) return ''
    if (parsed?.nationalNumber) return parsed.nationalNumber
    // If value starts with the dial code, strip it
    if (value.startsWith(currentDialCode)) return value.slice(currentDialCode.length).trim()
    // If value starts with +, try to strip any dial code
    if (value.startsWith('+')) {
      for (const c of allCountries) {
        if (value.startsWith(c.dialCode)) return value.slice(c.dialCode.length).trim()
      }
    }
    return value
  }, [value, parsed, currentDialCode])

  const handleNumberChange = (num: string) => {
    // Remove non-digit chars except spaces
    const cleaned = num.replace(/[^\d\s]/g, '')
    if (cleaned) {
      onChange(`${currentDialCode}${cleaned.replace(/\s/g, '')}`)
    } else {
      onChange('')
    }
  }

  const handleCountryChange = (cc: CountryCode) => {
    setSelectedCountry(cc)
    const newDialCode = `+${getCountryCallingCode(cc)}`
    if (localNumber) {
      onChange(`${newDialCode}${localNumber.replace(/\s/g, '')}`)
    }
  }

  return (
    <div className={`flex ${className}`}>
      <select
        value={selectedCountry}
        onChange={e => handleCountryChange(e.target.value as CountryCode)}
        className="px-2 py-2 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 w-[90px] shrink-0"
      >
        {allCountries.map((c, i) => (
          <option key={`${c.code}-${i}`} value={c.code}>
            {c.flag} {c.dialCode}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={localNumber}
        onChange={e => handleNumberChange(e.target.value)}
        placeholder={placeholder || '6 12 34 56 78'}
        className="flex-1 px-3 py-2 rounded-r-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
      />
    </div>
  )
}
