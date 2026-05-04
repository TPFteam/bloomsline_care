'use client'

import { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Check, X, Loader2, ExternalLink, Shield, UserCog, AlertTriangle, FileText, Lock, ShieldCheck, Mail } from 'lucide-react'
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

  // Email change state
  const [currentEmail, setCurrentEmail] = useState<string>('')
  const [authProvider, setAuthProvider] = useState<string>('email')
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [updatingEmail, setUpdatingEmail] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Success/error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load current user info on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setCurrentEmail(user.email || '')
      setAuthProvider((user.app_metadata?.provider as string) || 'email')
      // new_email exists when a change is pending confirmation
      const pending = (user as { new_email?: string }).new_email
      if (pending) setPendingEmail(pending)
    })
  }, [])

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !emailPassword) return
    setMessage(null)
    setUpdatingEmail(true)
    try {
      const supabase = createClient()
      // Re-authenticate first
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: emailPassword,
      })
      if (reAuthError) {
        setMessage({ type: 'error', text: locale === 'fr' ? 'Mot de passe incorrect' : 'Incorrect password' })
        return
      }
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) {
        setMessage({ type: 'error', text: error.message })
        return
      }
      setPendingEmail(newEmail.trim())
      setNewEmail('')
      setEmailPassword('')
      setMessage({
        type: 'success',
        text: locale === 'fr'
          ? `Un lien de confirmation a été envoyé à ${newEmail.trim()}. La modification sera appliquée après confirmation.`
          : `A confirmation link has been sent to ${newEmail.trim()}. The change will apply after you confirm.`,
      })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update email' })
    } finally {
      setUpdatingEmail(false)
    }
  }

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
                <div className="space-y-6">
                  {/* Email change card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-teal-600" />
                        {locale === 'fr' ? 'Adresse e-mail' : 'Email Address'}
                      </CardTitle>
                      <CardDescription>
                        {locale === 'fr'
                          ? 'Mettez à jour l\'adresse e-mail associée à votre compte'
                          : 'Update the email address associated with your account'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {locale === 'fr' ? 'E-mail actuel' : 'Current email'}
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                          {currentEmail || '—'}
                        </div>
                        {pendingEmail && (
                          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {locale === 'fr'
                              ? `Modification en attente : ${pendingEmail}. Cliquez sur le lien envoyé à cette adresse pour confirmer.`
                              : `Pending change: ${pendingEmail}. Click the link sent to that address to confirm.`}
                          </p>
                        )}
                      </div>

                      {authProvider !== 'email' ? (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 space-y-2">
                          <p className="font-medium">
                            {locale === 'fr'
                              ? `Votre compte utilise la connexion ${authProvider === 'google' ? 'Google' : authProvider === 'azure' ? 'Microsoft' : authProvider}.`
                              : `Your account uses ${authProvider === 'google' ? 'Google' : authProvider === 'azure' ? 'Microsoft' : authProvider} sign-in.`}
                          </p>
                          <p className="leading-relaxed">
                            {locale === 'fr' ? (
                              <>
                                Votre adresse e-mail est gérée par votre fournisseur d&apos;identité et ne peut pas être modifiée ici. Pour utiliser une autre adresse avec Bloomsline, écrivez-nous à <a href="mailto:hi@bloomsline.com" className="font-medium underline">hi@bloomsline.com</a> en précisant l&apos;ancienne et la nouvelle adresse — nous effectuerons le changement manuellement.
                              </>
                            ) : (
                              <>
                                Your email is managed by your identity provider and can&apos;t be changed here. To use a different email with Bloomsline, email us at <a href="mailto:hi@bloomsline.com" className="font-medium underline">hi@bloomsline.com</a> with your old and new addresses — we&apos;ll switch it manually.
                              </>
                            )}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {locale === 'fr' ? 'Nouvelle adresse e-mail' : 'New email address'}
                            </label>
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              disabled={updatingEmail}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {locale === 'fr' ? 'Confirmez votre mot de passe' : 'Confirm your password'}
                            </label>
                            <input
                              type="password"
                              value={emailPassword}
                              onChange={(e) => setEmailPassword(e.target.value)}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              disabled={updatingEmail}
                            />
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {locale === 'fr'
                              ? 'Un lien de confirmation sera envoyé à votre nouvelle adresse. Le changement ne sera appliqué qu\'après que vous aurez cliqué sur ce lien. Vous restez connecté(e) entre-temps.'
                              : 'A confirmation link will be sent to your new address. The change applies only after you click the link. You\'ll stay signed in in the meantime.'}
                          </p>
                          <Button
                            onClick={handleUpdateEmail}
                            disabled={updatingEmail || !newEmail.trim() || !emailPassword || newEmail.trim() === currentEmail}
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            {updatingEmail && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {locale === 'fr' ? 'Mettre à jour l\'e-mail' : 'Update Email'}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Danger Zone */}
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
                        <h3 className="font-medium text-gray-900">
                          {locale === 'fr' ? 'Fermer le compte' : 'Close Account'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {locale === 'fr'
                            ? "La fermeture de votre compte vous déconnecte immédiatement et empêche toute future connexion."
                            : 'Closing your account signs you out immediately and prevents any future login.'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {locale === 'fr'
                            ? "En tant que plateforme clinique, Bloomsline conserve les dossiers de vos patients (notes de séance, suivis) conformément aux obligations de conservation des données de santé en France (généralement 10 à 20 ans). Votre compte est donc désactivé plutôt que définitivement supprimé."
                            : 'As a clinical platform, Bloomsline retains your patients\' records (session notes, treatment history) in accordance with French health data retention requirements (typically 10–20 years). Your account is therefore deactivated rather than fully erased.'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {locale === 'fr' ? (
                            <>Pour demander la suppression complète de vos données personnelles (droit à l&apos;effacement, RGPD art. 17), contactez <a href="mailto:hi@bloomsline.com" className="text-teal-600 underline">hi@bloomsline.com</a>.</>
                          ) : (
                            <>To request full deletion of your personal data (Right to Erasure, GDPR Art. 17), contact <a href="mailto:hi@bloomsline.com" className="text-teal-600 underline">hi@bloomsline.com</a>.</>
                          )}
                        </p>
                      </div>
                      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                        setDeleteDialogOpen(open)
                        if (!open) setDeleteConfirmation('')
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                            {locale === 'fr' ? 'Fermer le compte' : 'Close Account'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {locale === 'fr' ? 'Fermer votre compte ?' : 'Close your account?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                  {locale === 'fr'
                                    ? "Vous serez déconnecté(e) immédiatement et ne pourrez plus vous reconnecter. Pour rouvrir votre compte, contactez le support."
                                    : 'You will be signed out immediately and unable to log back in. To reopen your account, contact support.'}
                                </p>
                                <p>
                                  {locale === 'fr'
                                    ? "Les dossiers cliniques de vos patients seront conservés selon les obligations légales de conservation des données de santé."
                                    : 'Your patients\' clinical records will be retained as required by health data retention laws.'}
                                </p>
                                <p>
                                  {locale === 'fr' ? (
                                    <>Pour la suppression définitive de vos données personnelles (RGPD), écrivez à <a href="mailto:hi@bloomsline.com" className="text-teal-600 underline">hi@bloomsline.com</a>.</>
                                  ) : (
                                    <>For permanent deletion of your personal data (GDPR), email <a href="mailto:hi@bloomsline.com" className="text-teal-600 underline">hi@bloomsline.com</a>.</>
                                  )}
                                </p>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {locale === 'fr' ? (
                                <>Tapez <span className="font-bold">FERMER</span> pour confirmer</>
                              ) : (
                                <>Type <span className="font-bold">CLOSE</span> to confirm</>
                              )}
                            </label>
                            <input
                              type="text"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder={locale === 'fr' ? 'FERMER' : 'CLOSE'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {locale === 'fr' ? 'Annuler' : 'Cancel'}
                            </AlertDialogCancel>
                            <Button
                              variant="outline"
                              className="border-red-300 bg-red-600 text-white hover:bg-red-700"
                              disabled={(deleteConfirmation !== 'CLOSE' && deleteConfirmation !== 'FERMER') || isDeactivating}
                              onClick={handleDeactivateAccount}
                            >
                              {isDeactivating ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : null}
                              {locale === 'fr' ? 'Fermer le compte' : 'Close Account'}
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
                </div>
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
