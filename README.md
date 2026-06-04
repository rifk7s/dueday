<div align="center">

# DueDay

**Task & due-date management for university students — powered by Laravel and Expo.**

<a href="dueday-be/"><img src="https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white" alt="Laravel 13"></a>
<a href="dueday-be/"><img src="https://img.shields.io/badge/PHP-8.3+-777BB4?logo=php&logoColor=white" alt="PHP 8.3+"></a>
<a href="dueday-fe/"><img src="https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo" alt="Expo SDK 54"></a>
<a href="dueday-fe/"><img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react" alt="React Native"></a>
<a href="dueday-fe/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [API URL](#api-url-auto-detection) · [Mock Auth](#mock-auth) · [Troubleshooting](#troubleshooting)

</div>

---

DueDay helps university students manage assignments, deadlines, and recurring activities from a single mobile app. A Laravel REST API handles data, authentication, AI-powered reminders, and a premium subscription flow — an Expo/React Native client delivers the experience on iOS, Android, and Web.

## Monorepo Structure

```
dueday/
├── dueday-be/   ← Laravel REST API
└── dueday-fe/   ← Expo mobile client
```

| Package | Stack |
|---------|-------|
| [`dueday-be/`](dueday-be/) | Laravel 13 · PHP 8.3+ · Sanctum · Pest 4 · SQLite |
| [`dueday-fe/`](dueday-fe/) | Expo SDK 54 · React 19 · React Native 0.81 · TypeScript 5.9 |

## Features

<table>
<tr>
  <td align="center" width="33%">
    <b>Tasks & Tags</b>
    <br><sub>CRUD tasks with priorities, due dates, goals, progress tracking, and per-user tags.</sub>
  </td>
  <td align="center" width="33%">
    <b>Calendar View</b>
    <br><sub>Monthly calendar with task dots, weekly strip, and day-based task list.</sub>
  </td>
  <td align="center" width="33%">
    <b>Activities</b>
    <br><sub>Recurring activities (daily/weekly/monthly) with progress lifecycle and auto-reset.</sub>
  </td>
</tr>
<tr>
  <td align="center" width="33%">
    <b>AI Reminders</b>
    <br><sub>Gemini-generated reminder messages in 3 styles, cached for low token cost.</sub>
  </td>
  <td align="center" width="33%">
    <b>Push Notifications</b>
    <br><sub>Expo push notifications with deep linking, in-app notification center.</sub>
  </td>
  <td align="center" width="33%">
    <b>Premium & Payments</b>
    <br><sub>Subscription plans with mock QRIS payment flow for development.</sub>
  </td>
</tr>
<tr>
  <td align="center" width="33%">
    <b>Dark / Light Theme</b>
    <br><sub>System-aware theme switching with Material Design 3 color system.</sub>
  </td>
  <td align="center" width="33%">
    <b>Elearn Integration</b>
    <br><sub>University e-learning simulation with assignments, submissions, and grading.</sub>
  </td>
  <td align="center" width="33%">
    <b>Auto API Docs</b>
    <br><sub>Interactive OpenAPI 3.1 documentation via Scramble at <code>/docs/api</code>.</sub>
  </td>
</tr>
</table>

## Tech Stack

### Backend (`dueday-be/`)

| Layer | Technology |
|-------|------------|
| Framework | Laravel 13 · PHP 8.3+ |
| Auth | Laravel Sanctum 4 (bearer tokens) |
| Database | SQLite (default) · database-backed cache, queue & sessions |
| API Docs | Scramble (OpenAPI 3.1) |
| AI | Google Gemini (reminder generation) |
| Testing | Pest 4 · 26 feature tests · 16 factories |
| Tooling | Pint · Pail · Laravel Boost |

### Frontend (`dueday-fe/`)

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54 · React 19 · React Native 0.81 |
| Language | TypeScript 5.9 (strict) |
| Styling | `StyleSheet.create()` + centralized theme system |
| Navigation | Expo Router 6 (file-based) · custom animated BottomNav |
| Server State | TanStack React Query 5 |
| Auth State | React Context + expo-secure-store |
| Animations | React Native Reanimated 4 |
| i18n | i18next (Indonesian default + English) |
| Font | Lexend (Google Fonts) |

## Prerequisites

- PHP **8.3+** and [Composer](https://getcomposer.org)
- Node **22+** and npm (or [bun](https://bun.sh))
- **Android**: Android Studio + AVD emulator
- **iOS**: Xcode + iOS Simulator (macOS only)

## Getting Started

### 1. Backend

```bash
cd dueday-be
composer setup        # install, .env, key, migrate, build — all in one
composer run dev      # API + queue + logs + scheduler + Vite
```

Or step by step:

```bash
cd dueday-be
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
composer run dev
```

> [!NOTE]
> `composer run dev` binds to `0.0.0.0:8000` — the API is reachable from emulators and physical devices on the same network. Run on a trusted network.

### 2. Frontend

```bash
cd dueday-fe
npm install           # or: bun install
npm run start         # or: bun run start
```

Press **`a`** for Android, **`i`** for iOS, or scan the QR code with Expo Go on a physical device.

> [!TIP]
> Run `npm run start:mock` (or `bun run start:mock`) to launch without a backend — see [Mock Auth](#mock-auth).

## API URL Auto-Detection

The frontend resolves the backend URL automatically — no manual configuration required.

| Target | Resolved URL |
|--------|-------------|
| iOS Simulator | `http://localhost:8000/api` |
| Android Emulator (AVD) | `http://10.0.2.2:8000/api` |
| Physical device (Expo Go) | `http://<host-LAN-IP>:8000/api` |

For physical devices, the app reads the host IP from the Expo QR code. Host and device must share the same Wi-Fi network.

> [!TIP]
> Override the URL by setting `EXPO_PUBLIC_API_URL` in `dueday-fe/.env.local`. Restart with `npx expo start --clear` after changes.

## Mock Auth

For frontend development without a running backend:

```env
# dueday-fe/.env.local
EXPO_PUBLIC_MOCK_AUTH=true
```

Or use the shortcut:

```bash
cd dueday-fe
npm run start:mock
```

> [!IMPORTANT]
> Mock auth bypasses all API calls and uses in-memory seed data. Disable it before testing against a real backend.

## Troubleshooting

### Network request failed — Android Emulator

1. Ensure backend runs via `composer run dev` (listens on `0.0.0.0`).
2. Restart Expo: `npx expo start --clear`.

> [!NOTE]
> Android emulators run in a separate VM. `localhost` inside the emulator points to itself, not the host. The alias `10.0.2.2` routes to the host's `127.0.0.1` — handled automatically.

### Network request failed — Physical Device

1. Connect host and device to the **same Wi-Fi network**.
2. Ensure backend runs via `composer run dev`.
3. Check firewall — macOS: System Settings > Network > Firewall, allow `php`.
4. Verify host IP: `ipconfig getifaddr en0` (macOS).

> [!WARNING]
> Networks with client isolation (campus / office Wi-Fi) block device-to-host traffic. Use `EXPO_PUBLIC_API_URL` with a tunnel (`ngrok` or `cloudflared`) pointing to port 8000.

### `php` or `composer` not recognized (Windows)

Ensure PHP and Composer are in `PATH`, then restart the terminal:

```powershell
php --version
composer --version
```
