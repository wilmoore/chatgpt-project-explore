# Refactor: Dynamic Supabase Port Discovery

## Summary

Enable automatic API URL discovery for the Raycast extension by reading from a well-known config file (`~/.chatgpt-indexer/api-url.json`) written by the chatgpt-project-indexer service.

## Problem

The Raycast extension required manual configuration of the API URL in extension preferences. When using local Supabase development with dynamic port allocation, the port changes between sessions, requiring users to manually update the URL each time.

## Solution

1. **Auto-discovery mechanism**: Read API URL from `~/.chatgpt-indexer/api-url.json`
2. **Fallback to preferences**: If auto-discovery fails, use manual preference setting
3. **Optional preference**: Changed `apiUrl` preference from required to optional
4. **Transparency**: Added "Copy API URL" action so users can see the resolved URL
5. **Improved empty state**: Show connection info when no projects are found

## Files Changed

- `extensions/raycast/package.json` - Made apiUrl preference optional with updated description
- `extensions/raycast/raycast-env.d.ts` - Updated type definition for optional apiUrl
- `extensions/raycast/src/api.ts` - Added URL resolution logic with auto-discovery
- `extensions/raycast/src/constants.ts` - Added i18n strings for new UI elements
- `extensions/raycast/src/search-projects.tsx` - Integrated URL resolution, improved empty states
- `extensions/raycast/src/types.ts` - Added `ApiUrlConfig` interface

## Related ADRs

- 009-dynamic-api-url-discovery.md
