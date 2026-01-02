# Item #10: As a user, I can view all projects

## Story
US-003: As a user, I can view all projects.

## Acceptance Criteria
- Given a valid API
- When the project list loads
- Then projects are displayed

## Implementation Plan

1. Create Project model
2. Add fetchProjects method to APIClient
3. Create ProjectListView with proper list display
4. Add loading and error states
5. Display project names with relevant metadata

## Files to Create/Modify
- ProjectExplorer/Models/Project.swift (new - project model)
- ProjectExplorer/Services/APIClient.swift (add fetchProjects)
- ProjectExplorer/Views/ContentView.swift (update ProjectListView)
