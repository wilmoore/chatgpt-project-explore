# Raycast Extension: ChatGPT Project Explorer

**Branch:** `feature/raycast-extension`
**Epic:** E-006 Desktop Integrations
**Status:** Completed

---

## Summary

Build a Raycast extension that provides Command-K style quick search and open for ChatGPT projects. This extends the Project Explorer to macOS desktop via Raycast's native launcher experience.

---

## Requirements

### Functional
1. User invokes Raycast command → sees searchable list of all projects
2. User types to filter projects (fast, client-side filtering via Raycast's built-in)
3. User selects a project → opens ChatGPT URL in default browser
4. API URL configured via Raycast extension preferences

### Technical
- Support both Custom API and Supabase REST API (per ADR-003)
- Auto-detect API type from URL pattern (`/rest/v1` = Supabase)
- TypeScript + React (Raycast's stack)
- Located at `/extensions/raycast/`

### Non-Goals (First Iteration)
- Favorites/Recents (future enhancement)
- Caching/offline mode
- Multiple API configurations

---

## Design Decisions

### API Detection (ADR-003 Aligned)
```
URL contains "/rest/v1" → Supabase mode
  - Endpoint: {baseURL}/projects
  - Fields: id, title, url, created_at, updated_at

Otherwise → Custom API mode
  - Meta: {baseURL}/meta (for validation only)
  - Projects: {baseURL}/projects
  - Fields: id, name, open_url, description, created_at, updated_at
```

### Repo Structure
```
chatgpt-project-explore/
├── extensions/
│   └── raycast/
│       ├── package.json
│       ├── tsconfig.json
│       ├── raycast-env.d.ts
│       ├── src/
│       │   ├── search-projects.tsx   # Main command
│       │   ├── api.ts                # API client
│       │   └── types.ts              # Shared types
│       └── assets/
│           └── extension-icon.png
├── ProjectExplorer/                   # iOS app (existing)
└── ...
```

---

## Implementation Steps

### Step 1: Scaffold Raycast Extension
- Create `/extensions/raycast/` directory structure
- Initialize `package.json` with Raycast dependencies
- Configure `tsconfig.json` for Raycast
- Add extension manifest in `package.json`

### Step 2: Implement Types (`src/types.ts`)
- Define `Project` interface (unified across API types)
- Define API response types

### Step 3: Implement API Client (`src/api.ts`)
- Port logic from Swift `APIClient.swift`
- `isSupabaseAPI(url)` - detect API type
- `fetchProjects(baseURL)` - fetch and normalize
- Error handling with user-friendly messages

### Step 4: Implement Main Command (`src/search-projects.tsx`)
- Use Raycast `List` component
- `useFetch` or `useEffect` for data loading
- `List.Item` for each project with:
  - Title: project name
  - Subtitle: project description (if available)
  - Action: Open in Browser
- Loading and error states

### Step 5: Add Preferences
- `apiUrl` preference (required string)
- Validate URL format
- Show setup guidance if not configured

### Step 6: Polish
- Add extension icon
- Update root `.gitignore` for `extensions/raycast/node_modules`
- Add README with setup instructions

---

## Acceptance Criteria

- [ ] Extension appears in Raycast with "Search Projects" command
- [ ] Projects load from configured API URL
- [ ] Typing filters projects in real-time
- [ ] Selecting a project opens ChatGPT URL in browser
- [ ] Works with both Custom API and Supabase endpoints
- [ ] Error state shown for invalid/unreachable API
- [ ] Preference screen guides API URL setup

---

## Files to Create

| File | Purpose |
|------|---------|
| `extensions/raycast/package.json` | Package manifest with Raycast config |
| `extensions/raycast/tsconfig.json` | TypeScript configuration |
| `extensions/raycast/raycast-env.d.ts` | Raycast type declarations |
| `extensions/raycast/src/types.ts` | Shared type definitions |
| `extensions/raycast/src/api.ts` | API client logic |
| `extensions/raycast/src/search-projects.tsx` | Main search command |
| `extensions/raycast/assets/extension-icon.png` | Extension icon |

---

## Related

- **ADR-003:** Support Multiple API Formats
- **ADR-004:** Raycast Extension Architecture
- **Epic E-006:** Desktop Integrations
- **iOS Reference:** `ProjectExplorer/Services/APIClient.swift`
