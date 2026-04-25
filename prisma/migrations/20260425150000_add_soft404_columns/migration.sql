-- AlterTable: Add soft 404 detection fields to Endpoint table
-- This migration adds isSoft404 and responseBody columns for detecting
-- pages that return HTTP 200 but are actually error/404 pages.

ALTER TABLE "Endpoint" ADD COLUMN "isSoft404" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Endpoint" ADD COLUMN "responseBody" TEXT NOT NULL DEFAULT '';
