-- GitHub fine-grained / classic PAT for Search API (server-only via service role).

create table if not exists public.integration_github_import_pat (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  pat text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists integration_github_import_pat_set_updated_at on public.integration_github_import_pat;
create trigger integration_github_import_pat_set_updated_at
  before update on public.integration_github_import_pat
  for each row execute function public.set_updated_at();

alter table public.integration_github_import_pat enable row level security;

comment on table public.integration_github_import_pat is
  'Optional GitHub PAT per user for Search API rate limits. No JWT policies — app reads/writes only with service role after auth.uid() checks.';
