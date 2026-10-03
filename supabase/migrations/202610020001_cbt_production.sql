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
