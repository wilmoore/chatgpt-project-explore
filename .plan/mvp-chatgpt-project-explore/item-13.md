# Item #13: As a user, I can find projects via Spotlight

## Story
US-006: As a user, I can find projects via Spotlight.

## Acceptance Criteria
- Given indexed projects
- When I search in Spotlight
- Then relevant projects appear

## Implementation Plan

1. Create SpotlightIndexer service using CoreSpotlight
2. Index projects when they are loaded
3. Handle Spotlight search continuation (NSUserActivity)
4. Delete stale entries when projects are removed

## Files to Create/Modify
- ProjectExplorer/Services/SpotlightIndexer.swift (new - CoreSpotlight indexing)
- ProjectExplorer/ProjectExplorerApp.swift (handle userActivity continuation)
- ProjectExplorer/Views/ContentView.swift (trigger indexing after load)
