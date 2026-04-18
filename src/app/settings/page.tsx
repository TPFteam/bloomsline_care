'use client'

import { useState, Suspense } from 'react'
import { ArrowLeft, Check, X, Loader2, ExternalLink, Shield, UserCog, AlertTriangle, FileText, Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

type SettingsTab = 'legal' | 'account'

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'legal', label: 'Legal', icon: Shield },
  { id: 'account', label: 'Account', icon: UserCog },
]

function SettingsContent() {
  const { t, locale } = useLanguage()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<SettingsTab>('legal')

  // Account deletion state
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Success/error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    setIsDeactivating(true)
    try {
      const response = await fetch('/api/account/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to deactivate account')
      }

      // Sign out and redirect
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success(locale === 'fr' ? 'Votre compte a été désactivé.' : 'Your account has been deactivated.')
      router.push('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (locale === 'fr' ? 'Impossible de désactiver le compte' : 'Failed to deactivate account'))
    } finally {
      setIsDeactivating(false)
      setDeleteDialogOpen(false)
      setDeleteConfirmation('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.dashboard.backToDashboard}
          </Button>
        </Link>

        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-gray-600">Manage your preferences and account</p>
          </div>

          {/* Message Toast */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar - Desktop */}
            <nav className="hidden md:block w-56 shrink-0">
              <div className="sticky top-12 space-y-1">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-teal-100 text-teal-800'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </nav>

            {/* Tab bar - Mobile */}
            <div className="md:hidden overflow-x-auto -mx-4 px-4">
              <div className="flex gap-1 min-w-max pb-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-teal-100 text-teal-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Legal Tab */}
              {activeTab === 'legal' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Legal & Compliance
                    </CardTitle>
                    <CardDescription>
                      Review our legal documents and policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">Terms of Service</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">Privacy Policy</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                      <a
                        href="/data-protection"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">Data Protection</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                      <a
                        href="/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">Security</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                    <CardDescription>
                      Irreversible actions that affect your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Delete Account</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Your account will be deactivated and you will no longer be able to log in.
                          Your data will be preserved. To reactivate your account, please contact support.
                        </p>
                      </div>
                      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                        setDeleteDialogOpen(open)
                        if (!open) setDeleteConfirmation('')
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your account will be deactivated and you will be signed out immediately.
                              Your data will be preserved, but you will not be able to log in until support reactivates your account.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Type <span className="font-bold">DELETE</span> to confirm
                            </label>
                            <input
                              type="text"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder="DELETE"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <Button
                              variant="outline"
                              className="border-red-300 bg-red-600 text-white hover:bg-red-700"
                              disabled={deleteConfirmation !== 'DELETE' || isDeactivating}
                              onClick={handleDeactivateAccount}
                            >
                              {isDeactivating ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              Delete Account
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>}>
      <SettingsContent />
    </Suspense>
  )
}
