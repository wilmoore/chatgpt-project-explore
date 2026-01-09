# 003. Support Multiple API Formats

Date: 2026-01-05

## Status

Accepted

## Context

The app was designed to work with a custom Project Index API (`/meta`, `/projects` endpoints). However, users may want to use Supabase as a backend, which has a different API format:
- REST API at `/rest/v1/projects`
- Different field names (`title` vs `name`, `url` vs `open_url`)
- Direct array response vs wrapped response

## Decision

Auto-detect Supabase REST API by checking if the URL contains `/rest/v1` and handle both formats:
- Custom API: calls `/meta` and `/projects`, expects wrapped response
- Supabase API: calls `/rest/v1/projects`, maps field names automatically

The `APIClient` uses separate code paths:
- `validateAPI()` vs `validateSupabaseAPI()`
- `fetchProjects()` vs `fetchSupabaseProjects()`

## Consequences

**Positive:**
- Works with both custom API and Supabase out of the box
- No configuration needed - auto-detected from URL
- Field mapping handled transparently

**Negative:**
- Two code paths to maintain
- Assumes Supabase uses specific field names
- URL-based detection may not work for all Supabase setups

## Alternatives Considered

1. **Require Edge Functions** - More setup for users, depends on Supabase features
2. **Manual API type selection** - Extra configuration step for users
3. **Single flexible parser** - Complex to handle all variations

## Related

- Planning: `.plan/.done/mvp-chatgpt-project-explore/`
