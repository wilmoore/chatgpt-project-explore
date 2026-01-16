# Implementation Plan: Touch Project API

## Overview

This plan adds a "Touch Project" action to the Raycast extension that queues a touch request to move a project to the top of the list.

## Implementation Steps

### Step 1: Create Constants File

**File**: `extensions/raycast/src/constants.ts`

```typescript
/**
 * Standard Supabase local development anon key.
 * This is a well-known value identical for all `supabase start` instances.
 * Published in Supabase docs - not a secret.
 */
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
```

### Step 2: Add Touch API Function

**File**: `extensions/raycast/src/api.ts`

Add `touchProject` function:
- Extract base URL from API URL (strip `/projects` if present)
- Build touch_queue endpoint URL
- POST with project_id in body
- Include apikey header
- Throw error if not Supabase API

### Step 3: Add Preference for Toast Behavior

**File**: `extensions/raycast/package.json`

Add new preference:
```json
{
  "name": "showTouchToast",
  "type": "checkbox",
  "required": false,
  "default": true,
  "title": "Show Touch Notification",
  "description": "Show a toast notification when a project is touched"
}
```

### Step 4: Add Touch Action to Project Items

**File**: `extensions/raycast/src/search-projects.tsx`

Add new action in ActionPanel:
- Title: "Touch Project"
- Icon: Icon.ArrowUp (or Icon.Pin)
- Keyboard shortcut: Cmd+T
- Conditionally render only for Supabase API
- Show toast on success/failure based on preference

## Detailed Code Changes

### api.ts Changes

```typescript
import { SUPABASE_ANON_KEY } from "./constants";

/**
 * Queues a touch request for a project.
 * Only works with Supabase API.
 * Touch moves the project to the top of the list.
 */
export async function touchProject(baseUrl: string, projectId: string): Promise<void> {
  if (!isSupabaseAPI(baseUrl)) {
    throw new Error("Touch is only available with Supabase API");
  }

  // Build touch_queue endpoint
  // e.g., http://127.0.0.1:54321/rest/v1/touch_queue
  const normalizedUrl = normalizeBaseUrl(baseUrl);
  const baseApiUrl = normalizedUrl.replace(/\/projects$/, "");
  const touchUrl = `${baseApiUrl}/touch_queue`;

  const response = await fetch(touchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ project_id: projectId }),
  });

  if (!response.ok) {
    throw new Error(`Touch failed: HTTP ${response.status}`);
  }
}
```

### search-projects.tsx Changes

```typescript
import { showToast, Toast } from "@raycast/api";
import { touchProject } from "./api";

// Inside ActionPanel, after existing actions:
{isSupabaseAPI(apiUrl) && (
  <Action
    title="Touch Project"
    icon={Icon.ArrowUp}
    shortcut={{ modifiers: ["cmd"], key: "t" }}
    onAction={async () => {
      try {
        await touchProject(apiUrl, project.id);
        const showToastPref = preferences.showTouchToast ?? true;
        if (showToastPref) {
          await showToast({
            style: Toast.Style.Success,
            title: "Project Touched",
            message: `${project.name} will move to top`,
          });
        }
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Touch Failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }}
  />
)}
```

## Testing Checklist

- [ ] Touch action appears only for Supabase API
- [ ] Touch action hidden for Custom API
- [ ] Successful touch shows toast (when enabled)
- [ ] Successful touch silent (when disabled)
- [ ] Failed touch always shows error toast
- [ ] Keyboard shortcut Cmd+T works
- [ ] Project moves to top after 5-10 seconds (requires indexer)

## Rollback Plan

If issues arise:
1. Remove the Touch action from ActionPanel
2. Remove touchProject function from api.ts
3. Remove constants.ts file
4. Remove showTouchToast preference from package.json
