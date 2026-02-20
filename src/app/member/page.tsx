'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { UserX, Send, Copy, Link2, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/context'
import { MemberSidebar } from '@/components/layout/member-sidebar'

export default function MemberPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [hasPractitioner, setHasPractitioner] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      // Check if member has a practitioner connection
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setHasPractitioner(!!member)
      setLoading(false)
    }
    check()
  }, [supabase, router])

  const handleInvite = async () => {
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/invite-practitioner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Invitation sent!')
        setEmail('')
      } else {
        toast.error(data.error || 'Failed to send invitation')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://bloomsline.care/practitioner')
      setCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MemberSidebar />
      <main className="flex-1 ml-[17.5rem] p-8">
        {hasPractitioner ? (
          /* Connected state — placeholder for future work */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto mt-24"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-7 w-7 text-teal-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connected with your practitioner</h2>
              <p className="text-gray-500 text-sm">Your full experience is on its way. Check back soon for updates.</p>
            </div>
          </motion.div>
        ) : (
          /* No practitioner — invite screen */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto mt-16"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserX className="h-8 w-8 text-gray-400" />
                </div>
              </div>

              {/* Copy */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  No practitioner connected yet
                </h1>
                <p className="text-gray-500">
                  Invite your therapist to explore Bloomsline together
                </p>
              </div>

              {/* Email invite */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Practitioner&apos;s email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="therapist@example.com"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  />
                  <button
                    onClick={handleInvite}
                    disabled={sending || !email.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:shadow-md hover:shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Invite
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span className="text-teal-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy practitioner sign-up link
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
