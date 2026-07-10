-- Add password hashes for JWT auth accounts.
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
