-- Add last_login_at column to users table
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;

-- Initialize last_login_at with updated_at for existing users
UPDATE "users" SET "last_login_at" = "updated_at";
