# 002. Use XcodeGen for Project Generation

Date: 2026-01-03

## Status

Accepted

## Context

Managing Xcode project files (.xcodeproj) in version control is problematic:
- Merge conflicts are common and hard to resolve
- Project files are verbose XML/plist format
- Adding targets (like Share Extensions) requires manual Xcode configuration

## Decision

Use XcodeGen to generate the Xcode project from a YAML specification (`project.yml`):
- Project structure defined declaratively
- Both main app and Share Extension targets in one spec
- Regenerate with `xcodegen generate` when needed

## Consequences

**Positive:**
- Clean, human-readable project definition
- No merge conflicts on project files
- Reproducible project setup
- Easy to add/modify targets

**Negative:**
- Additional dependency (xcodegen)
- Developers must regenerate after pulling changes
- Some advanced Xcode features may need workarounds

## Alternatives Considered

1. **Commit .xcodeproj directly** - Merge conflict nightmare
2. **Tuist** - More complex, overkill for this project size
3. **Swift Package Manager only** - Doesn't support app extensions well

## Related

- Planning: `.plan/.done/mvp-chatgpt-project-explore/`
