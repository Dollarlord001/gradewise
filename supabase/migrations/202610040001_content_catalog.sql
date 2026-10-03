-- Normalized content catalog layered over the existing CBT questions table.
-- Existing question IDs and CBT relations remain stable.
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  normalized_name text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.question_options (
  question_id uuid not null references public.questions(id) on delete cascade,
  option_key text not null, option_text text not null, sort_order smallint not null,
  created_at timestamptz not null default now(), primary key(question_id,option_key),
  unique(question_id,sort_order)
);
create table if not exists public.question_topics (
  question_id uuid not null references public.questions(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  topic text not null, subtopic text, created_at timestamptz not null default now(),
  primary key(question_id,topic)
);
create table if not exists public.question_sources (
  id uuid primary key default gen_random_uuid(), source_key text not null unique,
  source_name text not null, source_url text, created_at timestamptz not null default now()
);
create table if not exists public.question_provenance (
  question_id uuid not null references public.questions(id) on delete cascade,
  source_id uuid not null references public.question_sources(id) on delete restrict,
  source_record_id text, provenance jsonb not null default '{}'::jsonb,
  rights_status text not null, rights_evidence text, created_at timestamptz not null default now(),
  primary key(question_id,source_id,source_record_id)
);
create table if not exists public.question_verification (
  question_id uuid primary key references public.questions(id) on delete cascade,
  status text not null default 'pending', reviewed_by text, reviewed_at timestamptz,
  evidence text, updated_at timestamptz not null default now()
);
create table if not exists public.learning_resources (
  id text primary key, title text not null, author text, publisher text,
  exam_relevance text, resource_type text not null, publication_year smallint,
  source text not null, source_url text not null, reader_url text,
  rights_status text not null, license text, access_type text not null,
  reader_available boolean not null default false, download_allowed boolean not null default false,
  cover_url text, description text, language text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.resource_subjects (
  resource_id text not null references public.learning_resources(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  primary key(resource_id,subject_id)
);
create table if not exists public.resource_levels (
  resource_id text not null references public.learning_resources(id) on delete cascade,
  level text not null, primary key(resource_id,level)
);
create table if not exists public.resource_rights (
  resource_id text primary key references public.learning_resources(id) on delete cascade,
  rights_status text not null, license text, evidence jsonb not null default '{}'::jsonb,
  download_allowed boolean not null default false, updated_at timestamptz not null default now()
);
create table if not exists public.content_import_batches (
  id text primary key, content_kind text not null check(content_kind in ('questions','resources')),
  source_manifest text not null, status text not null default 'in_progress',
  records_seen bigint not null default 0, records_imported bigint not null default 0,
  records_failed bigint not null default 0, last_offset bigint not null default 0,
  started_at timestamptz not null default now(), completed_at timestamptz, updated_at timestamptz not null default now()
);

alter table public.questions
  add column if not exists normalized_subject text,
  add column if not exists content_type text not null default 'AUTHENTIC_AUTHORIZED',
  add column if not exists estimated_time integer,
  add column if not exists exam_type text,
  add column if not exists content_fingerprint text;
create index if not exists questions_content_subject_idx on public.questions(normalized_subject,exam,year,id);
create index if not exists questions_content_facets_idx on public.questions(exam,year,difficulty,verification_status,rights_status,id);
create index if not exists questions_content_source_idx on public.questions(source,created_at desc,id);
create unique index if not exists questions_content_fingerprint_uidx on public.questions(content_fingerprint) where content_fingerprint is not null;
create index if not exists question_topics_subject_topic_idx on public.question_topics(subject_id,topic,subtopic,question_id);
create index if not exists question_verification_status_idx on public.question_verification(status,updated_at,question_id);
create index if not exists learning_resources_subject_level_idx on public.resource_subjects(subject_id,resource_id);
create index if not exists learning_resources_rights_idx on public.learning_resources(rights_status,reader_available,download_allowed);

alter table public.subjects enable row level security;
alter table public.exams enable row level security;
alter table public.question_options enable row level security;
alter table public.question_topics enable row level security;
alter table public.question_sources enable row level security;
alter table public.question_provenance enable row level security;
alter table public.question_verification enable row level security;
alter table public.learning_resources enable row level security;
alter table public.resource_subjects enable row level security;
alter table public.resource_levels enable row level security;
alter table public.resource_rights enable row level security;
alter table public.content_import_batches enable row level security;
create policy "content catalog subjects read" on public.subjects for select to anon,authenticated using(true);
create policy "content catalog exams read" on public.exams for select to anon,authenticated using(true);
create policy "content options read" on public.question_options for select to anon,authenticated using(true);
create policy "content topics read" on public.question_topics for select to anon,authenticated using(true);
create policy "content sources read" on public.question_sources for select to anon,authenticated using(true);
create policy "content provenance read" on public.question_provenance for select to anon,authenticated using(true);
create policy "content verification read" on public.question_verification for select to anon,authenticated using(true);
create policy "learning resources read" on public.learning_resources for select to anon,authenticated using(true);
create policy "resource subjects read" on public.resource_subjects for select to anon,authenticated using(true);
create policy "resource levels read" on public.resource_levels for select to anon,authenticated using(true);
create policy "resource rights read" on public.resource_rights for select to anon,authenticated using(true);
revoke all on public.content_import_batches from anon,authenticated;
grant select on public.subjects,public.exams,public.question_options,public.question_topics,public.question_sources,public.question_provenance,public.question_verification,public.learning_resources,public.resource_subjects,public.resource_levels,public.resource_rights to anon,authenticated;
