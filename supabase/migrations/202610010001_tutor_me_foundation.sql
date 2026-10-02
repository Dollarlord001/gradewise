-- TUTOR-ME structured data foundation. Auth identity remains owned by Supabase Auth.
create extension if not exists pgcrypto;

create type public.account_role as enum ('student','parent','teacher','school_admin','moderator','admin');
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  role public.account_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.student_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  exam text,
  target_score integer check (target_score between 0 and 1000),
  study_minutes_per_day smallint check (study_minutes_per_day between 0 and 1440),
  onboarding_completed_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  exam text not null, subject text not null, name text not null,
  parent_id uuid references public.topics(id) on delete set null,
  created_at timestamptz not null default now(), unique(exam,subject,name)
);
create table public.student_subjects (
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  exam text not null, subject text not null, created_at timestamptz not null default now(),
  primary key(student_id,exam,subject)
);
create table public.study_goals (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  title text not null check(char_length(title) <= 160), target_value integer, due_at date,
  status text not null default 'active' check(status in ('active','completed','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.study_plan_items (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  scheduled_for date not null, title text not null check(char_length(title) <= 160), subject text,
  status text not null default 'planned' check(status in ('planned','done','skipped')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index study_plan_items_student_date_status_idx on public.study_plan_items(student_id,scheduled_for,status);
create table public.topic_mastery (
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  mastery smallint not null default 0 check(mastery between 0 and 100), updated_at timestamptz not null default now(),
  primary key(student_id,topic_id)
);
create index topic_mastery_topic_idx on public.topic_mastery(topic_id);
create table public.questions (
  id uuid primary key default gen_random_uuid(), exam text not null, year smallint,
  subject text not null, paper text, question_number smallint not null check(question_number > 0),
  topic_id uuid references public.topics(id) on delete set null, prompt text not null,
  question_type text not null default 'multiple_choice', difficulty smallint check(difficulty between 1 and 5),
  options jsonb not null default '[]'::jsonb, correct_answer jsonb, explanation text,
  source_name text, source_url text, provenance jsonb not null default '{}'::jsonb,
  rights_status text not null default 'unknown', verification_status text not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null, last_reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index questions_exam_year_subject_paper_number_uidx on public.questions(exam,coalesce(year,0),subject,coalesce(paper,''),question_number);
create index questions_exact_lookup_idx on public.questions(exam,year,subject,question_number);
create index questions_topic_idx on public.questions(topic_id,exam,subject);
create table public.question_attempts (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_answer jsonb, is_correct boolean not null, source text not null default 'practice',
  idempotency_key uuid, created_at timestamptz not null default now(),
  unique(student_id,idempotency_key), unique(student_id,id)
);
create index question_attempts_student_created_idx on public.question_attempts(student_id,created_at desc,id);
create index question_attempts_question_created_idx on public.question_attempts(question_id,created_at desc);
create table public.mistakes (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  latest_attempt_id uuid,
  review_status text not null default 'to_review' check(review_status in ('to_review','reviewed','recovered')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(student_id,question_id)
);
alter table public.mistakes add constraint mistakes_attempt_owner_fk
  foreign key(student_id,latest_attempt_id) references public.question_attempts(student_id,id)
  on delete set null (latest_attempt_id);
create index mistakes_student_status_created_idx on public.mistakes(student_id,review_status,created_at desc);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null check(char_length(title) <= 160), body text not null check(char_length(body) <= 1000),
  read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_student_created_idx on public.notifications(student_id,created_at desc,id);
create table public.cbt_packs (
  id uuid primary key default gen_random_uuid(), slug text not null unique, exam text not null,
  title text not null, published_version integer, created_at timestamptz not null default now()
);
create table public.cbt_pack_versions (
  id uuid primary key default gen_random_uuid(), pack_id uuid not null references public.cbt_packs(id) on delete cascade,
  version integer not null, schema_version integer not null, object_key text not null,
  checksum_sha256 text not null check(checksum_sha256 ~ '^[a-f0-9]{64}$'), byte_size bigint not null check(byte_size > 0),
  metadata jsonb not null default '{}'::jsonb, available_at timestamptz, created_at timestamptz not null default now(), unique(pack_id,version)
);
create table public.cbt_sessions (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  pack_version_id uuid not null references public.cbt_pack_versions(id) on delete restrict,
  idempotency_key uuid not null, started_at timestamptz not null, duration_seconds integer not null check(duration_seconds > 0),
  submitted_at timestamptz, created_at timestamptz not null default now(), unique(student_id,idempotency_key)
);
create index cbt_sessions_student_created_idx on public.cbt_sessions(student_id,created_at desc);
create table public.cbt_results (
  id uuid primary key default gen_random_uuid(), session_id uuid not null unique references public.cbt_sessions(id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  score numeric(7,2) not null, answer_payload jsonb not null, synced_at timestamptz not null default now()
);
alter table public.cbt_sessions add constraint cbt_sessions_owner_id_uidx unique(student_id,id);
alter table public.cbt_results add constraint cbt_results_owner_session_fk
  foreign key(student_id,session_id) references public.cbt_sessions(student_id,id);
create table public.audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id) on delete set null,
  action text not null, target_type text not null, target_id text, request_id text,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(user_id,display_name) values(new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'),''),'Student')) on conflict(user_id) do nothing;
  insert into public.student_profiles(user_id) values(new.id) on conflict(user_id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.student_subjects enable row level security;
alter table public.study_goals enable row level security;
alter table public.study_plan_items enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.question_attempts enable row level security;
alter table public.mistakes enable row level security;
alter table public.notifications enable row level security;
alter table public.cbt_sessions enable row level security;
alter table public.cbt_results enable row level security;
alter table public.audit_logs enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.cbt_packs enable row level security;
alter table public.cbt_pack_versions enable row level security;

create policy "profile read own" on public.profiles for select to authenticated using(user_id = (select auth.uid()));
create policy "profile update own non-role" on public.profiles for update to authenticated using(user_id = (select auth.uid())) with check(user_id = (select auth.uid()) and role = 'student');
create policy "student profile own" on public.student_profiles for all to authenticated using(user_id = (select auth.uid())) with check(user_id = (select auth.uid()));
create policy "subjects own" on public.student_subjects for all to authenticated using(student_id = (select auth.uid())) with check(student_id = (select auth.uid()));
create policy "goals own" on public.study_goals for all to authenticated using(student_id = (select auth.uid())) with check(student_id = (select auth.uid()));
create policy "plan own" on public.study_plan_items for all to authenticated using(student_id = (select auth.uid())) with check(student_id = (select auth.uid()));
create policy "mastery read own" on public.topic_mastery for select to authenticated using(student_id = (select auth.uid()));
create policy "attempts own" on public.question_attempts for all to authenticated using(student_id = (select auth.uid())) with check(student_id = (select auth.uid()));
create policy "mistakes own" on public.mistakes for all to authenticated using(student_id = (select auth.uid())) with check(student_id = (select auth.uid()));
create policy "notifications own" on public.notifications for select to authenticated using(student_id = (select auth.uid()));
create policy "notifications own update" on public.notifications for update to authenticated using(student_id = (select auth.uid())) with check(student_id = (select auth.uid()));
create policy "cbt sessions own" on public.cbt_sessions for all to authenticated using(student_id = (select auth.uid())) with check(student_id = (select auth.uid()));
create policy "cbt results own" on public.cbt_results for select to authenticated using(student_id = (select auth.uid()));
create policy "public topics read" on public.topics for select to anon,authenticated using(true);
create policy "verified questions read" on public.questions for select to anon,authenticated using(verification_status = 'verified' and rights_status in ('owned','licensed','public_domain','permission_granted'));
create policy "available packs read" on public.cbt_packs for select to anon,authenticated using(published_version is not null);
create policy "available versions read" on public.cbt_pack_versions for select to anon,authenticated using(available_at is not null);

-- Supabase projects may define permissive default grants; start from no API access.
revoke all on all tables in schema public from anon, authenticated;
-- Restrict writes to profile fields and elevated roles to trusted server workflows.
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update(display_name,updated_at) on public.profiles to authenticated;
grant select, update on public.student_profiles to authenticated;
grant select, insert, update, delete on public.student_subjects,public.study_goals,public.study_plan_items,public.question_attempts,public.mistakes,public.cbt_sessions to authenticated;
grant select on public.topic_mastery,public.notifications,public.cbt_results to authenticated;
grant select on public.topics,public.questions,public.cbt_packs,public.cbt_pack_versions to anon,authenticated;
grant update(read_at) on public.notifications to authenticated;

-- Onboarding changes are applied in one transaction and always to auth.uid().
create or replace function public.save_student_onboarding(
  p_display_name text,
  p_exam text,
  p_target_score integer,
  p_study_minutes smallint,
  p_subjects text[],
  p_preferences jsonb default '{}'::jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare current_user_id uuid := auth.uid();
        target_goal_id uuid;
begin
  if current_user_id is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if char_length(trim(p_display_name)) not between 2 and 80 then raise exception 'invalid display name' using errcode = '22023'; end if;
  if p_exam not in ('JAMB','WAEC','NECO','BECE') then raise exception 'invalid exam' using errcode = '22023'; end if;
  if p_target_score < 0 or p_target_score > 1000 or p_study_minutes < 0 or p_study_minutes > 1440 then raise exception 'invalid study target' using errcode = '22023'; end if;
  if coalesce(array_length(p_subjects,1),0) not between 1 and 8 then raise exception 'choose one to eight subjects' using errcode = '22023'; end if;
  update public.profiles set display_name = trim(p_display_name), updated_at = now() where user_id = current_user_id;
  update public.student_profiles set exam = p_exam, target_score = p_target_score, study_minutes_per_day = p_study_minutes,
    preferences = coalesce(p_preferences,'{}'::jsonb), onboarding_completed_at = now(), updated_at = now()
    where user_id = current_user_id;
  update public.study_goals set target_value = p_target_score, updated_at = now()
    where student_id = current_user_id and title = 'Exam target' and status = 'active'
    returning id into target_goal_id;
  if target_goal_id is null then
    insert into public.study_goals(student_id,title,target_value,status) values(current_user_id,'Exam target',p_target_score,'active');
  end if;
  delete from public.student_subjects where student_id = current_user_id;
  insert into public.student_subjects(student_id,exam,subject)
    select current_user_id,p_exam,trim(subject) from unnest(p_subjects) as subject
    where char_length(trim(subject)) between 1 and 80
    on conflict do nothing;
  if (select count(*) from public.student_subjects where student_id=current_user_id and exam=p_exam) = 0 then
    raise exception 'no valid subjects supplied' using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.save_student_onboarding(text,text,integer,smallint,text[],jsonb) from public, anon;
grant execute on function public.save_student_onboarding(text,text,integer,smallint,text[],jsonb) to authenticated;
