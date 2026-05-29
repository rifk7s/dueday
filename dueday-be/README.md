<div align="center">

# DueDay API

**The REST backend for DueDay — a task & due-date management app.**

<a href="#"><img src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white" alt="Laravel 13"></a>
<a href="#"><img src="https://img.shields.io/badge/PHP-8.3+-777BB4?logo=php&logoColor=white" alt="PHP 8.3+"></a>
<a href="#"><img src="https://img.shields.io/badge/Auth-Sanctum-FF2D20?logo=laravel&logoColor=white" alt="Sanctum"></a>
<a href="#"><img src="https://img.shields.io/badge/Tests-Pest%204-8BC34A?logo=pest&logoColor=white" alt="Pest 4"></a>
<a href="#"><img src="https://img.shields.io/badge/Docs-OpenAPI%203.1-6BA539?logo=openapiinitiative&logoColor=white" alt="OpenAPI 3.1"></a>

</div>

A token-authenticated JSON API for managing tasks, goals, tags, and the premium subscription flow that powers the DueDay mobile app. It pairs a thin controller / service-class architecture with auto-generated OpenAPI docs and AI-written reminder messages.

> [!NOTE]
> This is the `dueday-be` package of the **DueDay monorepo**. The Expo (iOS / Android / Web) client lives in `dueday-fe`. Changes to routes or response shapes need to be mirrored there.

## Features

<table>
<tr>
  <td align="center" width="33%">
    <b>Tasks &amp; Goals</b>
    <br><sub>CRUD tasks with priorities, due dates, checklist goals, and computed progress / overdue state.</sub>
  </td>
  <td align="center" width="33%">
    <b>Per-user Tags</b>
    <br><sub>Custom tags scoped per user, deduped with a unique index so concurrent users never clash.</sub>
  </td>
  <td align="center" width="33%">
    <b>Activities</b>
    <br><sub>Track recurring activities with their own status and progress lifecycle.</sub>
  </td>
</tr>
<tr>
  <td align="center" width="33%">
    <b>Premium &amp; Payments</b>
    <br><sub>Subscriptions plus a mock QRIS payment-scan flow for verifying premium purchases.</sub>
  </td>
  <td align="center" width="33%">
    <b>AI Reminders</b>
    <br><sub>Gemini-generated reminder copy, single or batched (up to 50), cached to keep token cost near zero.</sub>
  </td>
  <td align="center" width="33%">
    <b>Auto API Docs</b>
    <br><sub>Interactive OpenAPI 3.1 docs generated from code by Scramble — no hand-written annotations.</sub>
  </td>
</tr>
</table>

## Tech Stack

<table>
<tr><th align="left">Layer</th><th align="left">Technology</th></tr>
<tr><td>Framework</td><td>Laravel 13 · PHP 8.3+</td></tr>
<tr><td>Auth</td><td>Laravel Sanctum 4 (bearer tokens)</td></tr>
<tr><td>Database</td><td>SQLite (default) · database-backed cache, queue & sessions</td></tr>
<tr><td>API Docs</td><td>Scramble (OpenAPI 3.1, served at <code>/docs/api</code>)</td></tr>
<tr><td>AI</td><td>Google Gemini (reminder message generation)</td></tr>
<tr><td>Testing</td><td>Pest 4</td></tr>
<tr><td>Tooling</td><td>Pint (formatting) · Pail (log viewer) · Laravel Boost</td></tr>
</table>

## Getting Started

### Prerequisites

- PHP **8.3+** and [Composer](https://getcomposer.org)
- Node.js (for the Vite asset pipeline)

### Quick start

```bash
# from the dueday-be/ directory
composer setup        # install deps, create .env, generate key, migrate, build assets
composer run dev      # serve API + queue worker + log viewer + Vite, all at once
```

The API is now live at **http://localhost:8000/api** and the docs at **http://localhost:8000/docs/api**.

> [!CAUTION]
> `php artisan migrate:fresh --seed` loads demo tasks, tags, payments, and a test user — but it **drops every existing table first**. Only run it against a development database.

### Manual setup

If you prefer to run the steps yourself:

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/Dueday.sqlite     # SQLite database file
php artisan migrate
php artisan serve
```

## Configuration

Key environment variables (see [.env.example](.env.example) for the full list):

<table>
<tr><th align="left">Variable</th><th align="left">Default</th><th align="left">Description</th></tr>
<tr><td><code>DB_CONNECTION</code></td><td><code>sqlite</code></td><td>Database driver.</td></tr>
<tr><td><code>DB_DATABASE</code></td><td><code>database/Dueday.sqlite</code></td><td>SQLite file path (absolute path for other drivers).</td></tr>
<tr><td><code>API_VERSION</code></td><td><code>1.0.0</code></td><td>Version shown on the generated API docs.</td></tr>
<tr><td><code>GEMINI_API_KEY</code></td><td><em>(empty)</em></td><td>Google Gemini key — required for AI reminder messages.</td></tr>
<tr><td><code>GEMINI_MODEL</code></td><td><code>gemini-flash-latest</code></td><td>Gemini model used for generation.</td></tr>
</table>

> [!IMPORTANT]
> Without `GEMINI_API_KEY`, the reminder endpoints respond with `gemini_unavailable` instead of generated text. Everything else works without it.

## API Overview

All routes are prefixed with `/api`. Every endpoint except `POST /login` requires a bearer token:

```http
Authorization: Bearer <token>
```

<table>
<tr><th align="left">Resource</th><th align="left">Routes</th><th align="left">Notes</th></tr>
<tr><td>Auth</td><td><code>POST /login</code> · <code>GET /me</code> · <code>PATCH /me</code> · <code>POST /logout</code></td><td>Login is public; returns a Sanctum token.</td></tr>
<tr><td>Tasks</td><td><code>GET·POST /tasks</code> · <code>GET·PUT·PATCH·DELETE /tasks/{id}</code></td><td>Goals, progress, overdue flag.</td></tr>
<tr><td>Tags</td><td><code>GET·POST /tags</code> · <code>GET·PUT·PATCH·DELETE /tags/{id}</code></td><td>Scoped per user.</td></tr>
<tr><td>Activities</td><td><code>GET·POST /activities</code> · <code>GET·PUT·PATCH·DELETE /activities/{id}</code></td><td>—</td></tr>
<tr><td>Reminders</td><td><code>GET·PUT /me/reminder-settings</code> · <code>POST /reminders/generate-message[s]</code></td><td>Generation throttled to 60/min per user.</td></tr>
<tr><td>Subscriptions</td><td><code>GET·POST /subscriptions</code> · <code>GET·PUT·PATCH·DELETE /subscriptions/{id}</code></td><td>Premium plans.</td></tr>
<tr><td>Payments</td><td><code>GET·POST /payments</code> · <code>GET·PUT·PATCH·DELETE /payments/{id}</code> · <code>POST /payments/scan</code></td><td>QRIS scan verifies a pending payment.</td></tr>
</table>

> [!WARNING]
> `POST /payments/scan` is a **sandbox mock** — it only validates `DUEDAY_MOCK_PAYMENT` QR strings and marks a matching pending payment as paid. It is not a real payment gateway and must not be used to process live transactions.

> [!TIP]
> The interactive docs at **`/docs/api`** are the source of truth for request bodies and response shapes — they're generated directly from the code. Export the raw spec with `php artisan scramble:export`.

## Testing

```bash
composer test                                   # full suite
php artisan test --compact --filter=TaskGoal    # a single feature
vendor/bin/pint                                 # format code
```

## Project Structure

```
app/
├── Http/
│   ├── Controllers/   # thin controllers, delegate to services
│   ├── Requests/      # FormRequest validation (drives the API docs)
│   └── Resources/     # JSON response shapes
├── Models/            # Eloquent models (UUID primary keys)
├── Services/          # business logic (TaskService, GeminiService, …)
└── Providers/         # AppServiceProvider wires Scramble bearer auth
config/scramble.php    # API docs configuration
routes/api.php         # all API routes
tests/Feature/         # Pest feature tests
```

_DueDay is under active development — this README tracks the current state of the API and will be updated as endpoints and features land._
