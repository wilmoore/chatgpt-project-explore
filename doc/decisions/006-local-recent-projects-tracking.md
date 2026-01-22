# 006. Local Recent Projects Tracking

Date: 2025-01-19

## Status

Accepted

## Context

Users frequently access the same projects repeatedly. Navigating through a list of 500+ projects to find recently-used ones was inefficient. The previous "Touch Project" feature required server-side infrastructure (Supabase touch_queue table and indexer watch mode) which added complexity and latency.

## Decision

Replace the server-side touch mechanism with client-side recent projects tracking using Raycast's LocalStorage API:

1. **Track opens locally**: Store recently-opened project IDs in LocalStorage when users select "Open in Browser" or "Open in ChatGPT App"
2. **Display Recent section**: Show a configurable number of recent projects (default: 3) at the top of the list
3. **Hide during search**: Recent section disappears when user is actively searching, showing only filtered results
4. **Manual filtering**: Implement custom search filtering instead of relying on Raycast's built-in filtering for better control

Key implementation details:
- `recent-projects.ts`: Helper module for LocalStorage operations
- Store up to 10 IDs internally for flexibility
- `recentCount` preference allows users to configure 0-10 recent projects
- Copy actions do not affect recency (only opens)

## Consequences

**Positive:**
- Zero server dependencies for recency tracking
- Instant updates (no 5-10 second delay)
- Works offline
- Simpler architecture (removed constants.ts, touchProject API)
- User-configurable behavior

**Negative:**
- Recency is device-local (not synced across machines)
- Lost if Raycast extension data is cleared

## Alternatives Considered

1. **Keep server-side touch**: Rejected due to infrastructure overhead and latency
2. **Sync via iCloud**: Rejected as over-engineering for this use case
3. **Raycast's built-in filtering with recents**: Attempted but had issues with `onSearchTextChange` interaction; manual filtering proved more reliable

## Related

- Supersedes: ADR-005 (Touch Project API Integration)
- Removes: `touchProject` function, `constants.ts`, `showTouchToast` preference
