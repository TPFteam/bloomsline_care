'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { getCountries, getCountryCallingCode, parsePhoneNumber, CountryCode } from 'libphonenumber-js'
import { ChevronDown, Search } from 'lucide-react'

// Country names for search
const COUNTRY_NAMES: Record<string, string> = {
  AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AD:'Andorra',AO:'Angola',AR:'Argentina',AM:'Armenia',AU:'Australia',AT:'Austria',AZ:'Azerbaijan',
  BH:'Bahrain',BD:'Bangladesh',BY:'Belarus',BE:'Belgium',BJ:'Benin',BT:'Bhutan',BO:'Bolivia',BA:'Bosnia',BW:'Botswana',BR:'Brazil',
  BN:'Brunei',BG:'Bulgaria',BF:'Burkina Faso',BI:'Burundi',KH:'Cambodia',CM:'Cameroon',CA:'Canada',CF:'Central African Republic',TD:'Chad',
  CL:'Chile',CN:'China',CO:'Colombia',KM:'Comoros',CG:'Congo',CD:'DR Congo',CR:'Costa Rica',CI:'Ivory Coast',HR:'Croatia',CU:'Cuba',
  CY:'Cyprus',CZ:'Czech Republic',DK:'Denmark',DJ:'Djibouti',DO:'Dominican Republic',EC:'Ecuador',EG:'Egypt',SV:'El Salvador',GQ:'Equatorial Guinea',
  ER:'Eritrea',EE:'Estonia',ET:'Ethiopia',FI:'Finland',FR:'France',GA:'Gabon',GM:'Gambia',GE:'Georgia',DE:'Germany',GH:'Ghana',
  GR:'Greece',GT:'Guatemala',GN:'Guinea',GW:'Guinea-Bissau',HT:'Haiti',HN:'Honduras',HK:'Hong Kong',HU:'Hungary',IS:'Iceland',IN:'India',
  ID:'Indonesia',IR:'Iran',IQ:'Iraq',IE:'Ireland',IL:'Israel',IT:'Italy',JM:'Jamaica',JP:'Japan',JO:'Jordan',KZ:'Kazakhstan',
  KE:'Kenya',KW:'Kuwait',KG:'Kyrgyzstan',LA:'Laos',LV:'Latvia',LB:'Lebanon',LS:'Lesotho',LR:'Liberia',LY:'Libya',LI:'Liechtenstein',
  LT:'Lithuania',LU:'Luxembourg',MG:'Madagascar',MW:'Malawi',MY:'Malaysia',MV:'Maldives',ML:'Mali',MT:'Malta',MR:'Mauritania',MU:'Mauritius',
  MX:'Mexico',MD:'Moldova',MC:'Monaco',MN:'Mongolia',ME:'Montenegro',MA:'Morocco',MZ:'Mozambique',MM:'Myanmar',NA:'Namibia',NP:'Nepal',
  NL:'Netherlands',NZ:'New Zealand',NI:'Nicaragua',NE:'Niger',NG:'Nigeria',NO:'Norway',OM:'Oman',PK:'Pakistan',PA:'Panama',PY:'Paraguay',
  PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',QA:'Qatar',RO:'Romania',RU:'Russia',RW:'Rwanda',SA:'Saudi Arabia',SN:'Senegal',
  RS:'Serbia',SL:'Sierra Leone',SG:'Singapore',SK:'Slovakia',SI:'Slovenia',SO:'Somalia',ZA:'South Africa',KR:'South Korea',ES:'Spain',
  LK:'Sri Lanka',SD:'Sudan',SE:'Sweden',CH:'Switzerland',SY:'Syria',TW:'Taiwan',TJ:'Tajikistan',TZ:'Tanzania',TH:'Thailand',TG:'Togo',
  TN:'Tunisia',TR:'Turkey',TM:'Turkmenistan',UG:'Uganda',UA:'Ukraine',AE:'UAE',GB:'United Kingdom',US:'United States',UY:'Uruguay',
  UZ:'Uzbekistan',VE:'Venezuela',VN:'Vietnam',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe',
}

function getFlag(cc: string): string {
  return cc.toUpperCase().replace(/./g, c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
}

const PRIORITY = ['FR', 'BE', 'CH', 'CA', 'LU', 'MA', 'TN', 'DZ', 'SN', 'CI', 'CM', 'US', 'GB', 'DE', 'ES', 'IT']

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string) => void
  placeholder?: string
  className?: string
  defaultCountry?: string
}

export function PhoneInput({ value, onChange, placeholder, className = '', defaultCountry = 'FR' }: PhoneInputProps) {
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
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchRef.current) searchRef.current.focus()
  }, [isOpen])

  const allCountries = useMemo(() => {
    const countries = getCountries().map(cc => ({
      code: cc,
      dialCode: `+${getCountryCallingCode(cc)}`,
      flag: getFlag(cc),
      name: COUNTRY_NAMES[cc] || cc,
    }))
    const prioritySet = new Set(PRIORITY)
    const priority = PRIORITY.map(cc => countries.find(c => c.code === cc)!).filter(Boolean)
    const rest = countries.filter(c => !prioritySet.has(c.code)).sort((a, b) => a.name.localeCompare(b.name))
    return [...priority, ...rest]
  }, [])

  const filteredCountries = useMemo(() => {
    if (!search) return allCountries
    const q = search.toLowerCase()
    return allCountries.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.dialCode.includes(q)
    )
  }, [allCountries, search])

  const currentDialCode = `+${getCountryCallingCode(selectedCountry)}`

  const localNumber = useMemo(() => {
    if (!value) return ''
    if (parsed?.nationalNumber) return parsed.nationalNumber
    if (value.startsWith(currentDialCode)) return value.slice(currentDialCode.length).trim()
    if (value.startsWith('+')) {
      for (const c of allCountries) {
        if (value.startsWith(c.dialCode)) return value.slice(c.dialCode.length).trim()
      }
    }
    return value
  }, [value, parsed, currentDialCode])

  const handleNumberChange = (num: string) => {
    const cleaned = num.replace(/[^\d\s]/g, '')
    if (cleaned) {
      onChange(`${currentDialCode}${cleaned.replace(/\s/g, '')}`)
    } else {
      onChange('')
    }
  }

  const handleCountrySelect = (cc: CountryCode) => {
    setSelectedCountry(cc)
    setIsOpen(false)
    setSearch('')
    const newDialCode = `+${getCountryCallingCode(cc)}`
    if (localNumber) {
      onChange(`${newDialCode}${localNumber.replace(/\s/g, '')}`)
    }
  }

  const selected = allCountries.find(c => c.code === selectedCountry)

  return (
    <div className={`flex relative ${className}`} ref={dropdownRef}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSearch('') }}
        className="flex items-center gap-1 px-2 py-2 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm hover:bg-gray-100 transition-colors shrink-0"
      >
        <span className="text-base leading-none">{selected?.flag}</span>
        <span className="text-gray-700">{currentDialCode}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.map((c, i) => (
              <button
                key={`${c.code}-${i}`}
                type="button"
                onClick={() => handleCountrySelect(c.code as CountryCode)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  c.code === selectedCountry ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 text-left truncate">{c.name}</span>
                <span className="text-gray-400 text-xs">{c.dialCode}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No results</p>
            )}
          </div>
        </div>
      )}

      {/* Phone input */}
      <input
        type="tel"
        value={localNumber}
        onChange={e => handleNumberChange(e.target.value)}
        placeholder={placeholder || '6 12 34 56 78'}
        className="flex-1 px-3 py-2 rounded-r-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 min-w-0"
      />
    </div>
  )
}
