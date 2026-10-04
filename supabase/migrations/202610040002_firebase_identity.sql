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
