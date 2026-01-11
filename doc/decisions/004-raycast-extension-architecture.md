# 004. Raycast Extension Architecture

Date: 2026-01-11

## Status

Accepted

## Context

The iOS app provides Spotlight and Share Sheet integration for quick project access. To extend this capability to macOS desktop, we needed a launcher-style interface for searching and opening ChatGPT projects.

Raycast was chosen as the platform because:
- Native macOS launcher with keyboard-first UX
- TypeScript/React development model
- Large user base among developers
- Built-in search filtering and caching

## Decision

Implement a Raycast extension at `/extensions/raycast/` with the following architecture:

1. **Dual API Support**: Reuse the API detection logic from ADR-003 to support both Custom API and Supabase REST API.

2. **Direct Browser Opening**: Use `open -a "Google Chrome"` shell command to bypass macOS URL handlers. The ChatGPT desktop app registers as a handler for chatgpt.com URLs, which would intercept standard `Action.OpenInBrowser` calls.

3. **Preferences-based Configuration**: Store API URL in Raycast extension preferences rather than a shared config file, keeping the extension self-contained.

4. **Monorepo Structure**: Place extension under `/extensions/raycast/` to allow future browser extensions at `/extensions/browser/` without restructuring.

## Consequences

**Positive:**
- Consistent API handling across iOS and Raycast
- Fast Command-K style project access on macOS
- Self-contained extension with no external dependencies
- Clear repo structure for multiple form factors

**Negative:**
- Chrome is hardcoded as the browser (could be made configurable)
- No shared config with iOS app (each configures API URL separately)
- Raycast-specific implementation (not portable to Alfred, etc.)

## Alternatives Considered

1. **Alfred Workflow** - Smaller user base, Ruby/Python scripting less maintainable
2. **Spotlight Indexer for macOS** - More complex, requires native app
3. **Shared config file** - Added complexity for minimal benefit
4. **Action.OpenInBrowser** - Intercepted by ChatGPT app

## Related

- ADR-003: Support Multiple API Formats
- Planning: `.plan/.done/feature-raycast-extension/`
