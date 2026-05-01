// Fallback list — used if admin_users table doesn't exist yet
const FALLBACK_ADMIN_IDS = [
  '3548c40c-22d6-43e9-8835-0ef9db6abe76',
]

export const ADMIN_USER_IDS = FALLBACK_ADMIN_IDS

export function isAdmin(userId: string): boolean {
  return FALLBACK_ADMIN_IDS.includes(userId)
}

/**
 * Server-side admin check — queries admin_users table.
 * Falls back to hardcoded list if table doesn't exist.
 * Use this in API routes instead of the sync isAdmin().
 */
export async function isAdminServer(
  userId: string,
  supabase: { from: (table: string) => any }
): Promise<boolean> {
  // Quick check against fallback first
  if (FALLBACK_ADMIN_IDS.includes(userId)) return true

  try {
    const { data } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    return !!data
  } catch {
    // Table may not exist yet — fall back
    return FALLBACK_ADMIN_IDS.includes(userId)
  }
}
