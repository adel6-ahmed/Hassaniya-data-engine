## Hassaniya Arabic Dataset Platform

Research‑grade platform for collecting, curating, and exporting Hassaniya Arabic linguistic data (parallel sentences, monolingual texts, proverbs, dialogues, FAQ).

Built with **Next.js App Router**, **TypeScript**, **Prisma + PostgreSQL**, **Auth.js v5**, **React Hook Form**, **Zod**, and **TailwindCSS**.

---

## API Overview

All API routes:

- **Live under** `app/api/*`
- **Use helpers from** `@/lib/api-helpers`:
  - **Responses**: `ok`, `created`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `serverError`, `validationError`
  - **Auth**: `requireAuth()`, `requireRole('CONTRIBUTOR' | 'REVIEWER' | 'ADMIN')`
  - **Query utils**: `parsePagination(req)`, `buildMeta(total, page, pageSize)`, `parseFilters(req)`
- **Use Prisma** from `@/lib/prisma`
- **Validate input** with Zod schemas from `@/lib/validations`

### Authentication and Roles

- Auth is configured in `auth.ts` using **Auth.js v5 + PrismaAdapter**.
- Session strategy: **JWT**.
- User roles (Prisma `UserRole` / TS `UserRole`):
  - `ADMIN`
  - `REVIEWER`
  - `CONTRIBUTOR` (default)
- Use:
  - `requireAuth()` when *any* authenticated user can access.
  - `requireRole('REVIEWER' | 'ADMIN')` for elevated permissions.

### Core Modules and Endpoints

#### 1. Parallel Sentences

- **Model**: `ParallelSentence` in `prisma/schema.prisma`
  - Key fields: `hassaniyaSentence`, `msaTranslation`, `frenchTranslation`, `rawText`, `normalizedText`, `domain`, `intent`, `region`, `emotionalTone`, `styleType`, `confidenceLevel`, `curationStage`, `reviewStatus`, `isExportReady`, `version`, `contributorId`, `reviewerId`, `variationGroupId`.
- **Validation**: `parallelSentenceSchema` in `@/lib/validations`
  - Ensures sentence length (3–40 words), translations, domain/intent/region enums, quality fields, and optional variation group.
  - Helpers:
    - `normalizeHassaniyaText(text)` – whitespace and punctuation normalization for deduplication.
    - `checkTextQuality(text)` – emoji spam, repetition, Latin‑dominance, and MSA‑style heuristics.
- **Endpoints**:
  - `GET /api/sentences`
    - Uses `parsePagination` and `parseFilters` to build a Prisma `where` with:
      - `domain`, `intent`, `region`
      - `reviewStatus`, `curationStage`
      - `isExportReady`, `contributorId`
      - `search` (applies `contains` on `hassaniyaSentence` and `msaTranslation`)
    - Returns `ok(data, meta)` where `meta = buildMeta(total, page, pageSize)`.
  - `POST /api/sentences`
    - `requireAuth()`.
    - Parses body with `parallelSentenceSchema`.
    - Computes `rawText`, `normalizedText` via `normalizeHassaniyaText`.
    - Runs `checkTextQuality`; if `passed === false` returns `badRequest` with joined error messages.
    - Duplicate detection:
      - Loads recent entries (same `domain`, last 500) and passes them into `checkDuplicate` (`@/lib/duplicate-detection`).
      - Exact duplicates ⇒ conflict response (`409`) and no insert.
      - Near duplicates ⇒ marks `isDuplicate` and stores `duplicateOfId`, plus a `DuplicateFlag` row.
    - Creates `ParallelSentence` with contributor id from session.
    - Writes `QualityLog` rows for warnings.
    - Returns `created(sentence, warnings?)`.
  - `GET /api/sentences/:id`
    - Returns a single sentence with contributor, reviewer, variation group, and duplicates.
  - `PATCH /api/sentences/:id`
    - `requireAuth()`; only **owner** or **REVIEWER/ADMIN** can update.
    - Validates partial body with `parallelSentenceSchema.partial()`.
    - Increments `version` and re‑normalizes `rawText`/`normalizedText` when `hassaniyaSentence` changes.
  - `DELETE /api/sentences/:id`
    - `requireRole('ADMIN')`; hard‑deletes the sentence.

#### 2. Monolingual Texts

- **Model**: `MonolingualText`
  - Long Hassaniya texts (`hassaniyaText`), `rawText`, `normalizedText`, topic, `textType`, `domain`, `region`, `emotionalTone`, `writingStyle`, `sourceType`, privacy and quality fields, `isSegmented`, `segments` relation.
- **Validation**: `monolingualTextSchema`
  - 300–6000 characters, domain/region/style/source enums, quality flags.
- **Contribution UI**: `app/(dashboard)/dashboard/contribute/texts/page.tsx`
  - Client form using React Hook Form + `zodResolver(monolingualTextSchema)`.
  - Submits to `POST /api/texts`.
- **Endpoints**:
  - `GET /api/texts/:id` – returns full text with contributor, reviewer, and `TextSegment[]`.
  - `PATCH /api/texts/:id`
    - Owner or reviewer only.
    - Partial validation via `monolingualTextSchema.partial()`.
    - Recomputes `rawText`, `normalizedText`, `wordCount`, `characterCount` when `hassaniyaText` changes.
  - `DELETE /api/texts/:id` – `requireRole('ADMIN')`.

#### 3. Proverbs

- **Model**: `Proverb`
  - `proverbText`, `meaningExplanation`, translations, `rawText`, `normalizedText`, `category`, `domain`, `region`, quality and curation fields.
- **Validation**: `proverbSchema`
  - Word‑count bounds and basic required fields.
- **Endpoints**:
  - `GET /api/proverbs/:id`
  - `PATCH /api/proverbs/:id`
    - Owner or reviewer; partial Zod validation.
    - Re‑normalizes `rawText` / `normalizedText` when `proverbText` changes.
  - `DELETE /api/proverbs/:id` – `requireRole('ADMIN')`.

#### 4. Multi‑turn Dialogues

- **Models**: `Dialogue` + `DialogueTurn`
  - `Dialogue`: domain/region, `curationStage`, `reviewStatus`, `isExportReady`, `turnCount`.
  - `DialogueTurn`: `utteranceText`, `rawText`, `normalizedText`, `speakerRole`, `dialogueStage`, intent/domain/region, quality fields.
- **Validation**:
  - `dialogueTurnSchema` – per‑turn validation (speaker role, stage, intent, domain, etc.).
  - `dialogueSchema` – dialogue‑level validation; requires at least 2 turns.
- **Contribution UI**: `contribute/dialogues/page.tsx`
  - Client‑side builder that constructs a `dialogueSchema`‑compatible payload and posts to `/api/dialogues`.
- **Endpoints**:
  - `GET /api/dialogues/:id` – returns dialogue with ordered turns and contributor info per turn.
  - `PATCH /api/dialogues/:id` – **REVIEWER/ADMIN** only; updates metadata (`title`, `domain`, `reviewStatus`, `curationStage`, `isExportReady`).
  - `DELETE /api/dialogues/:id` – `requireRole('ADMIN')`.

#### 5. FAQ Entries

- **Model**: `FaqEntry`
  - Hassaniya + MSA question/answer pairs, French optional, normalized question text, domain/intent, validity window (`validFrom`/`validUntil`), `isActive`, curation fields.
- **Validation**: `faqEntrySchema`
  - Question and answer length, enums for domain/intent/sourceType, datetime strings for `validFrom`/`validUntil`.
- **Endpoints**:
  - `GET /api/faq/:id`
  - `PATCH /api/faq/:id`
    - Owner or reviewer; partial validation and `normalizeHassaniyaText` for `rawQuestion` / `normalizedQuestion`.
    - Converts `validFrom` / `validUntil` strings into `Date` objects.
  - `DELETE /api/faq/:id` – `requireRole('ADMIN')`.

#### 6. Variation Groups

- **Model**: `VariationGroup`
  - Semantic grouping (`meaningArabic`, `meaningFrench`, `domain`, `intent`) linking multiple `ParallelSentence` variants.
- **Validation**: `variationGroupSchema`
  - Required `meaningArabic`, optional `meaningFrench`, domain/intent enums.
- **Endpoints**:
  - `GET /api/variations/:id`
    - Returns group with creator, all linked parallel sentences, and counts.
  - `POST /api/variations/:id`
    - Adds a new sentence to an existing group.
    - Validates new sentence payload and uses `normalizeHassaniyaText` + `checkTextQuality`.
    - Uses `checkDuplicate` to avoid duplicates inside the same group.
  - `DELETE /api/variations/:id`
    - `requireRole('ADMIN')`.
    - Refuses to delete if group still has sentences.

#### 7. Contributor Tasks

- **Models**: `ContributorTask`, `TaskSubmission`
  - Tasks describe a target module (`moduleTarget`), `domain`, optional `intent`, `targetCount`, due date, and `status`.
  - Submissions link users, tasks, and source records (by table + id).
- **Endpoints**:
  - `GET /api/tasks/:id`
    - Returns task with creator, assignee, last submissions, and counts.
  - `PATCH /api/tasks/:id` – `requireRole('ADMIN')`
    - Validates via `updateTaskSchema` (status, assignee, due date, targetCount).
  - `DELETE /api/tasks/:id` – `requireRole('ADMIN')`
    - Soft‑deletes by setting `status: 'CANCELLED'`.
  - `POST /api/tasks/:id`
    - `requireAuth()`.
    - Upserts a `TaskSubmission` keyed by `(taskId, contributorId, sourceId)` to avoid duplicates.

#### 8. Review Queue

- **Endpoint**: `GET /api/review/queue`
  - `requireRole('REVIEWER')`.
  - Returns pending items across:
    - `parallel_sentences`, `monolingual_texts`, `proverbs`, `faq_entries`
  - Each bucket includes `count` and `items`, plus a total aggregate count.

#### 9. Data Export

- **Model**: `DataExport`
  - Stores export configuration (`exportType`, `format`, `filters` JSON, train/val/test ratios) and result metadata (`totalEntries`, `status`, `fileUrl` if you later add storage).
- **Validation**: `exportSchema` in `app/api/export/route.ts`
  - `exportType`: `parallel | monolingual | proverbs | dialogues | instruction | faq`
  - `format`: `json | jsonl | csv`
  - Optional `domain`, `intent`, `region`.
  - `trainRatio`, `valRatio`, and implicit `testRatio`.
- **Endpoints**:
  - `POST /api/export`
    - `requireRole('REVIEWER')`.
    - Fetches rows by `exportType`:
      - `parallel` – `ParallelSentence` rows ready for export.
      - `instruction` – maps parallel sentences into instruction‑tuning triplets.
      - `dialogues`, `faq`, `proverbs`, `monolingual` use dedicated fetchers.
    - Optionally splits into train/val/test using `splitDataset`.
    - Serializes as JSON / JSONL / CSV with `toJsonl` / `toCsv`.
    - Logs a `DataExport` record; returns file content as the HTTP response with appropriate headers.
  - `GET /api/export`
    - `requireRole('REVIEWER')`.
    - Returns latest exports with requester info.

---

## Validations and Quality Logic (`lib/validations.ts`)

Key exports:

- **Enums (Zod)**:
  - `DomainEnum`, `IntentEnum`, `RegionEnum`, `EmotionalToneEnum`, `StyleTypeEnum`, `ReviewStatusEnum`
  - These mirror Prisma enums and are used throughout forms and APIs.
- **Text utilities**:
  - `normalizeHassaniyaText(text: string): string`
  - `checkTextQuality(text: string): QualityCheck`
- **Module schemas**:
  - `parallelSentenceSchema` / `ParallelSentenceInput`
  - `monolingualTextSchema` / `MonolingualTextInput`
  - `proverbSchema` / `ProverbInput`
  - `dialogueTurnSchema`, `dialogueSchema` / `DialogueInput`
  - `faqEntrySchema` / `FaqEntryInput`
  - `reviewSchema` / `ReviewInput`
  - `variationGroupSchema` / `VariationGroupInput`

All API write endpoints validate request bodies with these schemas before touching the database, and surface errors via `validationError` (`422`) or `badRequest` (`400`) when needed.

---

## Running Locally

1. Install dependencies:

```bash
npm install
```

2. Set up environment:

- `DATABASE_URL` – PostgreSQL connection string.
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- `AUTH_SECRET` (or equivalent, depending on Auth.js version).

3. Run Prisma:

```bash
npx prisma generate
npx prisma db push   # or your migration workflow
```

4. Start the dev server:

```bash
npm run dev
```

App will be available at `http://localhost:3000`.
