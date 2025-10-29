-- Migration: Add metadata fields to Photo table
-- Description: Add width, height, mime, and sizeBytes fields for better UX

-- Add metadata columns to Photo table
ALTER TABLE "public"."Photo"
ADD COLUMN IF NOT EXISTS "width" INT,
ADD COLUMN IF NOT EXISTS "height" INT,
ADD COLUMN IF NOT EXISTS "mime" TEXT,
ADD COLUMN IF NOT EXISTS "sizeBytes" BIGINT;

-- Add comments for documentation
COMMENT ON COLUMN "public"."Photo"."width" IS 'Image width in pixels';
COMMENT ON COLUMN "public"."Photo"."height" IS 'Image height in pixels';
COMMENT ON COLUMN "public"."Photo"."mime" IS 'MIME type (e.g., image/jpeg)';
COMMENT ON COLUMN "public"."Photo"."sizeBytes" IS 'File size in bytes';