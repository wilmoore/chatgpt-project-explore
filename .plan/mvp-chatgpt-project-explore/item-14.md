# Item #14: As a user, I can open projects from Share Sheet

## Story
US-007: As a user, I can open projects from Share Sheet.

## Acceptance Criteria
- Given any app
- When I select the Explorer action
- Then the project opens

## Implementation Plan

Share Sheet integration in iOS requires a Share Extension target. This is an Xcode project configuration that cannot be created programmatically via Swift files alone.

For the MVP, I will:
1. Create the Share Extension directory structure
2. Document the required Xcode configuration
3. Implement the Share Extension code that handles incoming URLs

The extension will:
- Accept URLs from any app's share sheet
- Check if the URL matches a ChatGPT project pattern
- Open the main app with the project URL

## Files to Create
- ProjectExplorerShareExtension/ShareViewController.swift
- ProjectExplorerShareExtension/Info.plist (documentation)
- SHARE_EXTENSION_SETUP.md (setup instructions)
