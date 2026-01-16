# 005. Touch Project API Integration

Date: 2025-01-16

## Status

Accepted

## Context

The Raycast extension allows users to search and open ChatGPT projects. When using the Supabase API backend, there's a `touch_queue` table that allows projects to be "touched" - moving them to the top of the list when the indexer processes the queue.

Users needed a way to quickly elevate a project's position without manually editing timestamps or database records.

## Decision

Add a "Touch Project" action to the Raycast extension that:

1. Posts to the `touch_queue` endpoint with the project ID
2. Uses the standard Supabase local development anon key (stored in `constants.ts`)
3. Only appears when the API URL is detected as Supabase
4. Provides optional toast notifications (configurable via preferences)
5. Uses `Cmd+T` as the keyboard shortcut

## Consequences

### Positive

- Quick way to prioritize projects without leaving Raycast
- Non-destructive operation (only queues a touch request)
- Graceful degradation - action hidden for non-Supabase APIs
- User control over notification verbosity

### Negative

- Requires indexer to be running in watch mode for touch to take effect
- Touch effect is not immediate (5-10 second delay)
- Only works with Supabase backend, not custom APIs

## Alternatives Considered

1. **Direct database update**: Rejected - would bypass the queue mechanism and could cause conflicts with the indexer
2. **WebSocket for instant update**: Rejected - over-engineering for the use case
3. **Custom API endpoint**: Rejected - would require changes to custom API implementations

## Related

- Planning: `.plan/.done/feat-raycast-touch-project-api/`
