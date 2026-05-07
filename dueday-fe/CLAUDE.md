# dueday-fe — Expo Frontend

## Stack

- **Expo** SDK 54.0.33, **React** 19.1.0, **React Native** 0.81.5
- **Expo Router** v6 — file-based routing, typed routes enabled
- **Styling** — `StyleSheet.create()` (current approach); NativeWind v5-preview + Tailwind CSS v4 is installed but not yet used in components
- **Navigation** — React Navigation (bottom-tabs, native, elements) + custom `BottomNav`
- **Animation** — Reanimated v4 + Gesture Handler v2 (New Architecture required)
- **Language** — TypeScript strict mode, ESLint v9 (flat config)
- **Package manager** — `bun` (use `bun run <script>` and `bunx`)

## Commands

```bash
# Development
bun run start              # Expo dev server (Metro)
bun run ios                # iOS simulator build + Metro
bun run android            # Android emulator build + Metro
bun run web                # Web dev server
bun run lint               # ESLint via expo lint

# Troubleshooting
bunx expo start --clear    # Clear Metro cache (run after adding fonts/assets)
bunx expo prebuild --clean # Regenerate android/ ios/ — after app.json plugin change
bunx expo doctor           # Diagnose SDK/dependency mismatches
bunx expo install --fix    # Auto-fix package version mismatches
bunx tsc --noEmit          # Type check
```

> Use `bun run start` for daily work. Only use `bun run ios` / `bun run android` after adding a native library or changing config plugins.
> When installing new packages, prefer `bunx expo install <pkg>` over `bun add` so versions stay SDK-compatible.

## File Structure

`src/app/` is Expo Router (file = route). `src/components/`, `src/constants/`, and `src/global.css` hold shared code.

**Why the `(tabs)` group exists:** screens that should always show BottomNav live inside `src/app/(tabs)/` (dashboard, calendar, profile). Screens that should NOT show it (login, list, list-activity, create-task, create-activity, etc.) live at `src/app/` root. BottomNav is mounted in `(tabs)/_layout.tsx` so it only renders for routes within that group — no pathname checks needed. The `(tabs)` folder name is excluded from URL paths by Expo Router convention.

Path aliases (`tsconfig.json`):
- `@/*` → `src/*` (e.g. `@/constants/theme`, `@/components/BottomNav`)
- `@/assets/*` → `assets/*`

## Styling

**Current approach: `StyleSheet.create()`** — every screen and component uses it. This is the established pattern; follow it for new code.

- **All colors, fonts, spacing → `src/constants/theme.ts`**. Never hardcode hex values, font names, or magic numbers.
- **NativeWind is installed but dormant.** Infrastructure (`global.css`, `metro.config.js` `withNativewind`, `nativewind-env.d.ts`) is wired but no component uses `className` yet. If asked to use it, check with the user before switching approach mid-feature.
- Platform-specific files: `.web.tsx`, `.native.tsx`, `.ios.tsx`, `.android.tsx`
- NEVER modify `metro.config.js` or `postcss.config.mjs` without consulting NativeWind v5 docs (https://www.nativewind.dev/v5/llms.txt — full: `/llms-full.txt`)

### Fonts (Lexend)

Lexend is loaded via `@expo-google-fonts/lexend` in `src/app/_layout.tsx` (weights 400/500/600/700/800/900) with splash screen gating until fonts resolve.

- Use the `fonts` map from `@/constants/theme` — keyed by `fontWeight` string: `fonts["400"]` → `Lexend_400Regular`, `fonts["700"]` → `Lexend_700Bold`, etc.
- **Always set `fontFamily` on Text/TextInput styles, never just `fontWeight`.** Custom fonts in RN do NOT auto-select a variant from `fontWeight` — and on iOS, combining `fontFamily: "Lexend_700Bold"` with `fontWeight: "700"` makes iOS silently fall back to the system font.
- `typography` tokens (h1/h2/h3/bodyLg/bodySm/labelBold/button) already point at the right variant via `fontFamily` only — pull them as `typography.h2.fontFamily`, not `typography.h2.fontWeight`.
- Adding a new weight: add the key to `fonts`, add the variant import in `_layout.tsx` `useFonts({...})`, then run `bunx expo start --clear` (Metro caches font registrations).
- `Text.defaultProps` / `TextInput.defaultProps` does NOT work in React 19 (function components ignore it) — explicit `fontFamily` per style is mandatory.

## Linting

```bash
bun run lint    # ESLint + React Compiler rules + @typescript-eslint/no-deprecated
```

Config lives in `eslint.config.js` (flat). On top of `eslint-config-expo/flat` it adds:
- **`eslint-plugin-react-hooks@^7.1.1`** (overridden in `package.json` → `overrides`, since `eslint-config-expo` ships v5.2). Provides the React Compiler ruleset (`react-hooks/set-state-in-effect`, `purity`, `refs`, etc.) at `recommended-latest`. **Demoted to `warn`** so violations surface but don't fail CI — fix gradually.
- **`@typescript-eslint/no-deprecated`** at `warn`, scoped to `src/**/*.{ts,tsx}` with typed linting (`projectService: true`). Surfaces `@deprecated` JSDoc tags (e.g. `SafeAreaView` from `react-native`) at lint time, not just in VSCode.
- **DO NOT install `eslint-plugin-react-compiler`** — it's superseded by `eslint-plugin-react-hooks@7+`. The package never reached stable; rules were merged into react-hooks per the [React Compiler 1.0 announcement](https://react.dev/blog/2025/10/07/react-compiler-1).
- **DO NOT remove the `eslint-plugin-react-hooks` override** in `package.json` — without it, expo's nested v5.2 wins and the new rules error out with "Could not find rule".
- VSCode shows ESLint + TypeScript diagnostics inline; the CLI (`bun run lint`) only runs ESLint. Run `bunx tsc --noEmit` separately for type errors.

## Routing (Expo Router)

- Root `_layout.tsx` is a **Stack** — wraps everything, no tab bar.
- `(tabs)/_layout.tsx` is a **Tabs** — only the 3 main screens get BottomNav.
- New screens that need BottomNav → add inside `src/app/(tabs)/`.
- New screens that should NOT have BottomNav (detail, auth, modal, create-*) → add at `src/app/` root.
- Typed routes are on (`experiments.typedRoutes: true` in `app.json`). Use typed `href` values.
- Navigate: `router.push('/calendar')` · `router.replace('/login')` · `router.back()`
- Link component: `<Link href="/profile">Profile</Link>`

## Keyboard handling

Forms with a sticky footer above the keyboard (e.g. Simpan button on `create-task.tsx`, `create-activity.tsx`) follow this pattern — replicate it for new form screens:

- Wrap fields in `KeyboardAwareScrollView` from `react-native-keyboard-controller`. Don't use the built-in `KeyboardAvoidingView` — it doesn't handle the sticky-footer + multiline case cleanly.
- Footer is `<Animated.View position: absolute>` driven by `useGradualAnimation()` (custom hook in `src/hooks/`). It reads keyboard height as a Reanimated shared value and slides the footer up in sync with the keyboard, while `paddingBottom` interpolates from `bottom + 16` (closed) to `16` (open) so the safe-area inset only applies when the keyboard is hidden.
- **Measure the footer with `onLayout`** and pass `bottomOffset={footerHeight + 16}` to `KeyboardAwareScrollView`. Don't hard-code a number — it desyncs across screen sizes (iPhone SE vs Pro Max) and silently breaks if footer styling changes.
- For multiline `TextInput` (description-style fields) the focused field's bottom doesn't move as the user types, so cursor can drift below the visible area. Fix: take a `scrollRef` on `KeyboardAwareScrollView`, track focus via `useRef<boolean>` (`onFocus`/`onBlur`), and call `scrollRef.current?.scrollToEnd({ animated: true })` from `onContentSizeChange` ONLY when focus ref is true AND `newHeight > prevHeightRef.current`. The focus guard stops the page from jumping on initial mount (`onContentSizeChange` fires on first measure); the height comparison stops jumpiness when deleting text.

## SDK 54 Gotchas

- **`lightningcss` pinned to `1.30.1`** in `package.json` overrides. Removing breaks NativeWind with `failed to deserialize`. Never touch.
- **New Architecture required.** Reanimated v4 doesn't work without it. Never set `newArchEnabled: false`.
- **React Compiler on** (`experiments.reactCompiler: true`). All components/hooks must follow Rules of React — see `react-hooks/*` warnings from `bun run lint`.
- **Hermes only** — no JSC.
- **Android edge-to-edge enabled** by default. Always use `useSafeAreaInsets()` for layout.
- **`SafeAreaView` from `react-native` is deprecated** — import from `react-native-safe-area-context` instead. Lint catches this via `@typescript-eslint/no-deprecated`.
- **Reanimated v4** uses `react-native-worklets` (^0.5.1). Do not use old v3 patterns.
- **`expo-av` removed** in SDK 54. Use `expo-audio` / `expo-video`.
- **`expo-file-system` legacy API** lives at `expo-file-system/legacy`. Default import is the new API.

## Hard Constraints

- NEVER hardcode colors, font names, or font weights — use `colors`, `fonts`, `typography` from `src/constants/theme.ts`
- NEVER set `fontWeight` on Text styles — set `fontFamily: fonts["X"]` instead (see Fonts section)
- NEVER disable New Architecture (`newArchEnabled: false`)
- NEVER use `expo-av` — use `expo-audio` / `expo-video`
- NEVER modify `metro.config.js` or `postcss.config.mjs` without consulting NativeWind v5 docs
- NEVER bump/remove the `lightningcss@1.30.1` or `eslint-plugin-react-hooks@^7.1.1` overrides in `package.json`
- NEVER hard-code `bottomOffset` on `KeyboardAwareScrollView` — measure the sticky footer with `onLayout` (see Keyboard handling section)

## Design Reference

`DESIGN.md` in this folder documents the design system — colors, spacing scale, component specs, Lexend typography. Read it before building new UI.
