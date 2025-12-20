-- ============================================
-- Add 'table' to resource_type enum
-- ============================================

-- Add 'table' value to the resource_type enum
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'table';
