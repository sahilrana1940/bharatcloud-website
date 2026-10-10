-- Fix: "Could not find the mime_type column of personal_vault"
-- Run in Supabase SQL Editor if vault upload fails after older partial migrations.

alter table personal_vault add column if not exists mime_type text;
alter table personal_vault add column if not exists thumb_path text;
alter table personal_vault add column if not exists hot_path text;
alter table personal_vault add column if not exists cold_path text;
