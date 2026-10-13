-- Use lowercase b3 as the object-storage meter key (Backblaze B3 / S3-compatible vault)

alter table billing_usage drop constraint if exists billing_usage_service_check;

update billing_usage set service = 'b3' where service = 'B3';

alter table billing_usage
  add constraint billing_usage_service_check
  check (service in ('VPS', 'b3', 'Mail'));

notify pgrst, 'reload schema';
