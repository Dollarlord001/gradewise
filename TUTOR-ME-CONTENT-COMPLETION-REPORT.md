# TUTOR-ME Content Completion Report

Generated: 2026-10-03T21:01:46.459Z

## Question bank

- Authentic authorized: **5091**
- Original TUTOR-ME generated: **0**
- Total production-ready unique: **5091**
- 200,000 target: **not met** (deficit 194909)
- Duplicates: **165**
- Rejected: **77**
- Quarantined: **10**
- Verification: structural validation only; semantic correctness is not claimed.

## Subject floors

| Subject | Authentic | Generated | Total | Floor | Shortfall |
|---|---:|---:|---:|---:|---:|
| English Language | 535 | 0 | 535 | 1500 | 965 |
| Mathematics | 25 | 0 | 25 | 1500 | 1475 |
| Biology | 429 | 0 | 429 | 1200 | 771 |
| Chemistry | 356 | 0 | 356 | 1200 | 844 |
| Physics | 179 | 0 | 179 | 1500 | 1321 |
| Agricultural Science | 0 | 0 | 0 | 1000 | 1000 |
| Economics | 510 | 0 | 510 | 1200 | 690 |
| Government | 506 | 0 | 506 | 1200 | 694 |
| Geography | 15 | 0 | 15 | 1000 | 985 |
| Literature in English | 185 | 0 | 185 | 1000 | 815 |
| Commerce | 878 | 0 | 878 | 1000 | 122 |
| CRK | 499 | 0 | 499 | 1000 | 501 |
| Accounting | 442 | 0 | 442 | 1200 | 758 |
| Further Mathematics | 0 | 0 | 0 | 1000 | 1000 |
| Computer Science | 0 | 0 | 0 | 1000 | 1000 |
| Civic Education | 432 | 0 | 432 | 1000 | 568 |
| Animal Husbandry | 0 | 0 | 0 | 1000 | 1000 |
| IRK | 0 | 0 | 0 | 1000 | 1000 |
| Arabic | 0 | 0 | 0 | 1000 | 1000 |
| History | 0 | 0 | 0 | 1000 | 1000 |
| Home Economics | 0 | 0 | 0 | 1000 | 1000 |
| Insurance | 100 | 0 | 100 | 800 | 700 |
| Current Affairs | 0 | 0 | 0 | 500 | 500 |
| Fine Art | 0 | 0 | 0 | 500 | 500 |
| Music | 0 | 0 | 0 | 500 | 500 |
| Hausa | 0 | 0 | 0 | 1000 | 1000 |
| Igbo | 0 | 0 | 0 | 1000 | 1000 |
| Yoruba | 0 | 0 | 0 | 1000 | 1000 |

28 subjects are listed.

## Sources

| Source | Questions in production bank |
|---|---:|
| ALOC question database | 4682 |
| ALOC Station | 218 |
| SdashAPI | 191 |

ALOC and Sdash had live authorized requests; successful batches and cursor checkpoints are in `content/acquired/` and `output/checkpoints/`. The acquisition inventory lists AskQuestions.ng and ExamVora as authorized, but contains no official access URL, export, API contract, or machine-readable package. No content is attributed to them.

### Checkpoints

| Source | Filter | Last batch | State | Acquired | Accepted | Rejected | Duplicate | API usage | Error |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=accounting&examType=jamb&limit=15 | 1 | partial | 15 | 12 | 0 | 3 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=agricultural%20science&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=animal%20husbandry&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=arabic&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=biology&examType=jamb&limit=15 | 2 | partial | 30 | 0 | 1 | 29 | 2 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=chemistry&examType=jamb&limit=15 | 2 | partial | 30 | 17 | 0 | 13 | 2 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=civic%20education&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=commerce&examType=jamb&limit=15 | 1 | partial | 15 | 0 | 0 | 15 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=computer%20science&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=crk&examType=jamb&limit=15 | 1 | partial | 15 | 2 | 0 | 13 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=current%20affairs&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=economics&examType=jamb&limit=15 | 2 | partial | 30 | 0 | 0 | 30 | 2 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=english&examType=jamb&limit=15 | 1 | partial | 15 | 6 | 4 | 7 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=english%20language&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=fine%20art&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=further%20mathematics&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=geography&examType=jamb&limit=15 | 1 | partial | 15 | 15 | 0 | 0 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=government&examType=jamb&limit=15 | 1 | partial | 15 | 10 | 0 | 5 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=hausa&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=history&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=home%20economics&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=igbo&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=insurance&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=irk&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=literature%20in%20english&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=mathematics&examType=jamb&limit=15 | 2 | partial | 30 | 25 | 5 | 0 | 2 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=music&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=physics&examType=jamb&limit=15 | 9 | partial | 135 | 131 | 4 | 0 | 9 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=yoruba&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=accounting&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=agricultural%20science&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 404); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=animal%20husbandry&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=arabic&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=biology&examType=jamb&limit=50 | 1 | complete | 50 | 50 | 0 | 0 | 1 |  |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=chemistry&examType=jamb&limit=50 | 1 | complete | 50 | 48 | 1 | 1 | 1 |  |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=civic%20education&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=commerce&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=computer%20science&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=crk&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=current%20affairs&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=economics&examType=jamb&limit=50 | 1 | complete | 49 | 45 | 3 | 1 | 1 |  |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=english&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=english%20language&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 404); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=fine%20art&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=further%20mathematics&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=geography&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=government&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=hausa&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=history&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=home%20economics&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=igbo&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=insurance&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=irk&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=literature%20in%20english&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=mathematics&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=music&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |
| SdashAPI | https://sdashapi.com/api/v1/q?type=utme&limit=50&subject=physics | 1 | complete | 50 | 48 | 2 | 0 | 1 |  |
| SdashAPI | https://sdashapi.com/api/v1/q?subject=yoruba&examType=jamb&limit=50 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights. |

## Digital library

- Total indexed resources: **14**
- Production-ready entries: **14**
- Subject coverage: **{"Mathematics":7,"Physics":4,"Chemistry":4,"Biology":2}**
- Level coverage: **{"College / introductory biology":1,"College / introductory chemistry":1,"College / introductory mathematics":1,"College / introductory physics":1,"Grade 10":3,"Grade 11":2,"Grade 12":2,"Grade 7":1,"Grade 8":1,"Grade 9":1}**
- Reader availability: **14**
- Download permission: **10**
- Rights: **{"OPEN_LICENSE":14}**
- Five resources per applicable subject and level: **not met**. Current catalog is Siyavula Mathematics and science titles plus four OpenStax books. Links point to official readers; OpenStax downloads are disabled in the catalog.

## Database and import

- Content schema migration: `supabase/migrations/202610040001_content_catalog.sql` (prepared; not applied).
- Importer: `scripts/import-content.mjs` (batched, restart-safe ledger; not executed).
- Questions/resources imported: **0 confirmed**.
- Database counts and retrieval checks: **not available**.
- Import tables include question options/topics/sources/provenance/verification, resources/rights/subjects/levels, and import batch ledger.
- Indexes cover subject, exam/year, difficulty, verification/rights, source/time, topic, and resource rights.

## Production status and genuine blockers

The local corpus was normalized and deduplicated from 5343 acquired records into 5091 structurally accepted unique questions. Live ALOC/Sdash results persisted in batches and the duplicate/reject/quarantine ledgers were regenerated. The Supabase environment contains a project URL and publishable key only; no server-only service-role/database credential is configured, so schema application and privileged import/count verification cannot run. Provider keys exist, but no generation module exists and this run did not produce any generated questions. AskQuestions.ng and ExamVora machine-readable access details are absent from the repository. Those external access and privileged database/provider execution paths are unresolved blockers; the 200K and all subject floors are unmet.

- .env.local remains ignored by git.
- Files: `output/questions/*.jsonl`, `output/library/resources.jsonl`, manifests under `output/manifests/`, acquisition report at `output/reports/coverage.json`, duplicates at `output/reports/duplicates.jsonl`, quarantine under `output/quarantine/`.
