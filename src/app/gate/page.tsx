'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

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
        <div className="mx-auto mb-6 w-12 h-12 rounded-full bg-teal-600/10 flex items-center justify-center">
          <span className="text-2xl">🌱</span>
        </div>
        <h1 className="text-2xl font-light text-neutral-900 mb-2">A quiet little door.</h1>
        <p className="text-sm text-neutral-500 mb-8">
          You are early. If you have the words, come on in.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            placeholder="Passphrase"
            autoFocus
            className={`w-full text-center px-4 py-3 rounded-xl border bg-white outline-none transition-colors ${
              error ? 'border-rose-300 focus:border-rose-400' : 'border-neutral-200 focus:border-teal-500'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Opening…' : 'Enter'}
          </button>
          {error && (
            <p className="text-xs text-rose-500 pt-1">That is not quite it. Try again.</p>
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
