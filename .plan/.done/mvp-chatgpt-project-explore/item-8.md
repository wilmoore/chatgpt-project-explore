# Item #8: As a user, I can configure a base API URL

## Story
US-001: As a user, I can configure a base API URL.

## Acceptance Criteria
- Given an invalid API URL
- When validation is attempted
- Then an error state is shown

## Implementation Plan

1. Create iOS app project structure (SwiftUI)
2. Create data models for API configuration
3. Create SettingsView for URL configuration
4. Implement URL validation
5. Persist settings using UserDefaults/AppStorage
6. Show error state for invalid URLs

## Files to Create
- ProjectExplorer/ProjectExplorerApp.swift (App entry point)
- ProjectExplorer/Models/AppSettings.swift (Settings model)
- ProjectExplorer/Services/APIClient.swift (API client foundation)
- ProjectExplorer/Views/SettingsView.swift (Settings UI)
- ProjectExplorer/Views/ContentView.swift (Main container)
