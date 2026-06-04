<div align="center">

# DueDay

**Task & due-date management — never miss a deadline again.**

[![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)

iOS · Android · Web

</div>

---

Cross-platform mobile client for DueDay, built with Expo and React Native. Features dark/light theme, calendar views, swipeable task actions, AI-powered reminders, push notifications, and i18n support (Indonesian + English). This is the `dueday-fe` package of the DueDay monorepo — the Laravel API lives in `dueday-be/`.

## Features

| Feature | Description |
| --- | --- |
| Tasks | Full CRUD with swipe actions (complete/delete), priority levels, due dates & times |
| Activities | Recurring activities with progress tracking and goal checklists |
| Calendar | Monthly calendar with task dots, weekly date strip, day-based task/activity list |
| Tags | Color-coded tags for organizing tasks and activities |
| AI Reminders | Gemini-powered reminder messages with multiple writing styles |
| Notifications | Push notifications via Expo, in-app notification center |
| Search | Full-text search across tasks and activities |
| Premium & Payments | Subscription flow with BCA, Mandiri, GoPay, OVO, Dana |
| Dark/Light Theme | System-aware theme switching via `theme.ts` |
| i18n | Indonesian (default) and English via i18next |
| Haptic Feedback | Tab bar haptics for tactile interaction |
| Pull to Refresh | On task list and other screens |
| Mock Auth | Dev mode without backend dependency |
| Deep Linking | URL scheme `duedayfe://` |
| Camera & QR | Camera integration and QR code generation |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Expo SDK 54 · React 19 · React Native 0.81 |
| Language | TypeScript 5.9 (strict) |
| Styling | `StyleSheet.create()` + theme system |
| Navigation | Expo Router 6 (file-based) + custom animated BottomNav |
| Server State | TanStack React Query 5 |
| Auth State | React Context + expo-secure-store |
| HTTP | Custom `apiFetch` wrapper (native fetch) |
| Dates | date-fns |
| Animations | React Native Reanimated 4 |
| Gestures | react-native-gesture-handler |
| Notifications | expo-notifications |
| i18n | i18next + react-i18next |
| Font | Lexend (Google Fonts) |

> [!NOTE]
> New Architecture is required. React Compiler and Typed Routes are both enabled in `app.json`.

## Getting Started

### Prerequisites

- **Node 22+** — bun preferred, npm available
- **Android**: Android Studio + AVD emulator
- **iOS**: Xcode + iOS Simulator (macOS only)
- **Backend**: `dueday-be` running on port 8000

### Install & Run

```bash
bun install          # or: npm install
cp .env.local.example .env.local   # optional — see API Integration
bun start            # or: npm run start
```

Then press **`a`** for Android, **`i`** for iOS, or scan the QR code with Expo Go.

> [!TIP]
> To develop without the backend, enable mock auth — see [Mock Auth](#mock-auth) below.

## Screens

### Auth

- **Login** — username/password sign-in
- **Register** — new account creation
- **Forgot Password** → **Reset Password** flow

### Main Tabs

The app uses a custom animated `BottomNav` with 3 tabs:

| Tab | Route | Description |
| --- | --- | --- |
| Home | `(tabs)/index` | Dashboard with task list, stats, and quick actions |
| Calendar | `(tabs)/calendar` | Monthly/weekly calendar with task dots |
| Profile | `(tabs)/profile` | User profile, settings, subscription status |

### Standalone Screens

| Screen | Route | Description |
| --- | --- | --- |
| Create Task | `create-task` | New task form |
| Edit Task | `edit-task` | Edit existing task |
| Task Progress | `taskprogress` | Task completion details |
| Create Activity | `create-activity` | New activity form |
| Edit Activity | `edit-activity` | Edit existing activity |
| Activity Progress | `activityprogress` | Activity progress & goals |
| Task/Activity List | `list` | Filtered list view |
| Search | `search` | Full search across tasks/activities |
| Notifications | `notifications` | Notification center |
| Set Reminder | `set-reminder` | Configure reminders |
| Set Reminder (Premium) | `set-reminder-premium` | AI-powered reminder styles |
| Reminder List | `reminder-list` | All scheduled reminders |
| Premium Plan | `premium-plan` | Subscription plans |
| Payment | `payment` | Payment method selection |
| Payment Success | `payment-success` | Confirmation screen |
| Payment Rejected | `payment-rejected` | Failure screen |
| Transfer Detail | `detail-transfer` | Bank transfer instructions |

## Project Structure

```
src/
├── app/
│   ├── (tabs)/           # 3 main tabs (index, calendar, profile)
│   ├── _layout.tsx       # Root layout with auth routing
│   └── *.tsx             # 15+ standalone screens
├── api/                  # API modules (tasks, activities, tags, payments, …)
├── auth/                 # Auth context, API, secure storage
├── components/           # Reusable components (BottomNav, pickers, cards, …)
├── constants/            # Theme, navigation config
├── hooks/                # Custom hooks (useTasks, useActivities, …)
├── lib/                  # Utilities (i18n, notifications, reminders)
└── types/                # TypeScript type definitions
assets/                   # Images, icons, fonts
```

## Server State (TanStack Query)

All server data is managed through custom hooks backed by TanStack React Query:

| Hook | Purpose |
| --- | --- |
| `useTasks` | Task CRUD mutations + queries |
| `useActivities` | Activity CRUD mutations + queries |
| `useTags` | Tag management |
| `useReminders` | Reminder scheduling & sync |
| `useNotificationHistory` | Notification history tracking |
| `useCurrentUser` | Current authenticated user accessor |
| `usePersistentState` | AsyncStorage-backed persistent state |
| `useGradualAnimation` | Keyboard-aware animation |
| `useBottomBarSpace` | Bottom nav spacing utility |

## API Integration

The `apiFetch` wrapper in `src/api/client.ts` handles authentication headers, error mapping, and response unwrapping. The base URL is auto-detected per platform:

| Platform | Base URL |
| --- | --- |
| iOS Simulator | `http://localhost:8000/api` |
| Android Emulator | `http://10.0.2.2:8000/api` |
| Physical Device | `http://<host-LAN-IP>:8000/api` |
| Web | `http://localhost:8000/api` |

> [!NOTE]
> Override the auto-detected URL by setting `EXPO_PUBLIC_API_URL` in `.env.local`.

### API Modules

| Module | Endpoints |
| --- | --- |
| `tasks.ts` | CRUD `/tasks` |
| `activities.ts` | CRUD `/activities` |
| `tags.ts` | CRUD `/tags` |
| `payments.ts` | `/subscriptions`, `/payments` |
| `reminders.ts` | `/me/reminder-settings`, `/reminders/generate-messages` |
| `users.ts` | `/me` GET/PATCH |

## Key Components

| Component | Description |
| --- | --- |
| `BottomNav` | Custom animated bottom navigation bar (3 tabs) |
| `ScheduleCard` | Task/activity card with contextual actions |
| `ProgressCard` | Progress visualization card |
| `DatePickerModal` | Platform-specific date picker (iOS / Android / Web) |
| `TimePickerModal` | Platform-specific time picker |
| `DatePickerCalendar` | Inline calendar date picker |
| `TagSelector` | Tag picker with color indicators |
| `GoalsChecklistModal` | Activity goals checklist |
| `TimePicker` | Time selection component |

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `start` | `expo start` | Start Expo dev server |
| `start:mock` | `EXPO_PUBLIC_MOCK_AUTH=true expo start` | Start with mock auth |
| `android` | `expo run:android` | Build + run on Android |
| `ios` | `expo run:ios` | Build + run on iOS |
| `web` | `expo start --web` | Start web dev server |
| `lint` | `expo lint` | Run ESLint |

## Mock Auth

For development without the backend, enable mock authentication:

```bash
# Option 1: use the script
bun start:mock

# Option 2: set in .env.local
EXPO_PUBLIC_MOCK_AUTH=true
```

> [!IMPORTANT]
> Mock auth bypasses all API calls and uses hardcoded user data. Disable it before testing against a real backend.

## App Configuration

| Setting | Value |
| --- | --- |
| Bundle ID | `com.rifky.dueday` |
| URL Scheme | `duedayfe://` |
| Orientation | Portrait |
| React Compiler | Enabled |
| Typed Routes | Enabled |
| New Architecture | Required |
