-- The candidate status projection authenticates via require_workflow_actor(),
-- which locks the account row. PostgREST runs STABLE RPCs read-only, so the
-- projection must be VOLATILE even though it does not change business data.
alter function public.my_candidate_participations() volatile;
