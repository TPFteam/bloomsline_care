'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

function GateForm() {
  const params = useSearchParams()
  const next = params.get('next') || '/pitch'
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || loading) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        window.location.href = next
        return
      }
      setError(true)
    } catch {
      setError(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ backgroundColor: '#FAF8F5' }}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-10 flex justify-center">
          <div className="scale-[1.7] origin-center">
            <Logo size="lg" showText />
          </div>
        </div>
        <h1 className="text-2xl font-light text-neutral-900 mb-2">Welcome.</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Thank you for being here. We can&apos;t wait to show you what we&apos;ve built.
        </p>

        <form onSubmit={submit}>
          <div className="relative">
            <input
              type="text"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              placeholder="Passphrase"
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className={`w-full rounded-full bg-white pl-6 pr-14 py-4 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none border transition-colors ${
                error ? 'border-rose-300' : 'border-neutral-200 focus:border-neutral-900'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !password.trim()}
              aria-label="Enter"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center transition-all hover:bg-neutral-700 disabled:opacity-25"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-xs text-rose-500 mt-3">That is not quite it. Try again.</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default function GatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }} />}>
      <GateForm />
    </Suspense>
  )
}
