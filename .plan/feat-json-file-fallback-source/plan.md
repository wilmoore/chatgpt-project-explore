# Feature: JSON File Fallback Source

**Branch:** `feat/json-file-fallback-source`
**Status:** Planning complete, ready for implementation
**Created:** 2026-02-25

## Problem Statement

When the Supabase edge function isn't running (e.g., after a reboot), the Raycast extension cannot fetch project data. Users must manually start the edge function before using the project explorer.

## Solution

Add the local `projects.json` file (written by `chatgpt-project-indexer`) as a fallback data source. When the API fails, silently fall back to reading from the JSON file.

## Hardcoded JSON Path

```
~/Documents/src/chatgpt-project-indexer/projects.json
```

**Note:** Making this configurable is out of scope for this feature.

## Related ADRs

- **ADR-003**: Multiple API format support (Custom API, Supabase REST)
- **ADR-009**: Dynamic API URL discovery via `~/.chatgpt-indexer/api-url.json`

This feature extends ADR-003 by adding a fourth data source (local JSON file) as fallback.

## Schema Mapping

### Source: projects.json

```typescript
interface JsonStorageFile {
  version: 1;
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

## Implementation Steps

### Step 1: Add Types (types.ts)

Add `JsonStorageFile` and `JsonStorageProject` interfaces.

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

### Step 2: Add Constant (constants.ts)

Add the hardcoded JSON file path.

```typescript
export const JSON_STORAGE_PATH = join(
  homedir(),
  "Documents/src/chatgpt-project-indexer/projects.json"
);
```

### Step 3: Add JSON Reader Function (api.ts)

Add `fetchFromJsonFile()` function that:
1. Reads the JSON file synchronously (Raycast prefers sync for preferences)
2. Validates the schema (version === 1)
3. Maps to `Project[]` format

```typescript
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
 * Returns undefined if file doesn't exist or is invalid.
 */
function fetchFromJsonFile(): Project[] | undefined {
  try {
    const content = readFileSync(JSON_STORAGE_PATH, "utf-8");
    const data = JSON.parse(content) as JsonStorageFile;

    if (data.version !== 1 || !Array.isArray(data.projects)) {
      return undefined;
    }

    return data.projects.map(fromJsonStorage);
  } catch {
    return undefined;
  }
}
```

### Step 4: Modify fetchProjects() (api.ts)

Wrap existing API call in try/catch and fall back to JSON file.

```typescript
export async function fetchProjects(): Promise<Project[]> {
  const resolved = getCurrentApiUrl();

  // Try API first if configured
  if (resolved) {
    try {
      const { url } = resolved;
      if (isEdgeFunctionAPI(url)) {
        return await fetchEdgeFunctionProjects(url);
      } else if (isSupabaseAPI(url)) {
        return await fetchSupabaseProjects(url);
      } else {
        return await fetchCustomAPIProjects(url);
      }
    } catch {
      // API failed, try JSON fallback
    }
  }

  // Fallback to JSON file
  const jsonProjects = fetchFromJsonFile();
  if (jsonProjects) {
    return jsonProjects;
  }

  throw new Error(
    "Unable to fetch projects. API unavailable and JSON file not found."
  );
}
```

### Step 5: Update Error Messages (constants.ts)

Update STRINGS with new error message.

```typescript
error: {
  title: "Failed to Load Projects",
  fallbackDescription: "Please check your API URL and try again.",
  noSourceAvailable: "API unavailable and local JSON file not found.",
  // ...
}
```

## Testing Plan

1. **API available:** Verify normal API path still works
2. **API unavailable, JSON exists:** Stop edge function, verify fallback works
3. **API unavailable, JSON missing:** Verify clear error message
4. **JSON malformed:** Verify graceful handling (falls through to error)

## Files to Modify

1. `extensions/raycast/src/types.ts` - Add JSON types
2. `extensions/raycast/src/constants.ts` - Add JSON path constant
3. `extensions/raycast/src/api.ts` - Add fallback logic

## Definition of Done

- [ ] Types added for JSON storage schema
- [ ] JSON path constant added
- [ ] `fetchFromJsonFile()` function implemented
- [ ] `fetchProjects()` modified with fallback logic
- [ ] Error message updated
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manual testing: API available works
- [ ] Manual testing: API unavailable falls back to JSON
- [ ] Manual testing: Neither available shows clear error
