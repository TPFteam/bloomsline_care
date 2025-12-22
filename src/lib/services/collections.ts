import { createClient } from '@/lib/supabase/browser-client'
import type {
  Collection,
  CollectionResource,
  CreateCollectionDTO,
  UpdateCollectionDTO,
} from '@/types/collection'

// ============================================
// COLLECTIONS
// ============================================

export async function getCollections(): Promise<Collection[]> {
  const supabase = createClient()

  // Get collections with resource count
  const { data, error } = await supabase
    .from('resource_collections')
    .select(`
      *,
      collection_resources(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching collections:', error)
    throw error
  }

  // Transform the data to include resource_count
  return (data || []).map(collection => ({
    ...collection,
    resource_count: collection.collection_resources?.[0]?.count || 0,
  })) as Collection[]
}

export async function getCollectionById(id: string): Promise<Collection | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_collections')
    .select(`
      *,
      collection_resources(count)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching collection:', error)
    throw error
  }

  return {
    ...data,
    resource_count: data.collection_resources?.[0]?.count || 0,
  } as Collection
}

export async function createCollection(collection: CreateCollectionDTO): Promise<Collection> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('resource_collections')
    .insert({
      practitioner_id: user.id,
      name: collection.name,
      description: collection.description,
      color: collection.color || 'blue',
      icon: collection.icon || 'folder',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating collection:', error)
    throw error
  }

  return { ...data, resource_count: 0 } as Collection
}

export async function updateCollection(id: string, updates: UpdateCollectionDTO): Promise<Collection> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('resource_collections')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating collection:', error)
    throw error
  }

  return data as Collection
}

export async function deleteCollection(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('resource_collections')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}

// ============================================
// COLLECTION RESOURCES
// ============================================

export async function getCollectionResources(collectionId: string): Promise<CollectionResource[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('collection_resources')
    .select('*')
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('Error fetching collection resources:', error)
    throw error
  }

  return data as CollectionResource[]
}

// Get collection resources with full resource details
export async function getCollectionResourcesWithDetails(collectionId: string) {
  const supabase = createClient()

  // Get collection resources
  const { data: collectionResources, error: crError } = await supabase
    .from('collection_resources')
    .select('*')
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })

  if (crError) {
    console.error('Error fetching collection resources:', crError)
    throw crError
  }

  if (!collectionResources || collectionResources.length === 0) {
    return []
  }

  // Get the resource IDs
  const resourceIds = collectionResources
    .filter(cr => cr.resource_id)
    .map(cr => cr.resource_id)

  if (resourceIds.length === 0) {
    return []
  }

  // Fetch the actual resources
  const { data: resources, error: rError } = await supabase
    .from('resources')
    .select('*')
    .in('id', resourceIds)

  if (rError) {
    console.error('Error fetching resources:', rError)
    throw rError
  }

  // Merge collection resource info with resource details
  return collectionResources.map(cr => {
    const resource = resources?.find(r => r.id === cr.resource_id)
    return {
      ...cr,
      resource,
    }
  }).filter(cr => cr.resource) // Only return items where we found the resource
}

export async function addResourceToCollection(
  collectionId: string,
  resourceId?: string,
  externalResourceId?: string
): Promise<CollectionResource> {
  const supabase = createClient()

  if (!resourceId && !externalResourceId) {
    throw new Error('Either resourceId or externalResourceId is required')
  }

  // First try to insert
  console.log('Attempting to add resource to collection:', { collectionId, resourceId })

  const { data, error: insertError } = await supabase
    .from('collection_resources')
    .insert({
      collection_id: collectionId,
      resource_id: resourceId || null,
      external_resource_id: externalResourceId || null,
    })
    .select()

  console.log('Insert result:', { data, error: insertError, errorStr: JSON.stringify(insertError) })

  if (insertError) {
    console.error('Error adding resource to collection:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
      fullError: JSON.stringify(insertError),
      collectionId,
      resourceId,
    })
    throw insertError
  }

  // Return a simple response (we don't need the full object)
  return {
    id: '', // ID will be auto-generated
    collection_id: collectionId,
    resource_id: resourceId || null,
    external_resource_id: externalResourceId || null,
    added_at: new Date().toISOString(),
  } as CollectionResource
}

export async function removeResourceFromCollection(
  collectionId: string,
  resourceId?: string,
  externalResourceId?: string
): Promise<void> {
  const supabase = createClient()

  let query = supabase
    .from('collection_resources')
    .delete()
    .eq('collection_id', collectionId)

  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  } else if (externalResourceId) {
    query = query.eq('external_resource_id', externalResourceId)
  } else {
    throw new Error('Either resourceId or externalResourceId is required')
  }

  const { error } = await query

  if (error) {
    console.error('Error removing resource from collection:', error)
    throw error
  }
}

export async function isResourceInCollection(
  collectionId: string,
  resourceId?: string,
  externalResourceId?: string
): Promise<boolean> {
  const supabase = createClient()

  let query = supabase
    .from('collection_resources')
    .select('id')
    .eq('collection_id', collectionId)

  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  } else if (externalResourceId) {
    query = query.eq('external_resource_id', externalResourceId)
  } else {
    return false
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Error checking resource in collection:', error)
    return false
  }

  return !!data
}

// Get all collections that contain a specific resource
export async function getCollectionsForResource(
  resourceId?: string,
  externalResourceId?: string
): Promise<string[]> {
  const supabase = createClient()

  let query = supabase
    .from('collection_resources')
    .select('collection_id')

  if (resourceId) {
    query = query.eq('resource_id', resourceId)
  } else if (externalResourceId) {
    query = query.eq('external_resource_id', externalResourceId)
  } else {
    return []
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching collections for resource:', error)
    return []
  }

  return data.map(r => r.collection_id)
}

// Remove a resource from ALL collections (for "remove from my resources")
export async function removeResourceFromAllCollections(
  resourceId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('collection_resources')
    .delete()
    .eq('resource_id', resourceId)

  if (error) {
    console.error('Error removing resource from all collections:', error)
    throw error
  }
}

// Check if a resource is saved in any of the user's collections
export async function isResourceSaved(resourceId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('collection_resources')
    .select('id')
    .eq('resource_id', resourceId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error checking if resource is saved:', error)
    return false
  }

  return !!data
}

// Get all resources saved in any collection by the current user
export async function getSavedResources() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // First, get the user's collection IDs
  const { data: userCollections, error: colError } = await supabase
    .from('resource_collections')
    .select('id')
    .eq('practitioner_id', user.id)

  if (colError) {
    console.error('Error fetching user collections:', colError)
    throw colError
  }

  if (!userCollections || userCollections.length === 0) {
    return []
  }

  const collectionIds = userCollections.map(c => c.id)

  // Get all resource IDs from those collections
  const { data: collectionResources, error: crError } = await supabase
    .from('collection_resources')
    .select('resource_id')
    .in('collection_id', collectionIds)
    .not('resource_id', 'is', null)

  if (crError) {
    console.error('Error fetching collection resources:', crError)
    throw crError
  }

  if (!collectionResources || collectionResources.length === 0) {
    return []
  }

  // Get unique resource IDs
  const resourceIds = [...new Set(collectionResources.map(cr => cr.resource_id).filter(Boolean))]

  if (resourceIds.length === 0) {
    return []
  }

  // Fetch all the saved resources (including user's own if they saved them)
  const { data: resources, error: rError } = await supabase
    .from('resources')
    .select('*')
    .in('id', resourceIds)

  if (rError) {
    console.error('Error fetching saved resources:', rError)
    throw rError
  }

  return resources || []
}
