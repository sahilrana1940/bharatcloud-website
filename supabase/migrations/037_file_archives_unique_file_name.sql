-- Upsert Gmail archives by company + file_name (e.g. {messageId}.eml).
create unique index if not exists file_archives_company_file_name_unique
  on file_archives (company_id, file_name)
  where company_id is not null and file_name is not null;

notify pgrst, 'reload schema';
