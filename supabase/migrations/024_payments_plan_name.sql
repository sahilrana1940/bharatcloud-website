alter table payments
  add column if not exists plan_name text;

notify pgrst, 'reload schema';
