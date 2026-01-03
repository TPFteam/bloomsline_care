'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Redirect old library preview URLs to the new resources preview page
export default function LibraryResourceRedirect() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/resources/${id}`)
    }
  }, [id, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <span className="text-gray-500 text-sm">Redirecting...</span>
      </div>
    </div>
  )
}
