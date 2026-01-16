-- Add slug column to news table (nullable initially)
ALTER TABLE "news" ADD COLUMN "slug" varchar(255);

-- Create index for faster slug lookups
CREATE INDEX "news_slug_idx" ON "news"("slug");

-- Note: UNIQUE constraint will be added after slugs are populated
