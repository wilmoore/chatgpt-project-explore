# Item #9: As a user, I can verify API compatibility

## Story
US-002: As a user, I can verify API compatibility.

## Acceptance Criteria
- Given a reachable API
- When `/meta` is called
- Then required fields are validated

## Implementation Plan

1. Enhance APIMetaResponse to mark required fields
2. Add validation logic for required fields in APIClient
3. Update SettingsView to show API metadata on success
4. Display validation errors for missing required fields

## Files to Modify
- ProjectExplorer/Services/APIClient.swift (add field validation)
- ProjectExplorer/Views/SettingsView.swift (show API info on success)
