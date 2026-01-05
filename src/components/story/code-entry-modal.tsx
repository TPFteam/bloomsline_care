'use client'

import { useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface CodeEntryModalProps {
  onSubmit: (code: string) => void
  error?: string
}

export function CodeEntryModal({ onSubmit, error }: CodeEntryModalProps) {
  const [code, setCode] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.trim()) {
      onSubmit(code.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-white to-teal-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 p-8"
      >
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-purple-200 to-purple-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md">
          <Lock className="w-10 h-10 text-purple-700" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">This Story is Private</h2>
          <p className="text-gray-600">
            The author has protected this story with a secret code. Enter the code to view.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="secret-code" className="block text-sm font-medium text-gray-700 mb-2">
              Secret Code
            </label>
            <input
              id="secret-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the secret code"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-0 outline-none transition-colors text-gray-900 placeholder-gray-400 bg-white"
              autoFocus
            />
            {error && (
              <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!code.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3"
          >
            Unlock Story
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Don't have the code?{' '}
            <span className="text-purple-600 font-medium">Ask the author to share it with you</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
