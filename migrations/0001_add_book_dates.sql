-- Add uploaded_at and published_at columns to books table
-- Note: These columns may already exist in some deployments
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "uploaded_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "published_at" timestamp;

-- Ensure the columns have the correct defaults and constraints for existing rows
UPDATE "books" SET "uploaded_at" = COALESCE("uploaded_at", "created_at") WHERE "uploaded_at" IS NULL;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN "books"."uploaded_at" IS 'When the book was uploaded to our system';
COMMENT ON COLUMN "books"."published_at" IS 'Publication date of the book';