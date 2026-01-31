'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { UserType, USER_TYPE_LABELS } from '@/types/user'
import { useLanguage } from '@/lib/i18n/context'
import { Heart, Users } from 'lucide-react'
import { ConsentModal } from '@/components/consent-modal'

export default function OnboardingPage() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState<string>('there')
  const [hasConsented, setHasConsented] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-up')
        return
      }

      // Check if user already has a profile — redirect based on user_type
      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type) {
        if (profile.user_type === 'member') {
          router.push('/home')
        } else {
          router.push('/dashboard')
        }
        return
      }

      const name = user.user_metadata?.full_name?.split(' ')[0] || 'there'
      setUserName(name)
    }
    getUser()
  }, [router, supabase.auth])

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error('Please select a user type')
      return
    }

    setIsLoading(true)

    try {
      // Create user profile with selected type
      const response = await fetch('/api/user/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_type: selectedType, has_consented: hasConsented }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create profile')
      }

      // Success! Redirect based on user type
      toast.success('Welcome to Bloomsline! 🎉')
      if (selectedType === 'member') {
        router.push('/home')
      } else {
        router.push('/dashboard?welcome=true')
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create profile')
      setIsLoading(false)
    }
  }

  const userTypes = [
    {
      type: 'mentor' as UserType,
      icon: Heart,
      title: locale === 'fr' ? 'Praticien' : 'Practitioner',
      description: locale === 'fr' ? 'Je fournis des services thérapeutiques et accompagne des clients' : 'I provide therapeutic services and support clients',
      gradient: 'from-mint-400 to-mint-600',
      bg: 'bg-mint-50',
      border: 'border-mint-200',
      hover: 'hover:border-mint-400',
      selected: 'border-mint-500 bg-mint-50',
    },
    {
      type: 'member' as UserType,
      icon: Users,
      title: locale === 'fr' ? 'Membre' : 'Member',
      description: locale === 'fr' ? 'Je recherche un accompagnement thérapeutique et des ressources' : 'I seek therapeutic support and resources',
      gradient: 'from-lavender-400 to-lavender-600',
      bg: 'bg-lavender-50',
      border: 'border-lavender-200',
      hover: 'hover:border-lavender-400',
      selected: 'border-lavender-500 bg-lavender-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-100 via-white to-teal-50 relative overflow-hidden">
      <ConsentModal isOpen={!hasConsented} onAccept={() => setHasConsented(true)} locale={locale} />
      {/* Cinematic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-lavender-100/30 via-peach-50/20 to-mint-100/30"></div>

      {/* Large organic blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-lavender-200/40 to-lavender-300/40 rounded-full mix-blend-multiply filter blur-[160px] animate-blob"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-peach-200/30 to-coral-200/30 rounded-full mix-blend-multiply filter blur-[140px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-br from-mint-200/30 to-mint-300/30 rounded-full mix-blend-multiply filter blur-[180px] animate-blob animation-delay-4000"></div>

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold text-foreground mb-4"
            >
              Welcome, <span className="italic text-mint-600">{userName}</span>! 👋
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              Let's get to know you better. How will you be using Bloomsline?
            </motion.p>
          </div>

          {/* User Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {userTypes.map((item, index) => {
              const Icon = item.icon
              const isSelected = selectedType === item.type

              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <button
                    onClick={() => setSelectedType(item.type)}
                    disabled={isLoading}
                    className={`w-full p-8 rounded-3xl border-2 transition-all duration-300 text-left
                      ${isSelected ? item.selected : `${item.bg} ${item.border} ${item.hover}`}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'}
                      backdrop-blur-xl shadow-lg hover:shadow-2xl
                    `}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <Button
              onClick={handleSubmit}
              disabled={!selectedType || isLoading}
              className="h-14 px-12 bg-gradient-to-r from-mint-500 to-lavender-500 hover:from-mint-600 hover:to-lavender-600 text-white rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating your profile...' : 'Continue to Dashboard'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
