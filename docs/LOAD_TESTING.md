# Load testing

## Harness

`load/k6.js` is an executable k6 scenario harness for public pages and the available health/readiness endpoints. It accepts `BASE_URL` and staged virtual-user targets. It does not invent unavailable API routes: dashboard, practice, progress, question retrieval, CBT downloads and AI contract requests are included only after their real endpoint paths are configured. Protected pages need an authenticated test-user flow before dashboard load is representative.

Run a smoke level first against an isolated staging deployment:

```sh
k6 run -e BASE_URL=https://staging.example -e TARGET_VUS=20 load/k6.js
```

The default target stage list is 1k → 10k → 50k → 100k → 200k VUs. Set `RUN_SCALE_STAGES=1` only after safe staging, credentials and capacity monitoring have been reviewed. Do not run the upper stages from an Android/Termux handset. Use distributed k6 Cloud or a coordinated load-generator fleet and ramp gradually. Never point a high-load run at production without an approved window.

## Measurements and initial service objectives

k6 records request rate, p50/p95/p99, checks and errors. Collect matching Vercel function CPU/memory/concurrency, Supabase DB CPU/connections/pool waits, Redis hit rate/latency, queue depth/age, auth/API latency and object CDN hit rate/throughput. This harness cannot read those provider metrics itself; capture them from provider dashboards/exporters with synchronized timestamps.

Suggested initial staging gates (adjust with product SLOs): public cache-hit page p95 < 500 ms and p99 < 1.5 s; authenticated read/API p95 < 800 ms and p99 < 2 s; error rate < 0.5%; no sustained pool exhaustion, queue growth, memory leak or elevated 429 rate for valid traffic. These are proposed thresholds, not results. Test public pages, login with a controlled account, dashboard, bounded question retrieval, practice submission, progress reads, pack download, search, AI contract, DB-heavy and cache-heavy routes separately once implemented.

## Evidence so far

No k6 command was run and no capacity result exists. The current machine is an Android/Termux environment and is not a credible generator for 200,000 virtual users. Use a production-like staging database with realistic indexes/data volume, pooled connections, CDN/cache and managed queue. Record the git SHA, app commit, migration version, test region, generator count, VU stages, duration, dataset and provider metrics with every run. Do not describe the 1M/200k targets as proven capacity.
