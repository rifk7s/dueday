<div align="center">

# DueDay API

<a href="#"><img src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white" alt="Laravel 13"></a>
<a href="#"><img src="https://img.shields.io/badge/PHP-8.3+-777BB4?logo=php&logoColor=white" alt="PHP 8.3+"></a>
<a href="#"><img src="https://img.shields.io/badge/Auth-Sanctum_4-FF2D20?logo=laravel&logoColor=white" alt="Sanctum"></a>
<a href="#"><img src="https://img.shields.io/badge/Tests-Pest_4-f472b6?logo=pestphp&logoColor=white" alt="Pest 4"></a>
<a href="#"><img src="https://img.shields.io/badge/Docs-OpenAPI_3.1-6BA539?logo=openapiinitiative&logoColor=white" alt="OpenAPI 3.1"></a>

Token-authenticated JSON API for **DueDay** — a task & due-date management app for university students.\
Auto-generated OpenAPI docs, AI-powered reminders via Gemini, and an Elearn simulation module.

</div>

---

This is the `dueday-be` package of the DueDay monorepo. The Expo/React Native client lives in [`dueday-fe/`](../dueday-fe/).

## Features

<table>
<tr>
  <td align="center" width="33%">
    <b>Tasks & Tags</b>
    <br><sub>CRUD tasks with priorities, due dates, goals, progress tracking, and per-user tags with unique scoping.</sub>
  </td>
  <td align="center" width="33%">
    <b>Activities</b>
    <br><sub>Recurring activities (daily/weekly/monthly/yearly) with progress lifecycle and auto-reset via scheduler.</sub>
  </td>
  <td align="center" width="33%">
    <b>AI Reminders</b>
    <br><sub>Gemini-generated reminder messages in 3 styles (tegas, santai, ngancam halus), cached for 7 days.</sub>
  </td>
</tr>
<tr>
  <td align="center" width="33%">
    <b>Premium & Payments</b>
    <br><sub>Subscription plans with mock QRIS payment scan flow for development and demos.</sub>
  </td>
  <td align="center" width="33%">
    <b>Elearn Simulation</b>
    <br><sub>University e-learning system with assignments, student submissions, grading, and auto-task sync.</sub>
  </td>
  <td align="center" width="33%">
    <b>Auto API Docs</b>
    <br><sub>Interactive OpenAPI 3.1 docs generated from code by Scramble — no hand-written annotations.</sub>
  </td>
</tr>
</table>

> [!WARNING]
> The QRIS payment flow (`POST /payments/scan`) is a **sandbox mock** — it simulates payment scanning for development only. Do not use in production without a real payment gateway.

> [!TIP]
> Interactive API docs at [`/docs/api`](http://localhost:8000/docs/api) are the **source of truth** for request bodies and response shapes. Export the raw spec with `php artisan scramble:export`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Laravel 13 · PHP 8.3+ |
| Auth | Laravel Sanctum 4 (bearer tokens) |
| Database | SQLite (default) · database-backed cache, queue & sessions |
| API Docs | Scramble ^0.13 (OpenAPI 3.1, at `/docs/api`) |
| AI | Google Gemini (reminder message generation) |
| Testing | Pest 4 · 26 feature tests · 16 factories |
| Tooling | Pint (formatting) · Pail (log viewer) · Laravel Boost |

## Getting Started

### Prerequisites

- PHP **8.3+** and [Composer](https://getcomposer.org)
- Node.js (for the Vite asset pipeline)

### Quick Start

```bash
composer setup        # install deps, .env, key, migrate, build — all in one
composer run dev      # API + queue worker + log viewer + scheduler + Vite
```

Or step by step:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/Dueday.sqlite
php artisan migrate --seed
composer run dev
```

| URL | Purpose |
|-----|---------|
| `http://localhost:8000/api` | API base |
| `http://localhost:8000/docs/api` | Interactive OpenAPI docs |

> [!CAUTION]
> `php artisan migrate:fresh --seed` loads demo data but **drops every existing table first**. Only run against a development database.

## Configuration

Key environment variables (see [`.env.example`](.env.example) for the full list):

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_CONNECTION` | `sqlite` | Database driver |
| `DB_DATABASE` | `database/Dueday.sqlite` | SQLite file path |
| `GEMINI_API_KEY` | *(empty)* | Google Gemini key for AI features |
| `GEMINI_MODEL` | `gemini-flash-latest` | Gemini model identifier |
| `API_VERSION` | `1.0.0` | Version shown in API docs |

> [!NOTE]
> Without `GEMINI_API_KEY`, AI endpoints return fallback responses (`gemini_unavailable`). All other features work normally.

## API Overview

All routes are prefixed with `/api`. Every endpoint except auth (login/register) requires a bearer token:

```http
Authorization: Bearer <token>
```

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Login, returns Sanctum token |
| `POST` | `/forgot-password` | Send password reset token |
| `POST` | `/reset-password` | Reset password with token |
| `GET` | `/me` | Get current user profile |
| `PATCH` | `/me` | Update current user profile |
| `POST` | `/logout` | Revoke current token |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks` | List tasks (filterable) |
| `POST` | `/tasks` | Create task |
| `GET` | `/tasks/{task}` | Show task |
| `PUT/PATCH` | `/tasks/{task}` | Update task |
| `DELETE` | `/tasks/{task}` | Delete task |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tags` | List tags (global + user-scoped) |
| `POST` | `/tags` | Create tag |
| `GET` | `/tags/{tag}` | Show tag |
| `PUT/PATCH` | `/tags/{tag}` | Update tag |
| `DELETE` | `/tags/{tag}` | Delete tag |

### Activities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/activities` | List activities |
| `POST` | `/activities` | Create activity |
| `GET` | `/activities/{activity}` | Show activity |
| `PUT/PATCH` | `/activities/{activity}` | Update activity |
| `DELETE` | `/activities/{activity}` | Delete activity |

### Reminders (AI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/me/reminder-settings` | Get reminder settings |
| `PUT` | `/me/reminder-settings` | Update reminder settings |
| `POST` | `/reminders/generate-message` | Generate single AI reminder (60/min limit) |
| `POST` | `/reminders/generate-messages` | Batch generate up to 50 reminders (60/min limit) |

### Subscriptions & Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET·POST` | `/subscriptions` | List / create subscriptions |
| `GET·PUT·DELETE` | `/subscriptions/{id}` | Show / update / delete |
| `GET·POST` | `/payments` | List / create payments |
| `GET·PUT·DELETE` | `/payments/{id}` | Show / update / delete |
| `POST` | `/payments/scan` | QRIS scan verification (sandbox mock) |

## Models

All main models use UUID primary keys.

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **User** | `username`, `email`, `nickname`, `is_subscribed` | has many: Tasks, Tags, Activities, Subscriptions, Payments |
| **Task** | `name`, `due_date`, `due_time`, `priority`, `status`, `goals` | belongs to: User, Tag |
| **Tag** | `name`, `user_id` (null = global) | belongs to: User · has many: Tasks, Activities |
| **Activity** | `name`, `date`, `time_start`, `time_end`, `recurrence`, `status` | belongs to: User, Tag |
| **Subscription** | `plan`, `status`, `started_at`, `expired_at` | belongs to: User · has many: Payments |
| **Payment** | `amount`, `method`, `status`, `plan` | belongs to: User, Subscription |

### Service Layer

Eight service classes keep controllers thin:

`AuthService` · `TaskService` · `TaskGoalService` · `TagService` · `ActivityService` · `SubscriptionService` · `PaymentService` · `GeminiService`

### Scheduled Commands

| Command | Schedule | Description |
|---------|----------|-------------|
| `activities:reset-recurring` | Every minute | Resets completed recurring activities |
| `subscriptions:expire-expired` | Every minute | Expires subscriptions past their expiry date |

## Testing

```bash
composer test                                    # full suite (26 tests)
php artisan test --compact --filter=TaskGoal     # a single feature
vendor/bin/pint                                  # format code
```

## Project Structure

```
app/
├── Http/
│   ├── Controllers/       # Thin controllers, delegate to services
│   ├── Requests/          # FormRequest validation (drives API docs)
│   └── Resources/         # JSON response shapes
├── Models/                # Eloquent models (UUID primary keys)
├── Services/              # Business logic (8 service classes)
└── Providers/             # AppServiceProvider wires Scramble bearer auth
config/scramble.php        # API docs configuration
routes/api.php             # All API routes
routes/web.php             # Elearn + fake payment web routes
database/
├── migrations/            # 28 migration files
├── factories/             # 16 model factories
└── seeders/               # 8 seeders with demo data
tests/Feature/             # Pest feature tests
```
