Below is the complete Product Requirements Document generated in **Autopilot mode**, strictly derived from your Idea Pack. No product facts were invented. Defaults and prioritization choices are logged as assumptions with confidence scoring.

---

# Product Requirements Document

**Product:** ChatGPT Project Explorer
**Status:** Draft
**Author:** Wil Moore III

---

## 1. Product Thesis

ChatGPT Projects should be explorable objects rather than fragile UI artifacts.
If project metadata already exists, users must be able to discover, search, and open projects reliably, independent of ChatGPT's UI surfaces, across mobile and desktop environments.

The ChatGPT Project Explorer is a read-only access and discovery layer that consumes an existing Project Index API and provides fast, reliable navigation to original ChatGPT project URLs.

---

## 2. Core Design Principles

1. Read-only by design
2. Provider-agnostic and contract-driven
3. No dependency on ChatGPT UI stability
4. OS-level access over in-app navigation
5. Explicit trust boundaries
6. Zero chat content handling
7. Fast recall over perfect organization

---

## 3. Personas

### P-001 Power User Developer

* Manages 50 to 200 plus ChatGPT projects
* Uses multiple devices, especially mobile
* Values speed, control, and auditability
* Likely self-hosts infrastructure

### P-002 Semi-Technical Power User

* Comfortable configuring APIs but not maintaining servers
* Wants convenience without SaaS lock-in
* Values reliability and transparency

### P-003 Convenience-First User (Deferred)

* Non-technical
* Prefers hosted solutions
* Will accept higher trust tradeoffs

---

## 4. Input Scenarios

* User has an existing Project Index Service running
* User provides a base API URL to the Explorer
* Project metadata already exists and is accessible
* No authentication with ChatGPT is required by the Explorer

---

## 5. User Journeys

### J-001 Discover Projects via Search

User searches for a project without exact-name recall and opens it reliably.

### J-002 Open Recent Project on Mobile

User opens a recently accessed project on iOS in under two seconds.

### J-003 OS-Level Project Access

User opens a project from Spotlight or Share Sheet without opening the Explorer app first.

---

## 6. UX Surface Inventory

| Screen ID | Surface                       |
| --------- | ----------------------------- |
| S-001     | Base URL Configuration        |
| S-002     | Project List                  |
| S-003     | Project Search                |
| S-004     | Project Detail Redirect       |
| S-005     | Error and Connectivity States |

---

## 7. Behavior and Editing Model

* Read-only interaction model
* No project mutation
* All open actions redirect to `open_url`
* Explorer never caches chat content
* Metadata caching allowed for performance only

---

## 8. Constraints and Anti-Features

### Constraints

* iOS-first MVP
* External Project Index API required
* No ChatGPT authentication handled
* Works with 50 to 200 plus projects

### Anti-Features

* No indexing or crawling
* No project creation or editing
* No chat rendering
* No collaboration features
* No browser UI dependency

---

## 9. Success and Failure Criteria

### Success

* Project opens in under two seconds on iOS
* Spotlight search returns projects reliably
* Functions across ChatGPT UI changes
* Zero credential handling in Explorer

### Failure

* Requires ChatGPT UI visibility
* Breaks due to upstream UI changes
* Stores or processes chat content
* Requires ChatGPT login

---

## 10. North Star Metric

Median time from intent to project open on iOS.

---

## 11. Epics

* E-001 [MUST] API Connectivity and Validation
* E-002 [MUST] Project Discovery and Search
* E-003 [MUST] Project Open and Redirection
* E-004 [MUST] iOS OS-Level Integrations
* E-005 [SHOULD] Favorites and Recents
* E-006 [COULD] Desktop Integrations
* E-007 [WONT] Hosted Index Service

---

## 12. User Stories with Acceptance Criteria

### E-001 API Connectivity and Validation

* US-001 [MUST] As a user, I can configure a base API URL
  **Acceptance Criteria**
  Given an invalid API URL
  When validation is attempted
  Then an error state is shown

* US-002 [MUST] As a user, I can verify API compatibility
  Given a reachable API
  When `/meta` is called
  Then required fields are validated

---

### E-002 Project Discovery and Search

* US-003 [MUST] As a user, I can view all projects
  Given a valid API
  When the project list loads
  Then projects are displayed

* US-004 [MUST] As a user, I can search projects
  Given a query
  When search is executed
  Then matching projects are returned

---

### E-003 Project Open and Redirection

* US-005 [MUST] As a user, I can open a project
  Given a project selection
  When open is triggered
  Then the `open_url` is opened externally

---

### E-004 iOS OS-Level Integrations

* US-006 [MUST] As a user, I can find projects via Spotlight
  Given indexed projects
  When I search in Spotlight
  Then relevant projects appear

* US-007 [MUST] As a user, I can open projects from Share Sheet
  Given any app
  When I select the Explorer action
  Then the project opens

---

### E-005 Favorites and Recents

* US-008 [SHOULD] As a user, I can view recent projects
* US-009 [SHOULD] As a user, I can view favorite projects

---

## 13. Traceability Map

| Story  | Epic  | Journey | Screen | Priority |
| ------ | ----- | ------- | ------ | -------- |
| US-001 | E-001 | J-001   | S-001  | MUST     |
| US-002 | E-001 | J-001   | S-001  | MUST     |
| US-003 | E-002 | J-001   | S-002  | MUST     |
| US-004 | E-002 | J-001   | S-003  | MUST     |
| US-005 | E-003 | J-002   | S-004  | MUST     |
| US-006 | E-004 | J-003   | S-002  | MUST     |
| US-007 | E-004 | J-003   | S-002  | MUST     |
| US-008 | E-005 | J-002   | S-002  | SHOULD   |
| US-009 | E-005 | J-002   | S-002  | SHOULD   |

---

## 14. Lo-fi UI Mockups (ASCII)

### S-001 Base URL Configuration

Purpose: Configure and validate API endpoint

```
+----------------------------+
| Project Explorer           |
| Base API URL               |
| [ https://api.example ]    |
| [ Validate ]               |
| Status: OK / Error         |
+----------------------------+
```

---

### S-002 Project List

Purpose: Browse projects

```
+----------------------------+
| Projects                   |
| Search: [ ________ ]       |
| -------------------------- |
| Project Alpha              |
| Project Beta               |
| Project Gamma              |
+----------------------------+
```

---

### S-003 Project Search

Purpose: Query projects

```
+----------------------------+
| Search Results             |
| -------------------------- |
| Matching Project 1         |
| Matching Project 2         |
+----------------------------+
```

---

### S-004 Project Redirect

Purpose: Open project externally

```
Opening project...
Redirecting to ChatGPT
```

---

### S-005 Error State

Purpose: Handle failures

```
Error: Unable to reach API
Check base URL and connectivity
```

---

## 15. Decision Log

### D-001 Default Deployment Path

* Question: Which deployment path is MVP default?
* Options: Path A, Path B, Path C
* Evidence: Section 12
* Winner: Path B
* Confidence: 0.92

### D-002 Platform Priority

* Question: Which platform ships first?
* Options: iOS, Android, Desktop
* Winner: iOS
* Confidence: 0.88

### D-003 Feature Scope

* Question: Include indexing?
* Options: Yes, No
* Winner: No
* Confidence: 0.97

---

## 16. Assumptions

* MVP timebox is 2 to 4 weeks
* Lean budget posture
* Web backend already exists
* iOS Spotlight APIs are sufficient for scale
* Project count does not exceed several hundred in MVP

---

> **This PRD is complete.**
> Copy this Markdown into Word, Google Docs, Notion, or directly into a coding model.
