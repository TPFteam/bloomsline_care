export interface MemberGroup {
  id: string
  practitioner_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
  member_count?: number
  member_ids?: string[]
}
