# TUTOR-ME Content Completion Report

Generated: 2026-10-03T20:29:00.791Z

## Question bank

- Total acquired: **5251**
- Normalized: **5251**
- Unique after deduplication: **5050**
- Structurally valid: **5050**
- Production ready: **5050**
- Duplicates: **122**
- Rejected: **72**
- Quarantined: **7**
- 200,000 target: **not met** (short by 194950)
- Semantic verification: **pending for all 5050; structure is not semantic review**

### Subject floors

| Subject | Unique production-ready | Floor | Shortfall |
|---|---:|---:|---:|
| English Language | 529 | 1500 | 971 |
| Mathematics | 13 | 1500 | 1487 |
| Biology | 429 | 1200 | 771 |
| Chemistry | 347 | 1200 | 853 |
| Physics | 165 | 1500 | 1335 |
| Agricultural Science | 0 | 1000 | 1000 |
| Economics | 510 | 1200 | 690 |
| Government | 506 | 1200 | 694 |
| Geography | 15 | 1000 | 985 |
| Literature in English | 185 | 1000 | 815 |
| Commerce | 878 | 1000 | 122 |
| CRK | 499 | 1000 | 501 |
| Accounting | 442 | 1200 | 758 |
| Further Mathematics | 0 | 1000 | 1000 |
| Computer Science | 0 | 1000 | 1000 |
| Civic Education | 432 | 1000 | 568 |
| Animal Husbandry | 0 | 1000 | 1000 |
| IRK | 0 | 1000 | 1000 |
| Arabic | 0 | 1000 | 1000 |
| History | 0 | 1000 | 1000 |
| Home Economics | 0 | 1000 | 1000 |
| Insurance | 100 | 800 | 700 |
| Current Affairs | 0 | 500 | 500 |
| Fine Art | 0 | 500 | 500 |
| Music | 0 | 500 | 500 |
| Hausa | 0 | 1000 | 1000 |
| Igbo | 0 | 1000 | 1000 |
| Yoruba | 0 | 1000 | 1000 |

All 28 requested subject floors remain unmet with the available authorized material.

### Exams, years, sources, and rights

Exam totals:

| Exam | Questions |
|---|---:|
| JAMB | 3159 |
| NECO | 265 |
| WAEC | 1626 |

Year coverage:

| Year | Questions |
|---|---:|
| 1988 | 60 |
| 1989 | 58 |
| 1990 | 47 |
| 1997 | 40 |
| 1999 | 48 |
| 2000 | 146 |
| 2001 | 189 |
| 2002 | 81 |
| 2003 | 241 |
| 2004 | 285 |
| 2005 | 304 |
| 2006 | 286 |
| 2007 | 245 |
| 2008 | 255 |
| 2009 | 402 |
| 2010 | 475 |
| 2011 | 243 |
| 2012 | 367 |
| 2013 | 413 |
| 2014 | 240 |
| 2015 | 243 |
| 2016 | 199 |
| 2017 | 12 |
| 2018 | 13 |
| 2019 | 14 |
| 2020 | 11 |
| 2021 | 8 |
| 2022 | 8 |
| 2023 | 55 |
| 2024 | 52 |
| 2025 | 5 |
| 2026 | 5 |

Source totals:

| Source | Questions |
|---|---:|
| ALOC question database | 4682 |
| ALOC Station | 177 |
| SdashAPI | 191 |

Rights totals:

| Rights status | Questions |
|---|---:|
| USER_PROVIDED_AUTHORIZED | 5050 |

Verification status:

| Status | Questions |
|---|---:|
| pending | 5050 |

All topic and subtopic values are unknown in the accepted bank.

## Digital library

- Total resources: **14**
- Production ready: **14**
- Subjects: **{"Mathematics":7,"Physics":4,"Chemistry":4,"Biology":2}**
- Levels: **{"College / introductory biology":1,"College / introductory chemistry":1,"College / introductory mathematics":1,"College / introductory physics":1,"Grade 10":3,"Grade 11":2,"Grade 12":2,"Grade 7":1,"Grade 8":1,"Grade 9":1}**
- Types: **{"open_textbook":14}**
- Rights: **{"OPEN_LICENSE":14}**
- Official reader access: **14**
- Download permitted: **10**
- Coverage target: 5 resources per applicable subject/level; not met. Current catalog contains Siyavula Mathematics (Grades 7–12), Siyavula Physical Sciences (Grades 10–12), Siyavula Life Sciences Grade 10, and four OpenStax introductory books.
- Missing or partial subject coverage: English Language (missing; 0 indexed resources), Mathematics (partial; 7 indexed resources), Biology (partial; 2 indexed resources), Chemistry (partial; 4 indexed resources), Physics (partial; 4 indexed resources), Agricultural Science (missing; 0 indexed resources), Economics (missing; 0 indexed resources), Government (missing; 0 indexed resources), Geography (missing; 0 indexed resources), Literature in English (missing; 0 indexed resources), Commerce (missing; 0 indexed resources), CRK (missing; 0 indexed resources), Accounting (missing; 0 indexed resources), Further Mathematics (missing; 0 indexed resources), Computer Science (missing; 0 indexed resources), Civic Education (missing; 0 indexed resources), Animal Husbandry (missing; 0 indexed resources), IRK (missing; 0 indexed resources), Arabic (missing; 0 indexed resources), History (missing; 0 indexed resources), Home Economics (missing; 0 indexed resources), Insurance (missing; 0 indexed resources), Current Affairs (missing; 0 indexed resources), Fine Art (missing; 0 indexed resources), Music (missing; 0 indexed resources), Hausa (missing; 0 indexed resources), Igbo (missing; 0 indexed resources), Yoruba (missing; 0 indexed resources). The indexed levels do not establish five resources at each JSS/SS level.
- OpenStax links use the official reader and downloads are disabled; Siyavula reader links are official. Resource metadata preserves license/attribution notes.

## API and checkpoint state

- Observed API credit/request usage: **21** in completed provider checkpoints. ALOC checkpoints retain response headers; successful subject batches report 82–91 credits remaining and 22–28 rate-limit requests remaining. Sdash did not provide quota headers.
- Sdash v1 acquisition is cached as one batch per successful subject checkpoint because the endpoint does not expose stable page cursors.
- ALOC cursor batches are retained and resumable. Checkpoints are stored in `output/checkpoints/`; raw downloaded batches remain under `content/acquired/`.
- A second Sdash biology harvest was executed and returned `already-complete`, with no batch request; this verified repeat suppression.
- Permanent HTTP authorization/filter failures are marked `permanent_error` and future runs skip those subject requests. Failed filters/access: ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; ALOC Station: ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 404); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 404); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights.; SdashAPI: SdashAPI rejected the request (HTTP 403); review filters, credentials, and access rights..
- No live source made enough authorized records available to approach either the 200K target or the subject floors.

Checkpoint rows:

| Source | Filter | Last batch | State | Acquired | Accepted | Rejected | Duplicate | API usage | Error |
|---|---|---:|---|---:|---:|---:|---:|---:|---|
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=accounting&examType=jamb&limit=15 | 1 | partial | 15 | 12 | 0 | 3 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=agricultural%20science&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=animal%20husbandry&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=arabic&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=biology&examType=jamb&limit=15 | 1 | partial | 15 | 0 | 1 | 14 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=chemistry&examType=jamb&limit=15 | 1 | partial | 15 | 8 | 0 | 7 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=civic%20education&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=commerce&examType=jamb&limit=15 | 1 | partial | 15 | 0 | 0 | 15 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=computer%20science&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=crk&examType=jamb&limit=15 | 1 | partial | 15 | 2 | 0 | 13 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=current%20affairs&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=economics&examType=jamb&limit=15 | 1 | partial | 15 | 0 | 0 | 15 | 1 |  |
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
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=mathematics&examType=jamb&limit=15 | 1 | partial | 15 | 13 | 2 | 0 | 1 |  |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=music&examType=jamb&limit=15 | 0 | permanent_error | 0 | 0 | 0 | 0 | 0 | ALOC Station API rejected the request (HTTP 404); review filters, credentials, and access rights. |
| ALOC Station | https://dev.aloc.com.ng/api/v1/questions?subject=physics&examType=jamb&limit=15 | 8 | partial | 120 | 117 | 3 | 0 | 8 |  |
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

## Artifacts

- Questions: `output/questions/<normalized-subject>.jsonl`
- Library: `output/library/resources.jsonl`
- Import manifests: `output/manifests/question-bank.json`, `output/manifests/library.json`, `output/manifests/content-manifest.json`
- Coverage: `output/reports/coverage.json`
- Duplicate ledger: `output/reports/duplicates.jsonl`
- Quarantine/rejections: `output/quarantine/questions.jsonl`, `output/quarantine/rejected.jsonl`
- Live provider batches: `content/acquired/*.jsonl` (original ALOC snapshot preserved)
- Source authorization/inventory: `content/authorized-sources.json`, `content/source-inventory.json`

## Validation and application checks

- Acquisition, normalization, deduplication, rights, question schema, library schema, subject floors, provenance, and checkpoint/resume validation: **9/9 passed**.
- Existing application tests: **11 passed, 0 failed**.
- Lint: **passed**, with two existing unused-component warnings in `components/student-workspace.tsx`; no lint errors.
- Production build: **passed** using `TMPDIR=/tmp npm run build -- --webpack` (Next.js webpack build for Android/ARM64).
- CBT compatibility test includes deterministic 180-question JAMB form creation from staged real rows.

## Remaining blockers

- The authorized acquisition package path named in the task was absent, and no complete `sources.json` / `harvest-plan.json` research pack was available in the repository.
- AskQuestions.ng and ExamVora are user-authorized candidates, but the repository has no official API/export credentials or documented import format; no copyrighted material was fetched from them.
- ALOC returned unsupported-filter errors for some requested subjects; Sdash returned access-denied or filter errors for many subject requests. The existing local snapshot and successful cached batches were still processed.
- 200K unique questions, every subject floor, semantic review, and 5 resources per subject/level remain unmet.
- Database import was not run because no authorized Supabase/PostgreSQL import credentials/configuration are available to the pipeline.

## Exact next step for Phase 3

Obtain and register official API/export access and filter/subject identifiers for the authorized AskQuestions.ng and ExamVora sources, plus any ALOC/Sdash access that resolves the recorded permanent errors. Then resume `npm run content:acquire` and rerun `npm run content:validate:acquisition`; keep all new batches and checkpoints under their existing directories.
