# DueDay — Monorepo

DueDay is a task and due-date management mobile app. Laravel REST API backend + Expo (iOS/Android/Web) frontend.

## Packages

| Folder | Stack | CLAUDE.md |
|--------|-------|-----------|
| `dueday-be/` | Laravel 13, PHP 8.4, Pest, SQLite | Managed by Laravel Boost — read it, never edit it |
| `dueday-fe/` | Expo SDK 54, React 19, TypeScript, NativeWind v5 | `dueday-fe/CLAUDE.md` |

When working in a package, read its own CLAUDE.md first — stack-specific rules live there.

## Cross-Package API Contract

- Backend base URL (local): `http://localhost:8000/api/`
- Auth: token-based (TBD — check `dueday-be/routes/api.php` for current routes)
- Response format: JSON
- Start backend: `cd dueday-be && composer run dev`
- Start frontend: `cd dueday-fe && npm run start`

## Git

**Branch protection is on. Never push directly to `main`.** Always work on a feature branch and open a PR.

Commit format: `type(scope): short description`
- Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `bench`
- Scope is optional but encouraged (e.g. `feat(calendar): ...`, `chore(deps): ...`)
- Body: one `- [+] description` bullet per logical change

Example:
```
feat(calendar): add due date grouping

- [+] Group tasks by due date in calendar view
- [+] Add sticky section headers with date labels
- [+] Handle empty state per date group
```

## Hard Rules

- NEVER commit `.env` files
- NEVER edit `dueday-be/CLAUDE.md` (auto-managed by Laravel Boost, will be overwritten)
- Changes to the API contract (routes, response shape) require updating both packages
