# Expo Frontend Guidelines

**Stack**: React 19, React Native, Expo, TypeScript, Tailwind v4, react-native-web

**Structure**:
```
src/
├── app/          → Expo Router (app shell, routing)
├── components/   → Reusable UI components
├── hooks/        → Custom React hooks
└── constants/    → Config, theme constants
```

**Commands**:
```bash
npm run dev      # Start dev server
npm run build    # Build for production
expo prebuild    # Generate native code
expo start --clear   # Clear cache if changes don't reflect
```

**Code Style**:
- Functional components with hooks
- TypeScript: `type Props = {}` or `interface Props {}`
- Named exports: `export function Component() {}`
- Explicit return types on all functions

**Styling**:
- Tailwind for web, NativeWind for cross-platform
- Platform-specific: `.web.tsx`, `.native.tsx`, `.tsx` (shared)
- Theme constants in `src/constants/theme.ts`

**Platform-Specific Files**:
```
component.tsx          → Shared
component.web.tsx      → Web only
component.native.tsx   → Native only
```

**Routing**: Expo Router, use `href` for navigation

**Testing**: Jest for unit tests, Detox for E2E

**Deployment**: EAS Build → TestFlight/Google Play, EAS Update for OTA

**Hooks**: `useColorScheme()`, `useTheme()` available in `src/hooks/`

**Available Skills**:
- `building-native-ui/` — UI, theming, animations
- `expo-deployment/` — TestFlight, Play Store
- `expo-cicd-workflows/` — EAS Build, CI/CD
- `expo-dev-client/` — Dev setup
- `upgrading-expo/` — Version upgrades
- `expo-module/` — Native modules
- `expo-tailwind-setup/` — Tailwind config
- `eas-update-insights/` — EAS monitoring
- `native-data-fetching/` — Router loaders
- `use-dom/` — Web DOM patterns
- `expo-api-routes/` — API routes
- `expo-ui-swiftui/` — SwiftUI integration
- `expo-ui-jetpack-compose/` — Compose integration

**Never**:
- Change dependencies without approval
- Add new top-level directories
- Create manual test scripts
- Commit without checking existing patterns first

*Managed by: Expo CLI*
