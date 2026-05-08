import { createClient } from '@/lib/supabase/browser-client'
import { notifyResourceSubmitted } from '@/lib/notifications'
import type {
  Resource,
  ResourceType,
  ResourceStatus,
  ResourceAssignment,
  ResourceResponse,
  CreateResourceDTO,
  UpdateResourceDTO,
  CreateAssignmentDTO,
  CreateResponseDTO,
} from '@/types/resource'

// ============================================
// RESOURCES
// ============================================

export async function getResources(filters?: {
  type?: ResourceType
  status?: ResourceStatus
  category?: string
  visibility?: 'private' | 'link_only' | 'public' | 'onboarding'
  publicOnly?: boolean
  myResourcesOnly?: boolean // Only fetch resources created by the current user
}): Promise<Resource[]> {
  const supabase = createClient()

  // If myResourcesOnly, get current user and filter by their ID
  let practitionerId: string | null = null
  if (filters?.myResourcesOnly) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No authenticated user for myResourcesOnly filter')
      return []
    }
    practitionerId = user.id
  }

  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  // Filter by current user's resources
  if (practitionerId) {
    query = query.eq('practitioner_id', practitionerId)
  }

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.visibility) {
    query = query.eq('visibility', filters.visibility)
  }
  // For Digital Library - get all public + onboarding published resources
  if (filters?.publicOnly) {
    query = query.in('visibility', ['public', 'onboarding']).eq('status', 'published')
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching resources:', error)
    throw error
  }

  return data as Resource[]
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching resource:', error)
    throw error
  }

  // Always create a creator profile - try practitioner_profiles first, then users table, then fallback
  let creator_profile = null
  if (data?.practitioner_id) {
    // Try practitioner_profiles table first
    const { data: profileData, error: profileError } = await supabase
      .from('practitioner_profiles')
      .select('id, slug, headline, credentials, specialties, years_experience, is_verified')
      .eq('user_id', data.practitioner_id)
      .single()

    // Also get user data for full_name and avatar
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', data.practitioner_id)
      .single()

    if (profileData && !profileError) {
      creator_profile = {
        id: profileData.id,
        slug: profileData.slug,
        full_name: userData?.full_name || userData?.email?.split('@')[0] || 'Practitioner',
        avatar_url: userData?.avatar_url || null,
        headline: profileData.headline,
        credentials: profileData.credentials || [],
        specialties: (profileData.specialties || []).slice(0, 5),
        years_experience: profileData.years_experience,
        is_verified: profileData.is_verified || false,
      }
    } else if (userData) {
      // No practitioner_profile but have user data
      creator_profile = {
        id: userData.id,
        slug: null,
        full_name: userData.full_name || userData.email?.split('@')[0] || 'Practitioner',
        avatar_url: userData.avatar_url || null,
        headline: null,
        credentials: [],
        specialties: [],
        years_experience: null,
        is_verified: false,
      }
    } else {
      // Final fallback - create minimal profile
      creator_profile = {
        id: data.practitioner_id,
        slug: null,
        full_name: 'Practitioner',
        avatar_url: null,
        headline: null,
        credentials: [],
        specialties: [],
        years_experience: null,
        is_verified: false,
      }
    }
  }

  return { ...data, creator_profile } as Resource
}

export async function createResource(resource: CreateResourceDTO): Promise<Resource> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('resources')
    .insert({
      practitioner_id: user.id,
      type: resource.type,
      title: resource.title,
      description: resource.description,
      category: resource.category,
      tags: resource.tags || [],
      blocks: resource.blocks,
      settings: resource.settings || {},
      status: resource.status || 'draft',
      visibility: resource.visibility || 'private',
      language: resource.language || 'en',
      published_to_library_at: resource.visibility === 'public' && resource.status === 'published'
        ? new Date().toISOString()
        : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating resource:', error)
    throw error
  }

  return data as Resource
}

export async function updateResource(id: string, updates: UpdateResourceDTO): Promise<Resource> {
  const supabase = createClient()

  // Ensure we have a valid session before attempting update
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    // Try to refresh the session
    const { data: { session: refreshed } } = await supabase.auth.refreshSession()
    if (!refreshed) {
      throw new Error('Session expired. Please refresh the page and try again.')
    }
  }

  const { data, error } = await supabase
    .from('resources')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Error updating resource:', error)
    throw error
  }

  if (!data) {
    throw new Error('Resource not found or you do not have permission to update it')
  }

  return data as Resource
}

export async function deleteResource(id: string): Promise<void> {
  const supabase = createClient()

  // FK shape on a `resources` row delete:
  //   member_shared_resources.resource_id  → ON DELETE CASCADE  (wiped)
  //   resource_assignments.resource_id     → ON DELETE CASCADE  (wiped)
  //   resource_responses.resource_id       → ON DELETE SET NULL (preserved
  //     for audit; the snapshot column keeps the rendered version of the
  //     resource at submission time — see migration 20251219)
  //
  // We capture the response IDs first, because once the resource is gone
  // those rows still exist but their `resource_id` is NULL — querying
  // `resource_id = id` afterwards returns nothing. We need the IDs so we
  // can clear notifications whose deep-link URLs would 404.
  const { data: responseRows } = await supabase
    .from('resource_responses')
    .select('id')
    .eq('resource_id', id)
  const responseIds = (responseRows || []).map(r => r.id as string)

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting resource:', error)
    throw error
  }

  // Tidy notifications whose deep links point at the now-missing resource.
  // The notifications table is decoupled from the FK graph (entity_id +
  // entity_type are plain columns) so cascade can't reach it. Best-effort —
  // a failure here is logged but the resource is already gone.
  //
  // We delete two flavours:
  //   - entity_type='resource' : "Patient reviewed your resource", etc.
  //   - entity_type='resource_response' : "New submission" notifications.
  //     Even though the response rows still exist via SET NULL, the deep
  //     link `/resources/{resourceId}?submission={responseId}` would 404
  //     because the resource is gone, so the notification is dead in the UI.
  try {
    await supabase
      .from('notifications')
      .delete()
      .eq('entity_type', 'resource')
      .eq('entity_id', id)

    if (responseIds.length > 0) {
      await supabase
        .from('notifications')
        .delete()
        .eq('entity_type', 'resource_response')
        .in('entity_id', responseIds)
    }
  } catch (err) {
    console.warn('Resource deleted, but notification cleanup failed:', err)
  }
}

export async function publishResource(id: string, visibility: 'private' | 'link_only' | 'public' = 'private'): Promise<Resource> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    status: 'published',
    visibility,
    updated_at: new Date().toISOString(),
  }

  if (visibility === 'public') {
    updateData.published_to_library_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('resources')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error publishing resource:', error)
    throw error
  }

  return data as Resource
}

export async function archiveResource(id: string): Promise<Resource> {
  return updateResource(id, { status: 'archived' })
}

export async function makeResourcePrivate(id: string): Promise<Resource> {
  return updateResource(id, { visibility: 'private' })
}

export async function makeResourcePublic(id: string): Promise<Resource> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resources')
    .update({
      visibility: 'public',
      published_to_library_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error making resource public:', error)
    throw error
  }

  return data as Resource
}

// ============================================
// ASSIGNMENTS
// ============================================

export async function getAssignments(filters?: {
  resource_id?: string
  member_id?: string
  status?: string
}): Promise<ResourceAssignment[]> {
  const supabase = createClient()

  let query = supabase
    .from('resource_assignments')
    .select(`
      *,
      resource:resources(*),
      member:members(id, first_name, last_name, email)
    `)
    .order('assigned_at', { ascending: false })

  if (filters?.resource_id) {
    query = query.eq('resource_id', filters.resource_id)
  }
  if (filters?.member_id) {
    query = query.eq('member_id', filters.member_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching assignments:', error)
    throw error
  }

  return data as ResourceAssignment[]
}

export async function getAssignmentById(id: string): Promise<ResourceAssignment | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_assignments')
    .select(`
      *,
      resource:resources(*),
      member:members(id, first_name, last_name, email)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching assignment:', error)
    throw error
  }

  return data as ResourceAssignment
}

export async function createAssignment(assignment: CreateAssignmentDTO): Promise<ResourceAssignment> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('resource_assignments')
    .insert({
      practitioner_id: user.id,
      resource_id: assignment.resource_id,
      member_id: assignment.member_id,
      due_date: assignment.due_date,
      instructions: assignment.instructions,
      priority: assignment.priority || 'normal',
    })
    .select(`
      *,
      resource:resources(*),
      member:members(id, first_name, last_name, email)
    `)
    .single()

  if (error) {
    console.error('Error creating assignment:', error)
    throw error
  }

  return data as ResourceAssignment
}

export async function updateAssignmentStatus(id: string, status: string): Promise<ResourceAssignment> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_assignments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating assignment:', error)
    throw error
  }

  return data as ResourceAssignment
}

export async function deleteAssignment(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('resource_assignments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting assignment:', error)
    throw error
  }
}

// ============================================
// RESPONSES
// ============================================

export async function getResponses(filters?: {
  resource_id?: string
  member_id?: string
  assignment_id?: string
  status?: string
}): Promise<ResourceResponse[]> {
  const supabase = createClient()

  let query = supabase
    .from('resource_responses')
    .select(`
      *,
      resource:resources(*),
      assignment:resource_assignments(*),
      member:members(id, first_name, last_name)
    `)
    .order('submitted_at', { ascending: false, nullsFirst: false })

  if (filters?.resource_id) {
    query = query.eq('resource_id', filters.resource_id)
  }
  if (filters?.member_id) {
    query = query.eq('member_id', filters.member_id)
  }
  if (filters?.assignment_id) {
    query = query.eq('assignment_id', filters.assignment_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching responses:', error)
    throw error
  }

  return data as ResourceResponse[]
}

export async function getResponseById(id: string): Promise<ResourceResponse | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_responses')
    .select(`
      *,
      resource:resources(*),
      assignment:resource_assignments(*),
      member:members(id, first_name, last_name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching response:', error)
    throw error
  }

  return data as ResourceResponse
}

export async function createResponse(response: CreateResponseDTO): Promise<ResourceResponse> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('resource_responses')
    .insert({
      practitioner_id: user.id,
      assignment_id: response.assignment_id,
      resource_id: response.resource_id,
      member_id: response.member_id,
      responses: response.responses,
      scores: response.scores || {},
      status: response.status || 'draft',
      time_spent_seconds: response.time_spent_seconds,
      submitted_at: response.status === 'submitted' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating response:', error)
    throw error
  }

  // Notify practitioner when a resource response is submitted
  if (response.status === 'submitted') {
    try {
      const { data: member } = await supabase
        .from('members')
        .select('first_name, last_name')
        .eq('id', response.member_id)
        .single()

      const { data: resource } = await supabase
        .from('resources')
        .select('title')
        .eq('id', response.resource_id)
        .single()

      if (member && resource) {
        await notifyResourceSubmitted(supabase, {
          practitionerUserId: user.id,
          memberId: response.member_id,
          memberName: `${member.first_name} ${member.last_name}`,
          resourceId: response.resource_id,
          resourceTitle: resource.title,
          responseId: data.id,
        })
      }
    } catch (notifyError) {
      console.error('Error sending resource submitted notification:', notifyError)
    }
  }

  return data as ResourceResponse
}

export async function updateResponse(
  id: string,
  updates: Partial<CreateResponseDTO>
): Promise<ResourceResponse> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (updates.status === 'submitted') {
    updateData.submitted_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('resource_responses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating response:', error)
    throw error
  }

  // Notify practitioner when a resource response is submitted
  if (updates.status === 'submitted' && data.member_id && data.resource_id) {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: member } = await supabase
        .from('members')
        .select('first_name, last_name')
        .eq('id', data.member_id)
        .single()

      const { data: resource } = await supabase
        .from('resources')
        .select('title')
        .eq('id', data.resource_id)
        .single()

      if (user && member && resource) {
        await notifyResourceSubmitted(supabase, {
          practitionerUserId: user.id,
          memberId: data.member_id,
          memberName: `${member.first_name} ${member.last_name}`,
          resourceId: data.resource_id,
          resourceTitle: resource.title,
          responseId: data.id,
        })
      }
    } catch (notifyError) {
      console.error('Error sending resource submitted notification:', notifyError)
    }
  }

  return data as ResourceResponse
}

export async function addPractitionerNotes(
  id: string,
  notes: string
): Promise<ResourceResponse> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_responses')
    .update({
      practitioner_notes: notes,
      reviewed_at: new Date().toISOString(),
      status: 'reviewed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error adding notes:', error)
    throw error
  }

  return data as ResourceResponse
}

// ============================================
// SUBMISSIONS
// ============================================

export interface ResourceSubmission {
  id: string
  resource_id: string | null  // Can be null if resource was deleted
  member_id: string
  practitioner_id: string
  responses: Record<string, unknown>
  scores?: {
    total?: number
    maxScore?: number
    percentage?: number
  }
  status: 'draft' | 'submitted' | 'reviewed'
  submitted_at: string | null
  reviewed_at?: string
  practitioner_notes?: string
  time_spent_seconds?: number
  created_at: string
  updated_at: string
  // Resource snapshot for data preservation (stored at submission time)
  resource_snapshot?: {
    title: unknown
    blocks: unknown
    settings: unknown
    type: string
  }
  // Joined data
  member?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
  resource?: Resource
}

export async function getResourceSubmissions(resourceId: string): Promise<ResourceSubmission[]> {
  const supabase = createClient()

  // Get current user to filter by their members only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No authenticated user')
    return []
  }

  const { data, error } = await supabase
    .from('resource_responses')
    .select(`
      *,
      member:members(id, first_name, last_name, avatar_url)
    `)
    .eq('resource_id', resourceId)
    .eq('practitioner_id', user.id) // Only show submissions from this practitioner's members
    .in('status', ['submitted', 'reviewed', 'draft'])
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching submissions:', error)
    throw error
  }

  return data as ResourceSubmission[]
}

export async function getSubmissionById(id: string): Promise<ResourceSubmission | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_responses')
    .select(`
      *,
      member:members(id, first_name, last_name, avatar_url),
      resource:resources(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching submission:', error)
    throw error
  }

  return data as ResourceSubmission
}

export async function createSubmission(submission: {
  resource_id: string
  member_id: string
  responses: Record<string, unknown>
  score?: number
  max_score?: number
  score_interpretation?: string
  status?: 'draft' | 'submitted' | 'reviewed'
}): Promise<ResourceSubmission> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('resource_responses')
    .insert({
      resource_id: submission.resource_id,
      member_id: submission.member_id,
      practitioner_id: user.id,
      responses: submission.responses,
      score: submission.score,
      max_score: submission.max_score,
      score_interpretation: submission.score_interpretation,
      status: submission.status || 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select(`
      *,
      member:members(id, first_name, last_name, avatar_url)
    `)
    .single()

  if (error) {
    console.error('Error creating submission:', error)
    throw error
  }

  return data as ResourceSubmission
}

export async function updateSubmission(
  id: string,
  updates: {
    status?: 'draft' | 'submitted' | 'reviewed'
    reviewer_notes?: string
    practitioner_notes?: string
  }
): Promise<ResourceSubmission> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.status) {
    updateData.status = updates.status
  }

  // Support both field names for backwards compatibility
  if (updates.practitioner_notes !== undefined) {
    updateData.practitioner_notes = updates.practitioner_notes
  } else if (updates.reviewer_notes !== undefined) {
    updateData.practitioner_notes = updates.reviewer_notes
  }

  if (updates.status === 'reviewed') {
    updateData.reviewed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('resource_responses')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      member:members(id, first_name, last_name, avatar_url)
    `)
    .single()

  if (error) {
    console.error('Error updating submission:', error)
    throw error
  }

  return data as ResourceSubmission
}

export async function deleteSubmission(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('resource_responses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting submission:', error)
    throw error
  }
}

export async function getMemberSubmissions(memberId: string): Promise<ResourceSubmission[]> {
  const supabase = createClient()

  // Defense-in-depth: explicitly pin to the current practitioner so a
  // browser-side query can't return another practitioner's data even if
  // RLS were ever misconfigured. The practitioner who owns the member
  // is also the only one who has a useful answer here.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('resource_responses')
    .select(`
      *,
      resource:resources(id, title, type, category)
    `)
    .eq('member_id', memberId)
    .eq('practitioner_id', user.id)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching member submissions:', error)
    throw error
  }

  return data as ResourceSubmission[]
}

// ============================================
// STATS
// ============================================

export async function getResourceStats(): Promise<{
  total: number
  byType: Record<ResourceType, number>
  byStatus: Record<ResourceStatus, number>
  totalAssignments: number
  totalResponses: number
  completionRate: number
}> {
  const supabase = createClient()

  const { data: resources, error: resourcesError } = await supabase
    .from('resources')
    .select('type, status, times_assigned, times_completed')

  if (resourcesError) throw resourcesError

  // Include 'assessment' for backwards compatibility with existing data
  const byType: Record<ResourceType | 'assessment', number> = {
    worksheet: 0,
    assessment: 0, // Legacy type - counts separately but displays as worksheet
    exercise: 0,
    psychoeducation: 0,
    table: 0,
  }

  const byStatus: Record<ResourceStatus, number> = {
    draft: 0,
    published: 0,
    archived: 0,
  }

  let totalAssignments = 0
  let totalResponses = 0

  resources?.forEach((r) => {
    byType[r.type as ResourceType]++
    byStatus[r.status as ResourceStatus]++
    totalAssignments += r.times_assigned || 0
    totalResponses += r.times_completed || 0
  })

  const completionRate = totalAssignments > 0
    ? Math.round((totalResponses / totalAssignments) * 100)
    : 0

  return {
    total: resources?.length || 0,
    byType,
    byStatus,
    totalAssignments,
    totalResponses,
    completionRate,
  }
}
