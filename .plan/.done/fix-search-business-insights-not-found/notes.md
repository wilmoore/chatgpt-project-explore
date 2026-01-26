# Bug Fix: Search fails to match projects with punctuation separators

## Bug Details

- **Steps to Reproduce**: Open Raycast > Search Projects > Type "business insights"
- **Expected**: Should find "Business :: Insights"
- **Actual**: Shows "No Results"
- **Severity**: High (degraded experience)

## Root Cause Analysis

Location: `extensions/raycast/src/search-projects.tsx:100-104`

```typescript
const searchLower = searchText.toLowerCase().trim();
const matchesSearch = (project: Project) =>
  searchLower.length === 0 ||
  project.name.toLowerCase().includes(searchLower) ||
  project.description?.toLowerCase().includes(searchLower);
```

The `includes()` method requires an exact substring match:
- Project name: `"Business :: Insights"`
- Search text: `"business insights"`
- `"business :: insights".includes("business insights")` = **false**

The separator `" :: "` differs from space `" "`, causing the match to fail.

## Fix Implementation

Replace ad-hoc `includes()` matching with **Fuse.js** fuzzy search library.

### Fuse.js Configuration

```typescript
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'description', weight: 0.3 }
  ],
  threshold: 0.3,
  ignoreLocation: true
};
```

### Benefits

1. Multi-word queries work across different separators
2. Handles punctuation differences (e.g., `::` vs space)
3. Supports minor typos and partial matches
4. Industry-standard solution for client-side fuzzy search

### Implementation Notes

- Create Fuse instance once per dataset change (memoize with `useMemo`)
- Return full dataset when query is empty/whitespace
- Unwrap `item` from Fuse results to maintain existing shape

## Changes Made

**File:** `extensions/raycast/src/search-projects.tsx`

1. Added `fuse.js` dependency
2. Imported Fuse.js and `useMemo` hook
3. Defined `FUSE_OPTIONS` constant with weighted fields
4. Memoized `recentProjects` and `recentIdSet` together to prevent unnecessary re-renders
5. Created memoized Fuse instance (`fuse`) that updates only when `projects` changes
6. Replaced `matchesSearch` function with Fuse.js search in `filteredProjects` useMemo

## Verification Steps

1. Open Raycast
2. Search for "Search Projects" command
3. Type "business insights"
4. Expect: "Business :: Insights" should appear in results
