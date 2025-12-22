-- Create member reflections table for the open canvas reflection feature
CREATE TABLE IF NOT EXISTS public.member_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    intent TEXT DEFAULT 'reflect', -- discovery, vent, reflect, gratitude
    content TEXT,
    image_url TEXT,
    audio_url TEXT,
    mood INTEGER CHECK (mood >= 0 AND mood <= 4), -- 0=sad, 1=down, 2=okay, 3=good, 4=great (optional)
    -- Legacy fields for backwards compatibility
    gratitude TEXT,
    thoughts TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS member_reflections_member_id_idx ON public.member_reflections(member_id);
CREATE INDEX IF NOT EXISTS member_reflections_created_at_idx ON public.member_reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS member_reflections_intent_idx ON public.member_reflections(intent);

-- Enable RLS
ALTER TABLE public.member_reflections ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view their own reflections
CREATE POLICY "Members can view own reflections"
    ON public.member_reflections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = member_reflections.member_id
            AND m.user_id = auth.uid()
        )
    );

-- Policy: Members can create their own reflections
CREATE POLICY "Members can create own reflections"
    ON public.member_reflections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = member_reflections.member_id
            AND m.user_id = auth.uid()
        )
    );

-- Policy: Members can update their own reflections
CREATE POLICY "Members can update own reflections"
    ON public.member_reflections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = member_reflections.member_id
            AND m.user_id = auth.uid()
        )
    );

-- Policy: Members can delete their own reflections
CREATE POLICY "Members can delete own reflections"
    ON public.member_reflections
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = member_reflections.member_id
            AND m.user_id = auth.uid()
        )
    );

-- Policy: Practitioners can view reflections of their members
CREATE POLICY "Practitioners can view member reflections"
    ON public.member_reflections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = member_reflections.member_id
            AND m.practitioner_id = auth.uid()
        )
    );

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_member_reflections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_reflections_updated_at
    BEFORE UPDATE ON public.member_reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_member_reflections_updated_at();
