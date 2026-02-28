export const ADMIN_USER_IDS = [
  '3548c40c-22d6-43e9-8835-0ef9db6abe76',
]

export function isAdmin(userId: string): boolean {
  return ADMIN_USER_IDS.includes(userId)
}
