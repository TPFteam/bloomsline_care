'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser-client'

export type FeatureName = 'moments' | 'seeds' | 'rituals' | 'balance' | 'reflection' | 'progress' | 'flow'

interface GuideStatus {
  completed: boolean
  completedAt: string | null
  skipped: boolean
}

interface FeatureGuides {
  [key: string]: GuideStatus | undefined
}

export function useFeatureGuide(featureName: FeatureName) {
  const [showGuide, setShowGuide] = useState(false)
  const [loading, setLoading] = useState(true)
  const [guideStatus, setGuideStatus] = useState<GuideStatus | null>(null)
  const supabase = createClient()

  // Check if guide should be shown
  const checkGuideStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('feature_guides')
        .eq('id', user.id)
        .single()

      const guides: FeatureGuides = userData?.feature_guides || {}
      const status = guides[featureName]

      if (status) {
        setGuideStatus(status)
        // Don't show if already completed or skipped
        setShowGuide(false)
      } else {
        // First time - show the guide
        setGuideStatus(null)
        setShowGuide(true)
      }
    } catch (error) {
      console.error('Error checking guide status:', error)
    } finally {
      setLoading(false)
    }
  }, [featureName, supabase])

  useEffect(() => {
    checkGuideStatus()
  }, [checkGuideStatus])

  // Mark guide as completed
  const completeGuide = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current guides
      const { data: userData } = await supabase
        .from('users')
        .select('feature_guides')
        .eq('id', user.id)
        .single()

      const currentGuides: FeatureGuides = userData?.feature_guides || {}

      // Update with new guide status
      const updatedGuides = {
        ...currentGuides,
        [featureName]: {
          completed: true,
          completedAt: new Date().toISOString(),
          skipped: false
        }
      }

      await supabase
        .from('users')
        .update({ feature_guides: updatedGuides })
        .eq('id', user.id)

      setGuideStatus(updatedGuides[featureName]!)
      setShowGuide(false)
    } catch (error) {
      console.error('Error completing guide:', error)
    }
  }, [featureName, supabase])

  // Mark guide as skipped
  const skipGuide = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current guides
      const { data: userData } = await supabase
        .from('users')
        .select('feature_guides')
        .eq('id', user.id)
        .single()

      const currentGuides: FeatureGuides = userData?.feature_guides || {}

      // Update with skipped status
      const updatedGuides = {
        ...currentGuides,
        [featureName]: {
          completed: false,
          completedAt: null,
          skipped: true
        }
      }

      await supabase
        .from('users')
        .update({ feature_guides: updatedGuides })
        .eq('id', user.id)

      setGuideStatus(updatedGuides[featureName]!)
      setShowGuide(false)
    } catch (error) {
      console.error('Error skipping guide:', error)
    }
  }, [featureName, supabase])

  // Reset guide (show again)
  const resetGuide = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current guides
      const { data: userData } = await supabase
        .from('users')
        .select('feature_guides')
        .eq('id', user.id)
        .single()

      const currentGuides: FeatureGuides = userData?.feature_guides || {}

      // Remove this guide from the list
      const { [featureName]: _, ...remainingGuides } = currentGuides

      await supabase
        .from('users')
        .update({ feature_guides: remainingGuides })
        .eq('id', user.id)

      setGuideStatus(null)
      setShowGuide(true)
    } catch (error) {
      console.error('Error resetting guide:', error)
    }
  }, [featureName, supabase])

  return {
    showGuide,
    loading,
    guideStatus,
    completeGuide,
    skipGuide,
    resetGuide,
    setShowGuide
  }
}
