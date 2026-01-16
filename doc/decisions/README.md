# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting significant technical decisions.

## What is an ADR?

An ADR captures the context, decision, and consequences of an architecturally significant choice.

## Format

We use the [Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## Naming Convention

- Filename: `NNN-kebab-case-title.md` (e.g., `001-use-localStorage-for-tracking.md`)
- NNN = zero-padded sequence number (001, 002, 003...)
- Title in heading must match: `# NNN. Title` (e.g., `# 001. Use localStorage for Tracking`)

## Index

- [001. Use SwiftUI with Actor-based API Client](001-swiftui-actor-api-client.md)
- [002. Use XcodeGen for Project Generation](002-xcodegen-project-generation.md)
- [003. Support Multiple API Formats](003-support-multiple-api-formats.md)
- [004. Raycast Extension Architecture](004-raycast-extension-architecture.md)
- [005. Touch Project API Integration](005-touch-project-api-integration.md)
