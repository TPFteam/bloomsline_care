import { createClient } from '@/lib/supabase/browser-client'
import type {
  BloomConversation,
  BloomMessage,
  BloomUserSettings,
  BloomDailyPrompt,
  BloomInsight,
  ChatRequest,
  ChatResponse,
} from '@/types/bloom'

// ============================================
// Chat Functions
// ============================================

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/bloom/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to send message'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // Response might not be JSON
      errorMessage = `Server error: ${response.status}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// ============================================
// Conversation Functions
// ============================================

export async function getConversations(limit = 20): Promise<BloomConversation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bloom_conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  return data as BloomConversation[]
}

export async function getConversation(id: string): Promise<BloomConversation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bloom_conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return null
  }

  return data as BloomConversation
}

export async function getConversationMessages(
  conversationId: string,
  limit = 50
): Promise<BloomMessage[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bloom_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return data as BloomMessage[]
}

export async function getActiveConversation(): Promise<BloomConversation | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('bloom_conversations')
    .select('*')
    .eq('is_active', true)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // No active conversation is fine
    return null
  }

  return data as BloomConversation
}

// ============================================
// User Settings
// ============================================

export async function getBloomSettings(): Promise<BloomUserSettings | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('bloom_user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // Settings don't exist yet
    return null
  }

  return data as BloomUserSettings
}

export async function updateBloomSettings(
  updates: Partial<BloomUserSettings>
): Promise<BloomUserSettings | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try to update existing settings
  const { data: existing } = await supabase
    .from('bloom_user_settings')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('bloom_user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      return null
    }

    return data as BloomUserSettings
  }

  // Create new settings
  const { data, error } = await supabase
    .from('bloom_user_settings')
    .insert({
      user_id: user.id,
      ...updates,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating settings:', error)
    return null
  }

  return data as BloomUserSettings
}

export async function markBloomOnboarded(): Promise<void> {
  await updateBloomSettings({
    has_met_bloom: true,
    onboarding_completed_at: new Date().toISOString(),
  })
}

// ============================================
// Daily Prompts
// ============================================

export async function getTodaysPrompt(): Promise<BloomDailyPrompt | null> {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bloom_daily_prompts')
    .select('*')
    .eq('scheduled_for', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return null
  }

  return data as BloomDailyPrompt
}

export async function markPromptShown(promptId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('bloom_daily_prompts')
    .update({ shown_at: new Date().toISOString() })
    .eq('id', promptId)
}

export async function markPromptResponded(
  promptId: string,
  momentId?: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('bloom_daily_prompts')
    .update({
      responded_at: new Date().toISOString(),
      response_moment_id: momentId || null,
    })
    .eq('id', promptId)
}

// ============================================
// Insights
// ============================================

export async function getActiveInsights(): Promise<BloomInsight[]> {
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bloom_insights')
    .select('*')
    .eq('is_dismissed', false)
    .lte('valid_from', today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching insights:', error)
    return []
  }

  return data as BloomInsight[]
}

export async function dismissInsight(insightId: string): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('bloom_insights')
    .update({ is_dismissed: true })
    .eq('id', insightId)
}
