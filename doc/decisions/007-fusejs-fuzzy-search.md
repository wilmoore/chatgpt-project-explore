# 007. Fuse.js for Fuzzy Project Search

Date: 2026-01-26

## Status

Accepted

## Context

The Raycast extension's project search used `String.includes()` for matching, requiring exact substring matches. This failed when project names contained punctuation separators (e.g., `"Business :: Insights"`) that differed from user search terms (e.g., `"business insights"`).

The dataset is small (~500 records, up to ~3,000 max) and search runs client-side. The priority is UX quality over performance optimization.

## Decision

Replace ad-hoc `String.includes()` matching with Fuse.js fuzzy search library, configured with:

- Weighted fields: `name` (0.7), `description` (0.3)
- `threshold: 0.3` for flexible but relevant matching
- `ignoreLocation: true` to match anywhere in the string

The Fuse instance is memoized with `useMemo` to avoid re-creation on every keystroke, only rebuilding when the project dataset changes.

## Consequences

**Positive:**
- Multi-word queries match across different separators (`::`, `-`, `/`)
- Minor typos and partial matches are handled gracefully
- Industry-standard library with well-understood behavior
- Single dependency with no transitive dependencies

**Negative:**
- Additional ~67KB dependency (bundled size is smaller via tree-shaking)
- Search results are ranked by relevance rather than alphabetical order
- Threshold tuning may need adjustment based on user feedback

## Alternatives Considered

1. **Token-based matching** - Split query and name into words, match individually. Simpler but no typo tolerance and requires custom implementation.
2. **Regex-based matching** - Replace separators with wildcards. Fragile, no fuzzy matching, potential ReDoS.
3. **Raycast built-in filtering** - Raycast's `filtering={true}` uses basic substring matching, same limitation as `includes()`.

## Related

- Planning: `.plan/.done/fix-search-business-insights-not-found/`
- ADR-004: Raycast Extension Architecture
