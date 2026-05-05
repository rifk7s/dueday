# dueday-fe — Expo Frontend

## Stack

- **Expo** SDK 54.0.33, **React** 19.1.0, **React Native** 0.81.5
- **Expo Router** v6 — file-based routing, typed routes enabled
- **Styling** — `StyleSheet.create()` (current approach); NativeWind v5-preview + Tailwind CSS v4 is installed but not yet used in components
- **Navigation** — React Navigation (bottom-tabs, native, elements) + custom `BottomNav`
- **Animation** — Reanimated v4 + Gesture Handler v2 (New Architecture required)
- **Language** — TypeScript strict mode, ESLint v9 (flat config)
- **Package manager** — `npm` (bun.lock exists but use npm scripts)

## Commands

```bash
# Development
npm run start              # Expo dev server (Metro) — use for JS-only changes
npm run ios                # iOS simulator build + Metro
npm run android            # Android emulator build + Metro
npm run web                # Web dev server
npm run lint               # ESLint

# Troubleshooting
npx expo start --clear     # Clear Metro cache — run when Tailwind classes stop updating
npx expo prebuild --clean  # Regenerate android/ ios/ — run after any app.json plugin change
npx expo doctor            # Diagnose SDK/dependency mismatches
npx expo install --fix     # Auto-fix package version mismatches

# EAS (cloud)
eas build --profile development   # Build dev client (TestFlight/Play Store alpha)
eas update --branch production    # Push OTA JS update
```

> Use `npm run start` for daily work. Only use `npm run ios` / `npm run android` after adding a native library or changing config plugins.

## File Structure

```
src/
  app/                    # Expo Router screens (file = route)
    _layout.tsx           # App shell — imports global.css, sets up navigation
    index.tsx             # Dashboard / home screen
    calendar.tsx          # Calendar screen
    profile.tsx           # Profile screen
  components/
    BottomNav.tsx         # Custom bottom tab bar (not React Navigation default)
  constants/
    theme.ts              # Design tokens — ALL colors, typography, spacing live here
  global.css              # Tailwind + NativeWind entry (imported once in _layout.tsx)
assets/                   # Images, icons, fonts
```

Path aliases (`tsconfig.json`):
- `@/*` → `src/*` (e.g. `@/constants/theme`, `@/components/BottomNav`)
- `@/assets/*` → `assets/*`

## Styling

**Current approach: `StyleSheet.create()`** — every component (`index.tsx`, `calendar.tsx`, `profile.tsx`, `BottomNav.tsx`) uses it. This is the established pattern; follow it for new code.

**NativeWind is installed but dormant.** The infrastructure is wired up:
- `global.css` imports `tailwindcss` + `nativewind/theme`
- `metro.config.js` wraps with `withNativewind`
- `nativewind-env.d.ts` provides TypeScript types

NativeWind compiles Tailwind CSS v4 into native `StyleSheet` objects at build time and handles conditional styles (hover, focus, media/container queries) at runtime. It is NOT active in any component yet. If asked to use it, you can add `className` props — but check with the user before switching approach mid-feature.

- **All colors, spacing, typography → `src/constants/theme.ts`**. Never hardcode hex values or magic numbers in either approach.
- Platform-specific files: `.web.tsx`, `.native.tsx`, `.ios.tsx`, `.android.tsx`
- NEVER modify `metro.config.js` or `postcss.config.mjs` without checking NativeWind v5 docs (https://www.nativewind.dev/v5/llms.txt)
- NativeWind v5 full docs available at: https://www.nativewind.dev/v5/llms-full.txt

## Routing (Expo Router)

- Screens live in `src/app/`. Filename = route path. `_layout.tsx` = layout wrapper.
- Typed routes are on (`experiments.typedRoutes: true` in `app.json`). Use typed `href` values.
- Navigate: `router.push('/calendar')` · `router.replace('/')` · `router.back()`
- Link component: `<Link href="/profile">Profile</Link>`
- `BottomNav.tsx` is a fully custom component — not the default React Navigation tab bar.

## SDK 54 Gotchas

- **`lightningcss` is pinned to `1.30.1`** in `package.json` overrides. Removing or bumping it breaks NativeWind with a `failed to deserialize` crash. Never touch this pin.
- **New Architecture is required.** Reanimated v4 (`~4.1.1`) does not work without it. Never set `newArchEnabled: false`.
- **React Compiler is on** (`experiments.reactCompiler: true`). All components and hooks must strictly follow Rules of Hooks.
- **Hermes only** — no JSC. Do not use JSC-only APIs.
- **Android edge-to-edge** is enabled by default. Always use `useSafeAreaInsets()` for layout.
- **Reanimated v4** uses `react-native-worklets` (^0.5.1). Do not use old v3 patterns (`.value` setter syntax differs in worklets).
- **`expo-av` is removed** in SDK 54. Use `expo-audio` or `expo-video` instead.
- **`expo-file-system` legacy API** lives at `expo-file-system/legacy`. Default import is the new API.

## Hard Constraints

- NEVER hardcode colors (`"#fff"`, `"rgba(..."`) — use tokens from `src/constants/theme.ts`
- NEVER disable New Architecture (`newArchEnabled: false`)
- NEVER use `expo-av` — use `expo-audio` / `expo-video`
- NEVER modify `metro.config.js` or `postcss.config.mjs` without consulting NativeWind v5 docs
- NEVER bump or remove the `lightningcss` override in `package.json` (pins to `1.30.1` — removing causes NativeWind `failed to deserialize` crash)

## Testing

```bash
npm test      # Jest (standard Expo config)
```

No E2E setup. Write unit tests with Jest + React Native Testing Library.

## Design Reference

`DESIGN.md` in this folder documents the design system — colors, spacing scale, component specs. Read it before building new UI.
