import { createClient } from '@/lib/supabase/browser-client'
import type { Member } from '@/types/member'
import type {
  Resource,
  ResourceAssignment,
  ResourceResponse,
  ResourceBlock,
} from '@/types/resource'

// ============================================
// TYPES
// ============================================

export interface MemberAssignment extends ResourceAssignment {
  resource: Resource
}

export interface MemberSharedResource {
  id: string
  member_id: string
  resource_id: string
  practitioner_id: string
  shared_at: string
  message: string | null
  viewed_at: string | null
  created_at: string
  resource: Resource
}

export interface WorksheetSettings {
  enableScoring?: boolean
  showScoreToMember?: boolean
  scoringRanges?: Array<{
    min: number
    max: number
    label: string | { en: string; fr: string }
    description?: string | { en: string; fr: string }
  }>
  maxScore?: number
  questions?: Array<{
    id: string
    type: string
    question?: string
    scoring?: Record<string, number>
    options?: Array<{ label: string; score?: number } | string>
    yesScore?: number
    noScore?: number
    matrixScaleMax?: number
    matrixItems?: string[]
  }>
}

export interface ScoreResult {
  total: number
  maxScore: number
  percentage: number
  interpretation?: string
  blockScores?: Record<string, number>
}

// ============================================
// MEMBER RECORD
// ============================================

/**
 * Get the member record for the currently authenticated user
 * Returns the first active membership (for backwards compatibility)
 */
export async function getMemberRecord(): Promise<Member | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST116' || error.message?.includes('permission')) {
      return null
    }
    console.error('Error fetching member record:', error)
    return null
  }

  return data as Member | null
}

/**
 * Get all member records for the currently authenticated user
 * Supports multiple practitioners per member
 */
export async function getAllMemberRecords(): Promise<Member[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching member records:', error)
    return []
  }

  return (data || []) as Member[]
}

/**
 * Get pending invitations for the current user (by email)
 */
export interface PendingInvitation {
  id: string
  practitioner_id: string
  practitioner_name: string | null
  practitioner_email: string | null
  practitioner_avatar: string | null
  created_at: string
}

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return []

  // Get pending member records with this email
  console.log('Checking pending invitations for email:', user.email)

  const { data: pendingMembers, error } = await supabase
    .from('members')
    .select('id, practitioner_id, created_at')
    .eq('email', user.email)
    .eq('status', 'pending')

  console.log('Pending members query result:', { pendingMembers, error })

  if (error) {
    console.log('No pending invitations found or permission denied:', error)
    return []
  }

  if (!pendingMembers?.length) {
    console.log('No pending members found')
    return []
  }

  // Get practitioner info for each invitation
  const invitations: PendingInvitation[] = []

  for (const member of pendingMembers) {
    console.log('Fetching practitioner info for:', member.practitioner_id)

    // Get practitioner profile
    const { data: profile, error: profileError } = await supabase
      .from('practitioner_profiles')
      .select('full_name, avatar_url')
      .eq('id', member.practitioner_id)
      .single()

    console.log('Practitioner profile result:', { profile, profileError })

    // Get practitioner email from users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, full_name, avatar_url')
      .eq('id', member.practitioner_id)
      .single()

    console.log('Practitioner user data result:', { userData, userError })

    invitations.push({
      id: member.id,
      practitioner_id: member.practitioner_id,
      practitioner_name: profile?.full_name || userData?.full_name || null,
      practitioner_email: userData?.email || null,
      practitioner_avatar: profile?.avatar_url || userData?.avatar_url || null,
      created_at: member.created_at,
    })
  }

  console.log('Final invitations:', invitations)
  return invitations
}

/**
 * Accept a practitioner invitation
 */
export async function acceptInvitation(memberId: string): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Update the member record - link user and set status to active
  const { data, error } = await supabase
    .from('members')
    .update({
      user_id: user.id,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('status', 'pending')
    .select()

  if (error) {
    console.error('Error accepting invitation:', error?.message)
    throw error
  }

  if (!data || data.length === 0) {
    throw new Error('Invitation not found or already processed')
  }
}

/**
 * Reject a practitioner invitation
 */
export async function rejectInvitation(memberId: string): Promise<void> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Delete the member record
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId)
    .eq('email', user.email) // Security check
    .eq('status', 'pending')

  if (error) {
    console.error('Error rejecting invitation:', error)
    throw error
  }
}

// ============================================
// PRACTITIONER INFO
// ============================================

export interface PractitionerProfile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  headline: string | null
  credentials: string[]
  specialties: string[]
  slug: string | null
}

/**
 * Get the practitioner profile for a member
 */
export async function getMemberPractitioner(practitionerId: string): Promise<PractitionerProfile | null> {
  const supabase = createClient()

  // First try to get from practitioner_profiles table
  const { data: profile, error: profileError } = await supabase
    .from('practitioner_profiles')
    .select('id, full_name, avatar_url, headline, credentials, specialties, slug')
    .eq('id', practitionerId)
    .single()

  if (!profileError && profile) {
    // Get email from users table
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', practitionerId)
      .single()

    return {
      id: profile.id,
      full_name: profile.full_name,
      email: userData?.email || null,
      avatar_url: profile.avatar_url,
      headline: profile.headline,
      credentials: profile.credentials || [],
      specialties: profile.specialties || [],
      slug: profile.slug || null,
    }
  }

  // Fallback to users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url')
    .eq('id', practitionerId)
    .single()

  if (userError || !user) {
    return null
  }

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    avatar_url: user.avatar_url,
    headline: null,
    credentials: [],
    specialties: [],
    slug: null,
  }
}

// ============================================
// ASSIGNMENTS
// ============================================

/**
 * Get all assignments for a member
 */
export async function getMemberAssignments(
  memberId: string,
  filters?: {
    status?: 'pending' | 'in_progress' | 'completed' | 'expired'
  }
): Promise<MemberAssignment[]> {
  const supabase = createClient()

  let query = supabase
    .from('resource_assignments')
    .select(`
      *,
      resource:resources(*)
    `)
    .eq('member_id', memberId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching member assignments:', error)
    throw error
  }

  return data as MemberAssignment[]
}

/**
 * Get a specific assignment by ID (for member)
 */
export async function getMemberAssignmentById(
  assignmentId: string,
  memberId: string
): Promise<MemberAssignment | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_assignments')
    .select(`
      *,
      resource:resources(*)
    `)
    .eq('id', assignmentId)
    .eq('member_id', memberId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching assignment:', error)
    throw error
  }

  return data as MemberAssignment
}

/**
 * Update assignment status (e.g., mark as in_progress)
 */
export async function updateMemberAssignmentStatus(
  assignmentId: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('resource_assignments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', assignmentId)

  if (error) {
    console.error('Error updating assignment status:', error)
    throw error
  }
}

// ============================================
// SHARED RESOURCES
// ============================================

/**
 * Get all resources shared with a member
 */
export async function getMemberSharedResources(
  memberId: string
): Promise<MemberSharedResource[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('member_shared_resources')
    .select(`
      *,
      resource:resources(*)
    `)
    .eq('member_id', memberId)
    .order('shared_at', { ascending: false })

  if (error) {
    console.error('Error fetching shared resources:', error)
    throw error
  }

  return data as MemberSharedResource[]
}

/**
 * Mark a shared resource as viewed
 */
export async function markSharedResourceViewed(shareId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('member_shared_resources')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', shareId)

  if (error) {
    console.error('Error marking shared resource as viewed:', error)
    throw error
  }
}

// ============================================
// RESPONSES
// ============================================

/**
 * Get existing response for an assignment (draft or submitted)
 */
export async function getExistingResponse(
  assignmentId: string,
  memberId: string
): Promise<ResourceResponse | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_responses')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching response:', error)
    throw error
  }

  return data as ResourceResponse
}

/**
 * Create a new draft response
 */
export async function createDraftResponse(
  assignmentId: string,
  resourceId: string,
  memberId: string,
  practitionerId: string,
  responses: Record<string, unknown> = {}
): Promise<ResourceResponse> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_responses')
    .insert({
      assignment_id: assignmentId,
      resource_id: resourceId,
      member_id: memberId,
      practitioner_id: practitionerId,
      responses,
      status: 'draft',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating draft response:', error)
    throw error
  }

  // Update assignment status to in_progress
  await updateMemberAssignmentStatus(assignmentId, 'in_progress')

  return data as ResourceResponse
}

/**
 * Get or create a draft response for an assignment
 */
export async function getOrCreateDraftResponse(
  assignmentId: string,
  resourceId: string,
  memberId: string,
  practitionerId: string
): Promise<ResourceResponse> {
  // Check for existing response
  const existing = await getExistingResponse(assignmentId, memberId)

  if (existing) {
    return existing
  }

  // Create new draft
  return createDraftResponse(assignmentId, resourceId, memberId, practitionerId)
}

/**
 * Update draft response (for auto-save)
 */
export async function updateDraftResponse(
  responseId: string,
  responses: Record<string, unknown>,
  timeSpentSeconds?: number
): Promise<ResourceResponse> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    responses,
    updated_at: new Date().toISOString(),
  }

  if (timeSpentSeconds !== undefined) {
    updateData.time_spent_seconds = timeSpentSeconds
  }

  const { data, error } = await supabase
    .from('resource_responses')
    .update(updateData)
    .eq('id', responseId)
    .eq('status', 'draft') // Can only update drafts
    .select()
    .single()

  if (error) {
    console.error('Error updating draft response:', error)
    throw error
  }

  return data as ResourceResponse
}

/**
 * Submit a response (final submission)
 */
export async function submitResponse(
  responseId: string,
  responses: Record<string, unknown>,
  scores?: ScoreResult,
  timeSpentSeconds?: number,
  resourceSnapshot?: {
    title: unknown
    blocks: unknown
    settings: unknown
    type: string
  }
): Promise<ResourceResponse> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    responses,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (scores) {
    updateData.scores = scores
  }

  if (timeSpentSeconds !== undefined) {
    updateData.time_spent_seconds = timeSpentSeconds
  }

  if (resourceSnapshot) {
    updateData.resource_snapshot = resourceSnapshot
  }

  const { data, error } = await supabase
    .from('resource_responses')
    .update(updateData)
    .eq('id', responseId)
    .select()
    .single()

  if (error) {
    console.error('Error submitting response:', error)
    throw error
  }

  // Also update the assignment status to 'completed' if this response is for an assignment
  if (data && data.assignment_id) {
    const { error: assignmentError } = await supabase
      .from('resource_assignments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.assignment_id)

    if (assignmentError) {
      console.error('Error updating assignment status:', assignmentError)
      // Don't throw - the response was submitted successfully
    }
  }

  return data as ResourceResponse
}

// ============================================
// SCORING
// ============================================

/**
 * Calculate score for a worksheet based on responses
 */
export function calculateWorksheetScore(
  responses: Record<string, unknown>,
  settings: WorksheetSettings,
  blocks: ResourceBlock[]
): ScoreResult | null {
  if (!settings.enableScoring) {
    return null
  }

  let totalScore = 0
  const maxScore = settings.maxScore || 0

  // Score from questions in settings
  if (settings.questions) {
    for (const question of settings.questions) {
      const response = responses[question.id]
      if (response === undefined) continue

      switch (question.type) {
        case 'multiple_choice':
          if (question.scoring && typeof response === 'number') {
            totalScore += question.scoring[response.toString()] || 0
          } else if (question.options && typeof response === 'number') {
            const option = question.options[response]
            if (typeof option === 'object' && 'score' in option) {
              totalScore += option.score || 0
            }
          }
          break

        case 'likert':
        case 'scale':
        case 'numeric':
        case 'slider':
          if (typeof response === 'number') {
            totalScore += response
          }
          break

        case 'yes_no':
          if (response === 'yes') {
            totalScore += question.yesScore ?? question.scoring?.yes ?? 1
          } else if (response === 'no') {
            totalScore += question.noScore ?? question.scoring?.no ?? 0
          }
          break

        case 'mood':
          if (typeof response === 'number') {
            totalScore += response
          }
          break

        case 'matrix_rating':
          if (typeof response === 'object' && response !== null) {
            const ratings = response as Record<string, number>
            for (const value of Object.values(ratings)) {
              totalScore += value || 0
            }
          }
          break
      }
    }
  }

  // Also check blocks directly for scoring
  for (const block of blocks) {
    const response = responses[block.id]
    if (response === undefined) continue

    // Skip if already counted in questions
    if (settings.questions?.some(q => q.id === block.id)) continue

    if (block.type === 'likert' || block.type === 'scale' || block.type === 'slider') {
      if (typeof response === 'number') {
        totalScore += response
      }
    } else if (block.type === 'matrix_rating' && 'matrixItems' in block) {
      if (typeof response === 'object' && response !== null) {
        const ratings = response as Record<string, number>
        for (const value of Object.values(ratings)) {
          totalScore += value || 0
        }
      }
    }
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

  // Find interpretation
  let interpretation: string | undefined
  if (settings.scoringRanges) {
    for (const range of settings.scoringRanges) {
      if (totalScore >= range.min && totalScore <= range.max) {
        interpretation = typeof range.label === 'object'
          ? range.label.en
          : range.label
        break
      }
    }
  }

  return {
    total: totalScore,
    maxScore,
    percentage,
    interpretation,
  }
}

/**
 * Calculate max possible score for a worksheet
 */
export function calculateMaxScore(
  settings: WorksheetSettings,
  blocks: ResourceBlock[]
): number {
  let maxScore = 0

  if (settings.questions) {
    for (const question of settings.questions) {
      switch (question.type) {
        case 'multiple_choice':
          if (question.scoring) {
            maxScore += Math.max(...Object.values(question.scoring).map(Number))
          } else if (question.options) {
            const scores = question.options.map(opt =>
              typeof opt === 'object' && 'score' in opt ? (opt.score || 0) : 0
            )
            maxScore += Math.max(...scores, 0)
          }
          break

        case 'likert':
        case 'scale':
          // Assume 1-5 scale by default
          maxScore += 5
          break

        case 'yes_no':
          maxScore += Math.max(
            question.yesScore ?? question.scoring?.yes ?? 1,
            question.noScore ?? question.scoring?.no ?? 0
          )
          break

        case 'matrix_rating':
          const itemCount = question.matrixItems?.length || 0
          const maxPerItem = question.matrixScaleMax || 5
          maxScore += itemCount * maxPerItem
          break

        case 'slider':
        case 'numeric':
          // Variable, use explicit max if available
          break
      }
    }
  }

  return settings.maxScore || maxScore
}

// ============================================
// COMBINED DATA
// ============================================

export interface MemberResourceItem {
  type: 'assignment' | 'shared'
  id: string
  resource: Resource
  status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'viewed' | 'unviewed'
  practitionerId: string
  practitionerName?: string
  dueDate?: string
  priority?: 'low' | 'normal' | 'high'
  instructions?: string
  message?: string
  assignmentId?: string
  sharedAt?: string
  response?: ResourceResponse
}

/**
 * Get all resources for a member (assignments + shared)
 */
export async function getAllMemberResources(
  memberId: string,
  practitionerId: string
): Promise<MemberResourceItem[]> {
  const supabase = createClient()

  const [assignments, shared] = await Promise.all([
    getMemberAssignments(memberId),
    getMemberSharedResources(memberId),
  ])

  // Get all unique practitioner IDs to fetch their names
  const practitionerIds = new Set<string>()
  practitionerIds.add(practitionerId)
  shared.forEach(s => practitionerIds.add(s.practitioner_id))

  // Fetch practitioner names
  const { data: practitioners } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', Array.from(practitionerIds))

  const practitionerNames: Record<string, string> = {}
  practitioners?.forEach(p => {
    practitionerNames[p.id] = p.full_name || 'Unknown'
  })

  const items: MemberResourceItem[] = []

  // Add assignments
  for (const assignment of assignments) {
    // Get existing response
    const response = await getExistingResponse(assignment.id, memberId)

    // Determine status: if response is submitted, consider it completed regardless of assignment status
    let effectiveStatus = assignment.status as MemberResourceItem['status']
    if (response && response.status === 'submitted') {
      effectiveStatus = 'completed'
    } else if (response && response.status === 'draft') {
      effectiveStatus = 'in_progress'
    }

    items.push({
      type: 'assignment',
      id: assignment.id,
      resource: assignment.resource,
      status: effectiveStatus,
      practitionerId,
      practitionerName: practitionerNames[practitionerId],
      dueDate: assignment.due_date || undefined,
      priority: assignment.priority as 'low' | 'normal' | 'high',
      instructions: assignment.instructions || undefined,
      assignmentId: assignment.id,
      response: response || undefined,
    })
  }

  // Add shared resources (only those not already assigned)
  const assignedResourceIds = new Set(assignments.map(a => a.resource_id))
  for (const share of shared) {
    if (assignedResourceIds.has(share.resource_id)) continue

    // Check if there's a submitted response for this shared resource
    const { data: sharedResponse } = await supabase
      .from('resource_responses')
      .select('id, status')
      .eq('resource_id', share.resource_id)
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Determine status: if response submitted = completed, otherwise check viewed_at
    let sharedStatus: 'completed' | 'viewed' | 'unviewed' = 'unviewed'
    if (sharedResponse?.status === 'submitted') {
      sharedStatus = 'completed'
    } else if (share.viewed_at) {
      sharedStatus = 'viewed'
    }

    items.push({
      type: 'shared',
      id: share.id,
      resource: share.resource,
      status: sharedStatus,
      practitionerId: share.practitioner_id,
      practitionerName: practitionerNames[share.practitioner_id],
      message: share.message || undefined,
      sharedAt: share.shared_at,
    })
  }

  // Sort: pending/in_progress first, then by due date, then by shared date
  items.sort((a, b) => {
    // Assignments with due dates first
    if (a.type === 'assignment' && b.type === 'assignment') {
      if (a.status !== b.status) {
        const statusOrder = { in_progress: 0, pending: 1, completed: 2, expired: 3 }
        return (statusOrder[a.status as keyof typeof statusOrder] ?? 4) -
               (statusOrder[b.status as keyof typeof statusOrder] ?? 4)
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
    }
    if (a.type === 'assignment') return -1
    if (b.type === 'assignment') return 1
    return 0
  })

  return items
}
