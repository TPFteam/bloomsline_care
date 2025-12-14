'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Assessment type has been merged with Worksheet
// This page redirects to the worksheet creator with scoring enabled
function AssessmentRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  useEffect(() => {
    // Redirect to worksheet creator
    // If editing an existing assessment, pass the edit param
    const url = editId
      ? `/resources/create/worksheet?edit=${editId}`
      : '/resources/create/worksheet'
    router.replace(url)
  }, [router, editId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to worksheet creator...</p>
        <p className="text-sm text-gray-400 mt-2">Assessments are now part of worksheets with optional scoring</p>
      </div>
    </div>
  )
}

import { Suspense } from 'react'

export default function AssessmentRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <AssessmentRedirect />
    </Suspense>
  )
}
