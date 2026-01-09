# 001. Use SwiftUI with Actor-based API Client

Date: 2026-01-02

## Status

Accepted

## Context

Building an iOS app to browse and open ChatGPT projects requires a modern, maintainable architecture. The app needs to:
- Make network requests to a Project Index API
- Handle concurrent operations safely
- Provide a responsive UI

## Decision

Use SwiftUI for the UI layer with Swift's actor model for the API client:
- `APIClient` is declared as an `actor` for thread-safe network operations
- `@StateObject` and `@ObservedObject` manage view state
- `async/await` for clean asynchronous code

## Consequences

**Positive:**
- Thread safety guaranteed by actor isolation
- Modern Swift concurrency patterns
- Clean separation between UI and networking
- SwiftUI's declarative syntax reduces boilerplate

**Negative:**
- Requires iOS 17+ (actors and modern concurrency)
- Learning curve for developers unfamiliar with Swift concurrency

## Alternatives Considered

1. **Traditional completion handlers** - More verbose, prone to callback hell
2. **Combine framework** - More complex for simple API calls
3. **Class-based client with manual locking** - Error-prone concurrency

## Related

- Planning: `.plan/.done/mvp-chatgpt-project-explore/`
