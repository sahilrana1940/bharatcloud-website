-- 3-role SaaS access (columns on company_users; exposed via team_members view)

alter table company_users
  add column if not exists saas_role text not null default 'employee'
    check (saas_role in ('super_admin', 'company_owner', 'employee'));

alter table company_users
  add column if not exists is_company_owner boolean not null default false;

update company_users
set saas_role = 'company_owner', is_company_owner = true
where role = 'admin' and saas_role = 'employee';

create or replace view team_members as
select
  cu.id,
  c.domain as company_domain,
  cu.company_id,
  cu.email,
  coalesce(cu.display_name, split_part(cu.email, '@', 1)) as name,
  cu.saas_role as role,
  cu.is_company_owner,
  cu.role as workspace_role,
  cu.is_backup_enabled,
  cu.drive_used_gb as storage_used_gb,
  cu.drive_limit_gb,
  cu.drive_sync_status,
  cu.email_sync_status,
  cu.email_sync_progress
from company_users cu
join companies c on c.id = cu.company_id;
