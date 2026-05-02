# DueDay Monorepo Index

## Backend (`dueday-be/`)
- Framework: Laravel Boost v2, Laravel v13, PHP 8.4
- Skills: Auto-managed by Boost, synced via `php artisan boost:install`
- Load: [`dueday-be/AGENTS.md`](./dueday-be/AGENTS.md)

## Frontend (`dueday-fe/`)
- Framework: Expo, React Native, TypeScript
- Skills: Auto-managed by Expo, synced via `expo install`
- Load: [`dueday-fe/AGENTS.md`](./dueday-fe/AGENTS.md)
- Note: See frontend AGENTS for NativeWind v5 specifics

## Workflow

1. Identify package: `dueday-be/` or `dueday-fe/`
2. Load package AGENTS.md
3. Check `.agents/skills/` for relevant skill
4. Follow skill guidance or existing patterns
5. Execute changes

See [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) for routing rules.

*Managed by: Laravel Boost (backend), Expo (frontend)*
