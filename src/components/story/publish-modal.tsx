'use client'

import { useState } from 'react'
import { X, Lock, Globe, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  onPublish: (secretCode?: string) => void
  saving: boolean
}

export function PublishModal({ isOpen, onClose, onPublish, saving }: PublishModalProps) {
  const [step, setStep] = useState<'choose' | 'enter-code'>('choose')
  const [secretCode, setSecretCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')

  const handlePublicPublish = () => {
    onPublish(undefined)
  }

  const handlePrivatePublish = () => {
    if (secretCode.trim().length < 4) {
      return
    }
    if (secretCode !== confirmCode) {
      return
    }
    onPublish(secretCode.trim())
  }

  const resetAndClose = () => {
    setStep('choose')
    setSecretCode('')
    setConfirmCode('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Publish Your Story</h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 'choose' ? 'Choose how you want to share' : 'Create your secret code'}
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'choose' ? (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Public Option */}
                <button
                  onClick={handlePublicPublish}
                  disabled={saving}
                  className="w-full text-left p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      <Globe className="w-7 h-7 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Share Openly</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Anyone with the link can view your story. Perfect for sharing widely with friends, family, or your community.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors mt-4" />
                  </div>
                </button>

                {/* Private Option */}
                <button
                  onClick={() => setStep('enter-code')}
                  disabled={saving}
                  className="w-full text-left p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-200 to-purple-300 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                      <Lock className="w-7 h-7 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Keep It Private</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Only people with your secret code can view this story. Great for personal reflections or sharing with specific people.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors mt-4" />
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="enter-code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="text-sm text-purple-800">
                      <p className="font-medium mb-1">Create a memorable code</p>
                      <p className="text-purple-700">
                        Choose a code that's easy for you to remember but hard for others to guess. You'll share this code with anyone you want to view your story.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      placeholder="Enter your secret code (min. 4 characters)"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none transition-colors"
                      minLength={4}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      placeholder="Re-enter your secret code"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none transition-colors"
                      minLength={4}
                    />
                    {confirmCode && secretCode !== confirmCode && (
                      <p className="text-sm text-red-500 mt-2">Codes don't match</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setStep('choose')}
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePrivatePublish}
                    disabled={
                      saving ||
                      secretCode.trim().length < 4 ||
                      secretCode !== confirmCode
                    }
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  >
                    {saving ? 'Publishing...' : 'Publish with Code'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
