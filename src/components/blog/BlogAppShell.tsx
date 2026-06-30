'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar, AppHeader } from '@/components/layout'
import { createClient } from '@/lib/supabase/browser-client'
import { isAdmin } from '@/lib/admin'
import type { User } from '@/types/user'

// App chrome (left rail + header) around the blog editor pages, with the
// current user loaded for the header menu.
export function BlogAppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/sign-in'); return }
      setAdmin(isAdmin(authUser.id))
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle()
      setUser((profile as User) ?? ({ id: authUser.id, email: authUser.email } as User))
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeItem="blogs" />
      <main className="flex-1 ml-14">
        <AppHeader user={user} isAdmin={admin} />
        {children}
      </main>
    </div>
  )
}
