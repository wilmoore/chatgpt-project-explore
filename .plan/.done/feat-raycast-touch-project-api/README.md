# Feature: Raycast Touch Project API

**Branch**: `feat/raycast-touch-project-api`
**Created**: 2026-01-15
**Status**: Planning

## Summary

Add a "Touch Project" action to the Raycast extension that allows users to move a project to the top of the project list. This is useful when in a ChatGPT conversation and the user wants to move a conversation into a project that isn't visible without pagination.

## Requirements

1. Add a new action "Touch Project" to each project item in the Raycast list
2. When triggered, POST to `/rest/v1/touch_queue` with `{ project_id: '<id>' }`
3. Include Supabase anon key in the `apikey` header (hardcoded - standard local dev key)
4. Show a toast notification on success (configurable to be silent)
5. Only available when using Supabase REST API (not Custom API)

## API Details

```typescript
// Queue a touch request
await fetch('http://127.0.0.1:54321/rest/v1/touch_queue', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({ project_id: 'g-p-abc123' }),
});
```

The touch executes within 5-10 seconds when the indexer is running in watch mode.

## Related ADRs

- **ADR-003**: Support Multiple API Formats - Defines Supabase vs Custom API detection
- **ADR-004**: Raycast Extension Architecture - Extension structure and patterns

## Implementation Plan

### Phase 1: Core Implementation

1. **Add constants** (`src/constants.ts`)
   - `SUPABASE_ANON_KEY` - Standard local development anon key

2. **Add touch API function** (`src/api.ts`)
   - `touchProject(projectId: string): Promise<void>`
   - Only works with Supabase API (throws if Custom API)
   - Includes proper error handling

3. **Add preference for toast behavior** (`package.json`)
   - New preference: `showTouchToast` (boolean, default: true)

4. **Add Touch action to project items** (`src/search-projects.tsx`)
   - New action with keyboard shortcut (Cmd+T)
   - Shows toast on success/failure based on preference
   - Only visible when Supabase API is detected

### Phase 2: Polish

- Verify action only appears for Supabase APIs
- Test error scenarios (API unreachable, invalid project ID)
- Add refresh after touch to show updated order (optional)

## Files to Modify

| File | Changes |
|------|---------|
| `extensions/raycast/src/constants.ts` | New file with SUPABASE_ANON_KEY |
| `extensions/raycast/src/api.ts` | Add touchProject function |
| `extensions/raycast/src/search-projects.tsx` | Add Touch action to ActionPanel |
| `extensions/raycast/package.json` | Add showTouchToast preference |

## Testing

1. Start local Supabase instance with indexer in watch mode
2. Open Raycast and search for a project
3. Select "Touch Project" action
4. Verify toast appears (if enabled)
5. Wait 5-10 seconds, refresh list
6. Verify project moved to top of list
