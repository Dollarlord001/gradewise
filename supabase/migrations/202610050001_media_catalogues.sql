-- Incremental media catalogues. Existing question/auth/CBT tables are untouched.
alter table public.learning_resources
  add column if not exists provenance jsonb not null default '{}'::jsonb,
  add column if not exists rights_verified_at timestamptz,
  add column if not exists rights_reviewer text;

create table if not exists public.resource_topics (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null references public.learning_resources(id) on delete cascade,
  exam text not null,
  subject text not null,
  topic text not null,
  subtopic text,
  syllabus_source text,
  syllabus_url text
);
create unique index if not exists resource_topics_link_uidx on public.resource_topics(resource_id, exam, subject, topic, coalesce(subtopic, ''));
create index if not exists resource_topics_exam_subject_topic_idx on public.resource_topics(exam, subject, topic, resource_id);

create table if not exists public.video_catalogue (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  title text not null,
  description text,
  creator text not null,
  source text not null,
  source_url text not null,
  video_url text not null,
  video_id text not null,
  licence text not null,
  licence_status text not null check (licence_status in ('owned','licensed','public_domain','permission_granted')),
  licence_url text not null,
  attribution text not null,
  rights_evidence_url text not null,
  rights_verified_at timestamptz not null,
  rights_reviewer text not null,
  exam text not null check (exam in ('JAMB','WAEC','NECO')),
  subject text not null,
  topic text not null,
  subtopic text,
  syllabus_source text not null,
  syllabus_url text not null,
  syllabus_verified_at timestamptz not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  thumbnail_url text,
  hosting_mode text not null check (hosting_mode in ('youtube_embed','external_embed','external_video','tutor_me_cdn')),
  provenance jsonb not null,
  status text not null default 'pending_review' check (status in ('pending_review','published','rejected','expired')),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source, external_id),
  unique(video_url, exam, subject, topic)
);
create index if not exists video_catalogue_browse_idx on public.video_catalogue(exam, subject, topic, subtopic, status, id);
create index if not exists video_catalogue_creator_idx on public.video_catalogue(creator, id);
create index if not exists video_catalogue_search_idx on public.video_catalogue using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(topic,'')));

create table if not exists public.video_playlists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  exam text not null,
  subject text not null,
  topic text,
  status text not null default 'pending_review' check (status in ('pending_review','published','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.video_playlist_items (
  playlist_id uuid not null references public.video_playlists(id) on delete cascade,
  video_id uuid not null references public.video_catalogue(id) on delete cascade,
  sort_order integer not null,
  primary key(playlist_id, video_id),
  unique(playlist_id, sort_order)
);
create table if not exists public.video_watch_progress (
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  video_id uuid not null references public.video_catalogue(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  watch_percent numeric(5,2) not null default 0 check (watch_percent between 0 and 100),
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(student_id, video_id)
);

alter table public.resource_topics enable row level security;
alter table public.video_catalogue enable row level security;
alter table public.video_playlists enable row level security;
alter table public.video_playlist_items enable row level security;
alter table public.video_watch_progress enable row level security;
create policy "resource syllabus links are public" on public.resource_topics for select to anon, authenticated using(true);
create policy "verified videos are public" on public.video_catalogue for select to anon, authenticated using(status='published' and published and rights_verified_at is not null and syllabus_verified_at is not null);
create policy "published playlists are public" on public.video_playlists for select to anon, authenticated using(status='published');
create policy "published playlist items are public" on public.video_playlist_items for select to anon, authenticated using(exists(select 1 from public.video_playlists p where p.id=playlist_id and p.status='published'));
create policy "student video progress is private" on public.video_watch_progress for all to authenticated using(student_id=public.current_student_id()) with check(student_id=public.current_student_id());
grant select on public.resource_topics, public.video_catalogue, public.video_playlists, public.video_playlist_items to anon, authenticated;
grant select, insert, update on public.video_watch_progress to authenticated;
