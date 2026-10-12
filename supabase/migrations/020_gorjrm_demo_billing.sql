-- Optional one-time demo (GOR JRM) — run manually if needed

update companies
set billing_status = 'active', subscription_status = 'active'
where domain = 'gorjrmcourier.com';

notify pgrst, 'reload schema';
