# 008. i18n Constants for User-Facing Strings

Date: 2026-02-01

## Status

Accepted

## Context

The Raycast extension had all user-facing strings hardcoded inline throughout the codebase. This violates the project convention to avoid magic strings and makes future internationalization difficult.

Additionally, the Projects section subtitle was exposing internal API routing details ("529 projects via Edge Function") which are meaningless to end users and leak implementation details.

## Decision

Create a centralized `constants.ts` file with a `STRINGS` constant containing all user-facing text, organized by UI context:

```typescript
export const STRINGS = {
  setup: { title, description, openPreferences },
  error: { title, fallbackDescription, retry, openPreferences },
  search: { placeholder },
  sections: { recent, projects, projectsSubtitle(count) },
  actions: { openInBrowser, openInChatGPTApp, copyUrl, copyProjectTitle, refresh },
  tooltips: { lastUpdated },
} as const;
```

The `projectsSubtitle` function returns just "N projects" without API type information.

## Consequences

**Positive:**
- All user-facing strings are centralized and easy to locate
- Future i18n support can be added by swapping string values
- Internal API routing details are no longer exposed to users
- Typos are fixed in one place (e.g., "Chatgpt" → "ChatGPT")
- Type safety via `as const`

**Negative:**
- Slightly more indirection when reading component code
- Requires importing STRINGS in each file that uses UI text

## Alternatives Considered

1. **Keep inline strings** - Rejected because it violates the no-magic-strings convention and makes i18n harder.

2. **Full i18n library (react-i18next)** - Rejected as overkill for a single-language extension; the constants pattern provides a migration path if needed.

3. **Remove apiType entirely but keep inline strings** - Rejected because it only solves half the problem.

## Related

- ADR-003: Support Multiple API Formats (documents the multi-API architecture)
- Branch: `fix/remove-technical-edge-function-label-add-i18n`
