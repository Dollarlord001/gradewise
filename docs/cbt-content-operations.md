# CBT content operations

Student CBT content is read from verified, rights-cleared rows in `public.questions`. Provider APIs are called only by the content command, with credentials in server environment variables. Students do not call providers.

## Import

Configure `ALOC_API_KEY` or `SDASH_API_KEY` in the server environment. The database import also needs `NEXT_PUBLIC_SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY`.

```sh
npm run content:import -- --provider aloc --exam jamb --subject biology --year 2023
npm run content:import -- --provider sdash --exam utme --subject biology --year 2023 --limit 50
```

The ALOC adapter uses its filtered questions endpoint and cursor pagination. The Sdash adapter uses the documented question endpoint and AccessToken header. Import also accepts `--file` for JSON, JSONL/NDJSON or CSV input:

```sh
npm run content:validate -- --file /path/to/questions.jsonl
npm run content:build -- --file /path/to/questions.jsonl
```

Import normalizes source fields, validates records and duplicate prompts, and upserts by `(source, source_id)`. It records provider provenance but sets `verification_status=pending` and `rights_status=unknown`. Those records are intentionally unavailable to students. A qualified reviewer must verify answer correctness and rights, map any official JAMB topic using the current IBASS syllabus, and record evidence before setting a row to verified and rights-cleared. No automatic answer or topic is inferred.

After reviewing one row against its source and securing rights evidence, publish that row with the reviewer’s Supabase user ID and the recorded rights basis:

```sh
npm run content:publish -- --source ALOC --source-id PROVIDER_ID --exam JAMB --subject Biology --reviewer-id SUPABASE_USER_UUID --answer-verified true --rights-status licensed --rights-evidence 'License reference and permission scope'
```

Add `--topic-id OFFICIAL_TOPIC_UUID` only after mapping the question to an official topic. Publishing checks the matching source record, option/answer consistency, reviewer, rights evidence and official topic match in a transaction. It increments the JAMB content version so clients silently clear stale question caches and refresh them from the verified bank.

For an official JAMB topic, `topics.is_official` can be set only with `syllabus_source='JAMB IBASS'` and a reference under `https://ibass.jamb.gov.ng/`. Topic parents provide the topic/subtopic hierarchy; `syllabus_objective` retains the stated objective. Unclassified questions remain usable only in subject-level practice and full exams.

The content command reports missing credentials or database settings and never creates question rows without a successful provider response or supplied file. The web application does not need provider keys. Run migrations in order before importing or syncing CBT attempts.
