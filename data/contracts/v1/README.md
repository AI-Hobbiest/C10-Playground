# C10 Playground data contracts — v1

These contracts are the platform's portable data model. They are provider-neutral: JSON is the interchange format; browser storage is the first adapter, not the canonical long-term database.

## Compatibility strategy

- Current subject JSON arrays are accepted as **legacy import format** so existing banks keep working unchanged.
- New or migrated banks should use the versioned envelope in `question-bank.schema.json`.
- Stable IDs are strings. Once published, do not reuse an ID for a different question or profile. If content changes materially, preserve the ID only for a correction; otherwise assign a new ID.
- Timestamps are ISO 8601 UTC strings.
- Profile identifiers should be random, pseudonymous IDs. Do not place names, email addresses, school IDs, dates of birth, or other personal information in the repository.
- Test attempts and answers are append-only historical records. Do not recompute old results using a newer question-bank version.

## Contract files

| Contract | Purpose |
|---|---|
| `question-bank.schema.json` | Versioned subject/chapter/question bank |
| `question-bank-import.schema.json` | Current legacy array format |
| `student-profile.schema.json` | Minimal pseudonymous learner profile |
| `answer-record.schema.json` | An answer to one question in one attempt |
| `test-attempt.schema.json` | One complete practice/test session |
| `local-store-envelope.schema.json` | Versioned storage adapter envelope |

## Stable question identity

Use `questionId` as the durable identifier. The browser currently derives a temporary-compatible ID of the form `<subjectId>/<chapterId>/q-<questionId>`; legacy chapter number + question number keys are migrated on first load. For new banks, define explicit `subjectId`, `chapterId`, and string `questionId` values in the source data.

## Storage adapter boundary

UI and quiz logic should use a small storage interface (`load`, `save`, `clear`, `exportJSON`, `importJSON`) rather than calling `localStorage` directly. The current adapter is local-only. A future remote adapter should implement the same interface and add authentication, conflict handling, and server-side active-session enforcement.
