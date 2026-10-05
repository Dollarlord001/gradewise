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
alter table public.questions
  add column if not exists source text,
  add column if not exists source_id text,
  add column if not exists subtopic text,
  add column if not exists syllabus_objective text,
  add column if not exists images jsonb not null default '[]'::jsonb,
  add column if not exists passage text,
  add column if not exists rights_evidence text;
alter table public.topics add column if not exists is_official boolean not null default false;
alter table public.topics add column if not exists syllabus_source text;
alter table public.topics add column if not exists official_reference_url text;
alter table public.topics add column if not exists official_revision text;
alter table public.topics add column if not exists syllabus_objective text;
alter table public.topics add column if not exists sort_order smallint;
alter table public.topics add constraint topics_official_source_check check(not is_official or (syllabus_source='JAMB IBASS' and official_reference_url is not null and official_reference_url like 'https://ibass.jamb.gov.ng/%'));
alter table public.topics drop constraint if exists topics_exam_subject_name_key;
create unique index if not exists topics_hierarchy_uidx on public.topics(exam,subject,coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid),name);
create index if not exists topics_official_subject_idx on public.topics(exam,subject,name) where is_official;
create unique index if not exists questions_source_id_uidx on public.questions(source,source_id) where source is not null and source_id is not null;
drop index if exists public.questions_exam_year_subject_paper_number_uidx;
create unique index questions_exam_year_subject_paper_number_uidx on public.questions(exam,coalesce(year,0),subject,coalesce(paper,''),question_number) where source is null;
create index if not exists questions_verified_pool_idx on public.questions(exam,subject,topic_id,year) where verification_status='verified';
create index if not exists questions_live_pool_rotation_idx on public.questions(exam,subject,id) where verification_status='verified' and rights_status in ('owned','licensed','public_domain','permission_granted');
create index if not exists questions_live_topic_pool_rotation_idx on public.questions(exam,subject,topic_id,id) where verification_status='verified' and rights_status in ('owned','licensed','public_domain','permission_granted');
create table if not exists public.offline_content_versions (
  exam text primary key, version bigint not null default 1 check(version>0), updated_at timestamptz not null default now()
);
insert into public.offline_content_versions(exam,version) values('JAMB',1) on conflict(exam) do nothing;
alter table public.offline_content_versions enable row level security;
create policy "content versions read" on public.offline_content_versions for select to authenticated using(true);
grant select on public.offline_content_versions to authenticated;
create or replace function public.publish_cbt_question(
  p_source text,p_source_id text,p_exam text,p_subject text,p_reviewer uuid,
  p_rights_status text,p_rights_evidence text,p_topic_id uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_question public.questions%rowtype;
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'content publishing requires the server service role' using errcode='42501'; end if;
  if p_reviewer is null or p_rights_status is null or p_rights_status not in ('owned','licensed','public_domain','permission_granted') or length(trim(coalesce(p_rights_evidence,''))) < 12 then
    raise exception 'reviewer, supported rights status and evidence are required' using errcode='22023';
  end if;
  select * into v_question from public.questions where source=p_source and source_id=p_source_id and exam=p_exam and subject=p_subject for update;
  if not found then raise exception 'source question not found' using errcode='P0002'; end if;
  if coalesce(jsonb_typeof(v_question.options)<>'object',true) or v_question.correct_answer is null or not (v_question.options ? lower(v_question.correct_answer #>> '{}')) then
    raise exception 'question options and correct answer do not validate' using errcode='22023';
  end if;
  if p_topic_id is not null and not exists(select 1 from public.topics t where t.id=p_topic_id and t.exam=p_exam and t.subject=p_subject and t.is_official and t.syllabus_source='JAMB IBASS' and t.official_reference_url like 'https://ibass.jamb.gov.ng/%') then
    raise exception 'topic must be an applicable official IBASS topic' using errcode='22023';
  end if;
  update public.questions set verification_status='verified',rights_status=p_rights_status,rights_evidence=trim(p_rights_evidence),reviewed_by=p_reviewer,last_reviewed_at=now(),topic_id=p_topic_id,updated_at=now() where id=v_question.id;
  insert into public.offline_content_versions(exam,version) values(p_exam,1)
  on conflict(exam) do update set version=public.offline_content_versions.version+1,updated_at=now();
end;
$$;
revoke all on function public.publish_cbt_question(text,text,text,text,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.publish_cbt_question(text,text,text,text,uuid,text,text,uuid) to service_role;
drop policy if exists "verified questions read" on public.questions;
create policy "verified questions authenticated read" on public.questions for select to authenticated using(verification_status='verified' and rights_status in ('owned','licensed','public_domain','permission_granted'));
revoke select on public.questions from anon;
grant select on public.questions to authenticated;

alter table public.cbt_sessions alter column pack_version_id drop not null;
alter table public.cbt_sessions add column if not exists mode text not null default 'full' check(mode in ('practice','full'));
alter table public.cbt_sessions add column if not exists random_seed text;
alter table public.cbt_sessions add column if not exists question_order jsonb not null default '[]'::jsonb;
alter table public.cbt_sessions add column if not exists option_order jsonb not null default '{}'::jsonb;
alter table public.cbt_sessions add column if not exists form_fingerprint text;
alter table public.cbt_sessions add column if not exists subjects jsonb not null default '[]'::jsonb;
alter table public.cbt_sessions add column if not exists answer_state jsonb not null default '{}'::jsonb;
alter table public.cbt_sessions add column if not exists mark_state jsonb not null default '[]'::jsonb;
create unique index if not exists cbt_sessions_student_form_uidx on public.cbt_sessions(student_id,form_fingerprint) where form_fingerprint is not null;

alter table public.question_attempts add column if not exists session_id uuid references public.cbt_sessions(id) on delete cascade;
alter table public.question_attempts add constraint question_attempts_session_question_uidx unique(student_id,session_id,question_id);
alter table public.mistakes add column if not exists selected_answer jsonb;
alter table public.mistakes add column if not exists correct_answer jsonb;
alter table public.mistakes add column if not exists times_missed integer not null default 1 check(times_missed > 0);
alter table public.mistakes add column if not exists first_seen timestamptz not null default now();
alter table public.mistakes add column if not exists last_seen timestamptz not null default now();

create table if not exists public.student_progress (
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  exam text not null, subject text not null, attempts integer not null default 0 check(attempts>=0),
  correct integer not null default 0 check(correct>=0), updated_at timestamptz not null default now(),
  primary key(student_id,exam,subject)
);
alter table public.student_progress enable row level security;
create policy "progress own" on public.student_progress for select to authenticated using(student_id=(select auth.uid()));
grant select on public.student_progress to authenticated;
drop policy if exists "attempts own" on public.question_attempts;
create policy "attempts read own" on public.question_attempts for select to authenticated using(student_id=(select auth.uid()));
drop policy if exists "mistakes own" on public.mistakes;
create policy "mistakes read own" on public.mistakes for select to authenticated using(student_id=(select auth.uid()));
drop policy if exists "cbt sessions own" on public.cbt_sessions;
create policy "cbt sessions read own" on public.cbt_sessions for select to authenticated using(student_id=(select auth.uid()));
revoke insert,update,delete on public.question_attempts,public.mistakes,public.cbt_sessions,public.cbt_results,public.topic_mastery,public.student_progress from authenticated;
grant select on public.question_attempts,public.mistakes,public.cbt_sessions,public.cbt_results,public.topic_mastery,public.student_progress to authenticated;

create or replace function public.sync_cbt_attempt(
  p_session_id uuid, p_idempotency_key uuid, p_started_at timestamptz, p_duration_seconds integer,
  p_submitted_at timestamptz, p_mode text, p_subjects jsonb, p_random_seed text,
  p_question_order jsonb, p_option_order jsonb, p_form_fingerprint text,
  p_answers jsonb, p_marks jsonb, p_responses jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := auth.uid(); v_session uuid; v_response jsonb; v_question public.questions%rowtype; v_session_fingerprint text;
  v_answer text; v_correct boolean; v_attempt uuid; v_result jsonb := '[]'::jsonb;
  v_correct_count integer := 0; v_incorrect_count integer := 0;
begin
  if v_student is null then raise exception 'authentication required' using errcode='28000'; end if;
  if p_mode not in ('full','practice') or jsonb_array_length(p_question_order) not between 1 and 180
    or jsonb_array_length(p_responses) <> jsonb_array_length(p_question_order)
    or (p_mode='full' and (p_duration_seconds <> 7200 or jsonb_array_length(p_question_order) <> 180 or jsonb_array_length(p_subjects) <> 4))
    or (p_mode='practice' and (jsonb_array_length(p_question_order) > 40 or jsonb_array_length(p_subjects) <> 1 or p_duration_seconds < 60 or p_duration_seconds > 86400)) then
    raise exception 'invalid examination form' using errcode='22023';
  end if;
  if (select count(distinct value) from jsonb_array_elements_text(p_question_order)) <> jsonb_array_length(p_question_order) then
    raise exception 'duplicate question IDs in form' using errcode='22023';
  end if;
  if p_mode='full' and (
    (select count(*) from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where q.subject='Use of English') <> 60
    or exists(select q.subject from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where q.subject<>'Use of English' group by q.subject having count(*)<>40)
    or (select count(distinct q.subject) from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid) <> 4
    or not (p_subjects ? 'Use of English')
    or exists(select 1 from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where not (p_subjects ? q.subject))
  ) then raise exception 'full examination subject counts are invalid' using errcode='22023'; end if;
  if p_mode='practice' and exists(select 1 from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where q.subject<>p_subjects->>0) then
    raise exception 'practice subject does not match the selected questions' using errcode='22023';
  end if;
  insert into public.cbt_sessions(id,student_id,pack_version_id,idempotency_key,started_at,duration_seconds,submitted_at,mode,random_seed,question_order,option_order,form_fingerprint,subjects,answer_state,mark_state)
  values(p_session_id,v_student,null,p_idempotency_key,p_started_at,p_duration_seconds,p_submitted_at,p_mode,p_random_seed,p_question_order,p_option_order,p_form_fingerprint,p_subjects,p_answers,p_marks)
  on conflict(student_id,idempotency_key) do nothing returning id into v_session;
  if v_session is null then select id into v_session from public.cbt_sessions where student_id=v_student and idempotency_key=p_idempotency_key; end if;
  select form_fingerprint into v_session_fingerprint from public.cbt_sessions where id=v_session;
  if v_session_fingerprint is distinct from p_form_fingerprint then raise exception 'idempotency key is already bound to a different form' using errcode='22023'; end if;
  if exists(select 1 from public.cbt_results where session_id=v_session) then return jsonb_build_object('synced',true,'duplicate',true); end if;
  for v_response in select value from jsonb_array_elements(p_responses) loop
    if not (p_question_order ? (v_response->>'questionId')) then raise exception 'response question is outside the fixed form' using errcode='22023'; end if;
    select * into v_question from public.questions where id=(v_response->>'questionId')::uuid and verification_status='verified' and rights_status in ('owned','licensed','public_domain','permission_granted');
    if not found then raise exception 'question is unavailable for scoring' using errcode='22023'; end if;
    v_answer := nullif(v_response->>'selectedAnswer','');
    v_correct := v_answer is not null and v_question.correct_answer=to_jsonb(v_answer);
    if v_correct then v_correct_count:=v_correct_count+1; elsif v_answer is not null then v_incorrect_count:=v_incorrect_count+1; end if;
    insert into public.question_attempts(student_id,question_id,selected_answer,is_correct,source,idempotency_key,session_id)
    values(v_student,v_question.id,case when v_answer is null then null else to_jsonb(v_answer) end,v_correct,case when p_mode='full' then 'full_exam' else 'practice' end,null,v_session)
    on conflict(student_id,session_id,question_id) do nothing returning id into v_attempt;
    if found then
      if not v_correct and v_answer is not null then
        insert into public.mistakes(student_id,question_id,latest_attempt_id,selected_answer,correct_answer,times_missed,first_seen,last_seen,review_status)
        values(v_student,v_question.id,v_attempt,to_jsonb(v_answer),v_question.correct_answer,1,p_started_at,p_submitted_at,'to_review')
        on conflict(student_id,question_id) do update set latest_attempt_id=excluded.latest_attempt_id,selected_answer=excluded.selected_answer,correct_answer=excluded.correct_answer,times_missed=public.mistakes.times_missed+1,last_seen=excluded.last_seen,review_status='to_review',updated_at=now();
      end if;
      insert into public.student_progress(student_id,exam,subject,attempts,correct) values(v_student,v_question.exam,v_question.subject,1,case when v_correct then 1 else 0 end)
      on conflict(student_id,exam,subject) do update set attempts=public.student_progress.attempts+1,correct=public.student_progress.correct+excluded.correct,updated_at=now();
      if v_question.topic_id is not null and exists(select 1 from public.topics where id=v_question.topic_id and is_official and syllabus_source='JAMB IBASS' and official_reference_url like 'https://ibass.jamb.gov.ng/%') then
        insert into public.topic_mastery(student_id,topic_id,mastery) select v_student,v_question.topic_id,least(100,round(100.0*count(*) filter(where is_correct)/nullif(count(*),0))::smallint) from public.question_attempts where student_id=v_student and question_id in (select id from public.questions where topic_id=v_question.topic_id)
        on conflict(student_id,topic_id) do update set mastery=excluded.mastery,updated_at=now();
      end if;
    end if;
    v_result:=v_result||jsonb_build_array(jsonb_build_object('questionId',v_question.id,'selectedAnswer',v_answer,'correct',v_correct,'subject',v_question.subject,'topicId',v_question.topic_id));
  end loop;
  insert into public.cbt_results(session_id,student_id,score,answer_payload) values(v_session,v_student,v_correct_count,jsonb_build_object('responses',v_result,'correct',v_correct_count,'incorrect',v_incorrect_count,'unanswered',jsonb_array_length(p_question_order)-v_correct_count-v_incorrect_count)) on conflict(session_id) do nothing;
  return jsonb_build_object('synced',true,'correct',v_correct_count,'incorrect',v_incorrect_count,'unanswered',jsonb_array_length(p_question_order)-v_correct_count-v_incorrect_count);
end;
$$;
revoke all on function public.sync_cbt_attempt(uuid,uuid,timestamptz,integer,timestamptz,text,jsonb,text,jsonb,jsonb,text,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.sync_cbt_attempt(uuid,uuid,timestamptz,integer,timestamptz,text,jsonb,text,jsonb,jsonb,text,jsonb,jsonb,jsonb) to authenticated;
-- Legacy ALOC rows do not include a printed question number. Preserve that
-- absence instead of manufacturing one during import.
alter table public.questions alter column question_number drop not null;
alter table public.questions drop constraint if exists questions_question_number_check;
alter table public.questions add constraint questions_question_number_check
  check (question_number is null or question_number > 0);
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
-- Firebase is the external identity provider. Internal student UUIDs and all
-- existing student-owned foreign keys remain unchanged.
create table if not exists public.firebase_identities (
  firebase_uid text primary key,
  student_id uuid not null unique references public.student_profiles(user_id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table public.firebase_identities enable row level security;
revoke all on public.firebase_identities from anon, authenticated;

-- Profiles were historically linked to Supabase Auth. Keep those rows and
-- their UUIDs, but allow new Firebase-only accounts to receive an internal UUID.
alter table public.profiles drop constraint if exists profiles_user_id_fkey;

create or replace function public.resolve_firebase_student()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid text := auth.jwt()->>'sub';
  v_email text := lower(nullif(auth.jwt()->>'email',''));
  v_verified boolean := coalesce((auth.jwt()->>'email_verified')::boolean,false);
  v_student uuid;
  v_name text := left(coalesce(nullif(trim(auth.jwt()->>'name'),''),'Student'),80);
begin
  if v_uid is null or v_uid = '' then raise exception 'authentication required' using errcode='28000'; end if;
  select student_id into v_student from public.firebase_identities where firebase_uid=v_uid;
  if v_student is null and v_verified and v_email is not null then
    -- Link an existing student only through a verified Firebase email.
    select p.user_id into v_student from auth.users u
      join public.profiles p on p.user_id=u.id
      where lower(u.email)=v_email order by p.created_at limit 1;
  end if;
  if v_student is null then
    v_student := gen_random_uuid();
    insert into public.profiles(user_id,display_name) values(v_student,v_name);
    insert into public.student_profiles(user_id) values(v_student);
  end if;
  insert into public.firebase_identities(firebase_uid,student_id,email,last_seen_at)
    values(v_uid,v_student,v_email,now())
    on conflict(firebase_uid) do update set email=excluded.email,last_seen_at=now();
  return v_student;
end;
$$;
revoke all on function public.resolve_firebase_student() from public, anon;
grant execute on function public.resolve_firebase_student() to authenticated;

create or replace function public.current_student_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select i.student_id from public.firebase_identities i where i.firebase_uid=auth.jwt()->>'sub'
$$;
revoke all on function public.current_student_id() from public, anon;
grant execute on function public.current_student_id() to authenticated;

drop policy if exists "profile read own" on public.profiles;
drop policy if exists "profile update own non-role" on public.profiles;
drop policy if exists "student profile own" on public.student_profiles;
drop policy if exists "subjects own" on public.student_subjects;
drop policy if exists "goals own" on public.study_goals;
drop policy if exists "plan own" on public.study_plan_items;
drop policy if exists "mastery read own" on public.topic_mastery;
drop policy if exists "attempts own" on public.question_attempts;
drop policy if exists "attempts read own" on public.question_attempts;
drop policy if exists "mistakes own" on public.mistakes;
drop policy if exists "mistakes read own" on public.mistakes;
drop policy if exists "notifications own" on public.notifications;
drop policy if exists "notifications own update" on public.notifications;
drop policy if exists "cbt sessions own" on public.cbt_sessions;
drop policy if exists "cbt sessions read own" on public.cbt_sessions;
drop policy if exists "cbt results own" on public.cbt_results;
drop policy if exists "progress own" on public.student_progress;

create policy "firebase profile read own" on public.profiles for select to authenticated using(user_id=public.current_student_id());
create policy "firebase profile update own" on public.profiles for update to authenticated using(user_id=public.current_student_id()) with check(user_id=public.current_student_id() and role='student');
create policy "firebase student profile own" on public.student_profiles for all to authenticated using(user_id=public.current_student_id()) with check(user_id=public.current_student_id());
create policy "firebase subjects own" on public.student_subjects for all to authenticated using(student_id=public.current_student_id()) with check(student_id=public.current_student_id());
create policy "firebase goals own" on public.study_goals for all to authenticated using(student_id=public.current_student_id()) with check(student_id=public.current_student_id());
create policy "firebase plan own" on public.study_plan_items for all to authenticated using(student_id=public.current_student_id()) with check(student_id=public.current_student_id());
create policy "firebase mastery own" on public.topic_mastery for select to authenticated using(student_id=public.current_student_id());
create policy "firebase attempts own" on public.question_attempts for select to authenticated using(student_id=public.current_student_id());
create policy "firebase mistakes own" on public.mistakes for select to authenticated using(student_id=public.current_student_id());
create policy "firebase notifications own" on public.notifications for select to authenticated using(student_id=public.current_student_id());
create policy "firebase notifications update own" on public.notifications for update to authenticated using(student_id=public.current_student_id()) with check(student_id=public.current_student_id());
create policy "firebase sessions own" on public.cbt_sessions for select to authenticated using(student_id=public.current_student_id());
create policy "firebase results own" on public.cbt_results for select to authenticated using(student_id=public.current_student_id());
create policy "firebase progress own" on public.student_progress for select to authenticated using(student_id=public.current_student_id());

-- Existing transactional RPCs continue to write only for the mapped internal UUID.
-- Supabase's Firebase third-party auth provider validates the bearer ID token and
-- supplies the Firebase UID in the JWT sub claim used above.


-- Preserve the original validated transactional behavior, scoped through the Firebase UUID mapping.
create or replace function public.save_student_onboarding(
  p_display_name text,
  p_exam text,
  p_target_score integer,
  p_study_minutes smallint,
  p_subjects text[],
  p_preferences jsonb default '{}'::jsonb
) returns void
language plpgsql security invoker set search_path = '' as $$
declare current_user_id uuid := public.current_student_id();
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


-- Preserve the original validated transactional behavior, scoped through the Firebase UUID mapping.
create or replace function public.sync_cbt_attempt(
  p_session_id uuid, p_idempotency_key uuid, p_started_at timestamptz, p_duration_seconds integer,
  p_submitted_at timestamptz, p_mode text, p_subjects jsonb, p_random_seed text,
  p_question_order jsonb, p_option_order jsonb, p_form_fingerprint text,
  p_answers jsonb, p_marks jsonb, p_responses jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := public.current_student_id(); v_session uuid; v_response jsonb; v_question public.questions%rowtype; v_session_fingerprint text;
  v_answer text; v_correct boolean; v_attempt uuid; v_result jsonb := '[]'::jsonb;
  v_correct_count integer := 0; v_incorrect_count integer := 0;
begin
  if v_student is null then raise exception 'authentication required' using errcode='28000'; end if;
  if p_mode not in ('full','practice') or jsonb_array_length(p_question_order) not between 1 and 180
    or jsonb_array_length(p_responses) <> jsonb_array_length(p_question_order)
    or (p_mode='full' and (p_duration_seconds <> 7200 or jsonb_array_length(p_question_order) <> 180 or jsonb_array_length(p_subjects) <> 4))
    or (p_mode='practice' and (jsonb_array_length(p_question_order) > 40 or jsonb_array_length(p_subjects) <> 1 or p_duration_seconds < 60 or p_duration_seconds > 86400)) then
    raise exception 'invalid examination form' using errcode='22023';
  end if;
  if (select count(distinct value) from jsonb_array_elements_text(p_question_order)) <> jsonb_array_length(p_question_order) then
    raise exception 'duplicate question IDs in form' using errcode='22023';
  end if;
  if p_mode='full' and (
    (select count(*) from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where q.subject='Use of English') <> 60
    or exists(select q.subject from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where q.subject<>'Use of English' group by q.subject having count(*)<>40)
    or (select count(distinct q.subject) from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid) <> 4
    or not (p_subjects ? 'Use of English')
    or exists(select 1 from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where not (p_subjects ? q.subject))
  ) then raise exception 'full examination subject counts are invalid' using errcode='22023'; end if;
  if p_mode='practice' and exists(select 1 from jsonb_array_elements_text(p_question_order) ids(value) join public.questions q on q.id=ids.value::uuid where q.subject<>p_subjects->>0) then
    raise exception 'practice subject does not match the selected questions' using errcode='22023';
  end if;
  insert into public.cbt_sessions(id,student_id,pack_version_id,idempotency_key,started_at,duration_seconds,submitted_at,mode,random_seed,question_order,option_order,form_fingerprint,subjects,answer_state,mark_state)
  values(p_session_id,v_student,null,p_idempotency_key,p_started_at,p_duration_seconds,p_submitted_at,p_mode,p_random_seed,p_question_order,p_option_order,p_form_fingerprint,p_subjects,p_answers,p_marks)
  on conflict(student_id,idempotency_key) do nothing returning id into v_session;
  if v_session is null then select id into v_session from public.cbt_sessions where student_id=v_student and idempotency_key=p_idempotency_key; end if;
  select form_fingerprint into v_session_fingerprint from public.cbt_sessions where id=v_session;
  if v_session_fingerprint is distinct from p_form_fingerprint then raise exception 'idempotency key is already bound to a different form' using errcode='22023'; end if;
  if exists(select 1 from public.cbt_results where session_id=v_session) then return jsonb_build_object('synced',true,'duplicate',true); end if;
  for v_response in select value from jsonb_array_elements(p_responses) loop
    if not (p_question_order ? (v_response->>'questionId')) then raise exception 'response question is outside the fixed form' using errcode='22023'; end if;
    select * into v_question from public.questions where id=(v_response->>'questionId')::uuid and verification_status='verified' and rights_status in ('owned','licensed','public_domain','permission_granted');
    if not found then raise exception 'question is unavailable for scoring' using errcode='22023'; end if;
    v_answer := nullif(v_response->>'selectedAnswer','');
    v_correct := v_answer is not null and v_question.correct_answer=to_jsonb(v_answer);
    if v_correct then v_correct_count:=v_correct_count+1; elsif v_answer is not null then v_incorrect_count:=v_incorrect_count+1; end if;
    insert into public.question_attempts(student_id,question_id,selected_answer,is_correct,source,idempotency_key,session_id)
    values(v_student,v_question.id,case when v_answer is null then null else to_jsonb(v_answer) end,v_correct,case when p_mode='full' then 'full_exam' else 'practice' end,null,v_session)
    on conflict(student_id,session_id,question_id) do nothing returning id into v_attempt;
    if found then
      if not v_correct and v_answer is not null then
        insert into public.mistakes(student_id,question_id,latest_attempt_id,selected_answer,correct_answer,times_missed,first_seen,last_seen,review_status)
        values(v_student,v_question.id,v_attempt,to_jsonb(v_answer),v_question.correct_answer,1,p_started_at,p_submitted_at,'to_review')
        on conflict(student_id,question_id) do update set latest_attempt_id=excluded.latest_attempt_id,selected_answer=excluded.selected_answer,correct_answer=excluded.correct_answer,times_missed=public.mistakes.times_missed+1,last_seen=excluded.last_seen,review_status='to_review',updated_at=now();
      end if;
      insert into public.student_progress(student_id,exam,subject,attempts,correct) values(v_student,v_question.exam,v_question.subject,1,case when v_correct then 1 else 0 end)
      on conflict(student_id,exam,subject) do update set attempts=public.student_progress.attempts+1,correct=public.student_progress.correct+excluded.correct,updated_at=now();
      if v_question.topic_id is not null and exists(select 1 from public.topics where id=v_question.topic_id and is_official and syllabus_source='JAMB IBASS' and official_reference_url like 'https://ibass.jamb.gov.ng/%') then
        insert into public.topic_mastery(student_id,topic_id,mastery) select v_student,v_question.topic_id,least(100,round(100.0*count(*) filter(where is_correct)/nullif(count(*),0))::smallint) from public.question_attempts where student_id=v_student and question_id in (select id from public.questions where topic_id=v_question.topic_id)
        on conflict(student_id,topic_id) do update set mastery=excluded.mastery,updated_at=now();
      end if;
    end if;
    v_result:=v_result||jsonb_build_array(jsonb_build_object('questionId',v_question.id,'selectedAnswer',v_answer,'correct',v_correct,'subject',v_question.subject,'topicId',v_question.topic_id));
  end loop;
  insert into public.cbt_results(session_id,student_id,score,answer_payload) values(v_session,v_student,v_correct_count,jsonb_build_object('responses',v_result,'correct',v_correct_count,'incorrect',v_incorrect_count,'unanswered',jsonb_array_length(p_question_order)-v_correct_count-v_incorrect_count)) on conflict(session_id) do nothing;
  return jsonb_build_object('synced',true,'correct',v_correct_count,'incorrect',v_incorrect_count,'unanswered',jsonb_array_length(p_question_order)-v_correct_count-v_incorrect_count);
end;
$$;
