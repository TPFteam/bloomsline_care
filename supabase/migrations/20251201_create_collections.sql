-- Create resource_collections table
-- Collections allow practitioners to organize their saved resources

CREATE TABLE IF NOT EXISTS resource_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Collection info
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue', -- Color theme: blue, red, emerald, amber, purple, etc.
  icon TEXT DEFAULT 'folder', -- Icon name: folder, heart, star, etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_collection_name_per_user UNIQUE (practitioner_id, name)
);

-- Create junction table for collection-resource relationships
CREATE TABLE IF NOT EXISTS collection_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES resource_collections(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- For saved library resources (external resources not in our DB)
  external_resource_id TEXT, -- ID from sample library resources

  -- Metadata
  added_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints - a resource can only be in a collection once
  CONSTRAINT unique_resource_per_collection UNIQUE (collection_id, resource_id),
  CONSTRAINT unique_external_resource_per_collection UNIQUE (collection_id, external_resource_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_practitioner ON resource_collections(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_collection_resources_collection ON collection_resources(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_resources_resource ON collection_resources(resource_id);

-- Enable RLS
ALTER TABLE resource_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_collections

-- Users can view their own collections
CREATE POLICY "Users can view own collections"
  ON resource_collections
  FOR SELECT
  USING (auth.uid() = practitioner_id);

-- Users can create their own collections
CREATE POLICY "Users can create own collections"
  ON resource_collections
  FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

-- Users can update their own collections
CREATE POLICY "Users can update own collections"
  ON resource_collections
  FOR UPDATE
  USING (auth.uid() = practitioner_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete own collections"
  ON resource_collections
  FOR DELETE
  USING (auth.uid() = practitioner_id);

-- RLS Policies for collection_resources

-- Users can view resources in their collections
CREATE POLICY "Users can view own collection resources"
  ON collection_resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resource_collections
      WHERE resource_collections.id = collection_resources.collection_id
      AND resource_collections.practitioner_id = auth.uid()
    )
  );

-- Users can add resources to their collections
CREATE POLICY "Users can add to own collections"
  ON collection_resources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resource_collections
      WHERE resource_collections.id = collection_resources.collection_id
      AND resource_collections.practitioner_id = auth.uid()
    )
  );

-- Users can remove resources from their collections
CREATE POLICY "Users can remove from own collections"
  ON collection_resources
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resource_collections
      WHERE resource_collections.id = collection_resources.collection_id
      AND resource_collections.practitioner_id = auth.uid()
    )
  );

-- Create trigger to update updated_at on collection changes
CREATE OR REPLACE FUNCTION update_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON resource_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_updated_at();

-- Create a default "Favorites" collection for new users (via trigger)
CREATE OR REPLACE FUNCTION create_default_favorites_collection()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO resource_collections (practitioner_id, name, description, color, icon)
  VALUES (NEW.id, 'Favorites', 'Your favorite resources', 'red', 'heart')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This trigger creates a Favorites collection when a new user signs up
-- Note: This may need to be adjusted based on your auth setup
CREATE TRIGGER create_favorites_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_favorites_collection();
