# Item #12: As a user, I can open a project

## Story
US-005: As a user, I can open a project.

## Acceptance Criteria
- Given a project selection
- When open is triggered
- Then the `open_url` is opened externally

## Implementation Plan

1. Make ProjectRow tappable
2. Add action to open project.openURL in external browser
3. Use UIApplication.shared.open for iOS

## Files to Modify
- ProjectExplorer/Views/ContentView.swift (add tap action to ProjectRow)
