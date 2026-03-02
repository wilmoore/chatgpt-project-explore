# Feature: JSON File as Primary Data Source

**Branch:** `feat/json-file-fallback-source`
**Status:** Ready for implementation
**Created:** 2026-02-25
**Revised:** 2026-02-25

## Problem Statement

When the Supabase edge function isn't running (e.g., after a reboot), the Raycast extension cannot fetch project data. Users must manually start the edge function before using the project explorer.

## Solution

Use the local `projects.json` file (written by `chatgpt-project-indexer`) as the primary data source. The extension reads directly from the JSON file.

**Dual-mode behavior:**
- `apiUrl` **set** → Try API, no fallback (fail if API unavailable)
- `apiUrl` **empty** → Read JSON file only

This preserves the ability to re-enable API support later if needed.

## Hardcoded JSON Path

```
~/Documents/src/chatgpt-project-indexer/projects.json
```

The path is normalized using `path.join()` to handle spaces correctly.

**Note:** Making this configurable is out of scope for this feature.

## Related ADRs

- **ADR-003**: Multiple API format support (Custom API, Supabase REST)
- **ADR-009**: Dynamic API URL discovery via `~/.chatgpt-indexer/api-url.json`

This feature bypasses ADR-003's API approach in favor of local JSON when no API is configured.

## Schema Mapping

### Source: projects.json

```typescript
interface JsonStorageFile {
  version: number;
  lastUpdatedAt: string;  // ISO 8601
  projects: Array<{
    id: string;           // e.g., "g-p-69528ed..."
    title: string;        // Full project name
    firstSeenAt: string;  // ISO 8601
    lastConfirmedAt: string;  // ISO 8601
  }>;
}
```

### Target: Raycast Project type

```typescript
interface Project {
  id: string;
  name: string;
  openUrl: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Mapping

| JSON Field | Raycast Field | Transformation |
|------------|---------------|----------------|
| `id` | `id` | direct |
| `title` | `name` | direct |
| `firstSeenAt` | `createdAt` | direct |
| `lastConfirmedAt` | `updatedAt` | direct |
| (constructed) | `openUrl` | `https://chatgpt.com/g/p-${id}` |

### Search Impact

The extension uses Fuse.js fuzzy search with keys:
- `name` (weight: 0.7) - maps from JSON `title`
- `description` (weight: 0.3) - JSON doesn't have this field (never did)

Search functionality is unchanged - there was never a description field in the database/JSON.

## Implementation Steps

### Step 1: Add Types (types.ts)

Add `JsonStorageProject` and `JsonStorageFile` interfaces.

```typescript
/**
 * Project record from local JSON storage file.
 * Written by chatgpt-project-indexer.
 */
export interface JsonStorageProject {
  id: string;
  title: string;
  firstSeenAt: string;
  lastConfirmedAt: string;
}

/**
 * Schema for projects.json file written by chatgpt-project-indexer.
 */
export interface JsonStorageFile {
  version: number;
  lastUpdatedAt: string;
  projects: JsonStorageProject[];
}
```

### Step 2: Add Constants (constants.ts)

Add the normalized JSON file path and error strings.

```typescript
import { homedir } from "os";
import { join } from "path";

export const JSON_STORAGE_PATH = join(
  homedir(),
  "Documents",
  "src",
  "chatgpt-project-indexer",
  "projects.json"
);
```

Update STRINGS.error:

```typescript
error: {
  title: "Failed to Load Projects",
  fallbackDescription: "Please check your API URL and try again.",
  retry: "Retry",
  openPreferences: "Open Preferences",
  jsonFileNotFound: "JSON file not found at ${JSON_STORAGE_PATH}. Run the indexer to generate it.",
  jsonFileInvalid: "JSON file is corrupted at ${JSON_STORAGE_PATH}.",
}
```

### Step 3: Add JSON Reader Function (api.ts)

Add `fetchFromJsonFile()` function that:
1. Reads the JSON file synchronously
2. Validates the schema (version === 1)
3. Maps to `Project[]` format

```typescript
import { readFileSync } from "fs";
import { JSON_STORAGE_PATH } from "./constants";
import type { JsonStorageFile, JsonStorageProject } from "./types";

/**
 * Converts a JSON storage project to unified Project format.
 */
function fromJsonStorage(project: JsonStorageProject): Project {
  return {
    id: project.id,
    name: project.title,
    openUrl: `${CHATGPT_PROJECT_URL_BASE}${project.id}`,
    createdAt: project.firstSeenAt,
    updatedAt: project.lastConfirmedAt,
  };
}

/**
 * Reads projects from local JSON storage file.
 * @throws Error if file doesn't exist or is invalid
 */
function fetchFromJsonFile(): Project[] {
  try {
    const content = readFileSync(JSON_STORAGE_PATH, "utf-8");
    const data = JSON.parse(content) as JsonStorageFile;

    if (data.version !== 1 || !Array.isArray(data.projects)) {
      throw new Error(STRINGS.error.jsonFileInvalid);
    }

    return data.projects.map(fromJsonStorage);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("ENOENT") || err.message.includes("no such file")) {
        throw new Error(STRINGS.error.jsonFileNotFound);
      }
      throw new Error(STRINGS.error.jsonFileInvalid);
    }
    throw new Error(STRINGS.error.jsonFileInvalid);
  }
}
```

### Step 4: Modify fetchProjects() (api.ts)

Implement dual-mode logic:

```typescript
export async function fetchProjects(): Promise<Project[]> {
  const preferences = getPreferenceValues<Preferences>();
  const apiUrl = preferences.apiUrl;

  // If API URL is configured, use API only (no fallback)
  if (apiUrl) {
    if (isEdgeFunctionAPI(apiUrl)) {
      return await fetchEdgeFunctionProjects(apiUrl);
    } else if (isSupabaseAPI(apiUrl)) {
      return await fetchSupabaseProjects(apiUrl);
    } else {
      return await fetchCustomAPIProjects(apiUrl);
    }
  }

  // No API configured - use JSON file
  return fetchFromJsonFile();
}
```

### Step 5: Update search-projects.tsx

Remove or relax the apiUrl empty check. Options:

**Option A (recommended):** Remove the check entirely - extension works zero-config

```typescript
// Remove lines 44-64 (the apiUrl check that shows setup screen)
```

**Option B:** Keep but show different message

Either way, we should remove the now-unused `apiUrl` preference read if we're allowing zero-config.

## Testing Plan

1. **apiUrl empty, JSON exists:** Verify projects load from JSON
2. **apiUrl empty, JSON missing:** Verify clear error with path
3. **apiUrl set, API available:** Verify normal API path works
4. **apiUrl set, API unavailable:** Verify error (no fallback)
5. **Search:** Verify fuzzy search works on project names

## Files to Modify

1. `extensions/raycast/src/types.ts` - Add JSON types
2. `extensions/raycast/src/constants.ts` - Add JSON path constant and error strings
3. `extensions/raycast/src/api.ts` - Add fetchFromJsonFile() and modify fetchProjects()
4. `extensions/raycast/src/search-projects.tsx` - Remove apiUrl empty check

## Definition of Done

- [ ] Types added for JSON storage schema
- [ ] JSON path constant added (normalized)
- [ ] Error strings added with full path
- [ ] fetchFromJsonFile() function implemented
- [ ] fetchProjects() modified with dual-mode logic
- [ ] search-projects.tsx updated (apiUrl check removed)
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manual testing: JSON-only mode works
- [ ] Manual testing: API mode works
- [ ] Manual testing: Error messages show correct path

## Known Issues

1. **No configurable path:** The JSON path is hardcoded. Future work: add preference field or well-known path convention.
2. **Sync file read:** Uses `readFileSync` which blocks the thread. Acceptable for now; can switch to async if problematic.
3. **No fallback when API set:** If API is configured but unavailable, users see an error. Could add JSON fallback in the future if desired.
4. **No description field:** The JSON doesn't include project descriptions. Search weight for description (0.3) is effectively unused.
