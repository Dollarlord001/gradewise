-- Legacy ALOC rows do not include a printed question number. Preserve that
-- absence instead of manufacturing one during import.
alter table public.questions alter column question_number drop not null;
alter table public.questions drop constraint if exists questions_question_number_check;
alter table public.questions add constraint questions_question_number_check
  check (question_number is null or question_number > 0);
