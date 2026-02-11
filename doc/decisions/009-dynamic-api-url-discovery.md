# 009. Dynamic API URL Discovery

Date: 2026-02-11

## Status

Accepted

## Context

The Raycast extension connects to a backend API (chatgpt-project-indexer) which may run on different ports depending on the environment:

1. **Production Supabase**: Fixed URL like `https://xyz.supabase.co/rest/v1`
2. **Local Supabase development**: Dynamic port allocation (e.g., `http://localhost:54321`)
3. **Custom API endpoints**: User-defined URLs

With local Supabase using dynamic port allocation, users had to manually update the API URL in Raycast preferences each time the port changed. This created friction in the development workflow and violated the principle of avoiding hardcoded ports.

## Decision

Implement automatic API URL discovery by reading from a well-known config file:

1. **Well-known path**: `~/.chatgpt-indexer/api-url.json`
2. **Schema**: `{ "url": "http://localhost:54321/rest/v1" }`
3. **Resolution priority**:
   - First: Auto-discover from config file
   - Fallback: Manual preference setting in Raycast
4. **Preference change**: Made `apiUrl` preference optional instead of required

The chatgpt-project-indexer service writes this config file on startup, ensuring the Raycast extension always has the correct URL without manual intervention.

## Consequences

**Positive:**
- Zero-configuration experience when using chatgpt-project-indexer
- Works seamlessly with dynamic port allocation
- Maintains backward compatibility via preference fallback
- Users can still override with manual URL if needed

**Negative:**
- Dependency on chatgpt-project-indexer writing the config file
- Config file location is hardcoded (mitigated by using standard `~/.chatgpt-indexer/` directory)

## Alternatives Considered

1. **Environment variables**: Rejected because Raycast extensions don't have easy access to shell environment
2. **mDNS/service discovery**: Over-engineered for this use case
3. **Prompt user on each launch**: Poor UX for frequent users

## Related

- Planning: `.plan/.done/refactor-dynamic-supabase-port/`
