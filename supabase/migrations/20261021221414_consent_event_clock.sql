begin;
alter table public.candidate_consents alter column recorded_at set default clock_timestamp();
commit;
