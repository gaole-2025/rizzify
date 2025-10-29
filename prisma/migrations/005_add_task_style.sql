-- Migration: Add style field to Task table
-- Description: Add style field to support different generation styles (classic, etc.)

-- Add style column to Task table
ALTER TABLE "public"."Task"
ADD COLUMN IF NOT EXISTS "style" TEXT DEFAULT 'classic';

-- Add comment for documentation
COMMENT ON COLUMN "public"."Task"."style" IS 'Generation style (e.g., classic, artistic, etc.)';

-- Update existing records to have default style
UPDATE "public"."Task"
SET "style" = 'classic'
WHERE "style" IS NULL;