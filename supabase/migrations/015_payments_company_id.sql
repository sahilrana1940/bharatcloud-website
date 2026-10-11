-- Multi-tenant: link payments to companies.id

alter table payments
  add column if not exists company_id uuid references companies(id) on delete cascade;

update payments p
set company_id = c.id
from companies c
where p.company_id is null and c.domain = p.company_domain;

create index if not exists payments_company_status on payments (company_id, status);

notify pgrst, 'reload schema';
