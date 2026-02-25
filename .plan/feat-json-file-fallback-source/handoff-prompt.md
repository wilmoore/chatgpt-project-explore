# Agent Handoff Prompt

Copy the content below and paste it into a new Claude session to continue this work.

---

## Handoff Prompt

```
I need you to implement a feature that's been planned and is ready for coding. The planning is complete - you just need to execute.

## Project Location
~/Documents/src/chatgpt-project-explore

## Branch
`feat/json-file-fallback-source` (already created and checked out)

## Plan File Location
.plan/feat-json-file-fallback-source/plan.md

## Backlog Item
#24 in .plan/backlog.json (status: in-progress)

## Summary

Add JSON file fallback for the Raycast extension. When the Supabase edge function is unavailable, fall back to reading project data from:

~/Documents/src/chatgpt-project-indexer/projects.json

## What To Do

1. Read the plan file at `.plan/feat-json-file-fallback-source/plan.md` - it contains:
   - Schema mapping between JSON file and Raycast types
   - Step-by-step implementation with code snippets
   - Files to modify
   - Testing plan
   - Definition of Done checklist

2. Implement the feature following the plan exactly

3. Files to modify (in extensions/raycast/src/):
   - types.ts - Add JsonStorageFile and JsonStorageProject interfaces
   - constants.ts - Add JSON_STORAGE_PATH constant
   - api.ts - Add fetchFromJsonFile() and modify fetchProjects() with fallback

4. Run build and lint to verify:
   cd extensions/raycast && npm run build && npm run lint

5. Manual testing:
   - With edge function running: verify normal API path works
   - With edge function stopped: verify JSON fallback works
   - With JSON file missing: verify clear error message

6. When complete, use /pro:pr to create the pull request

## Key Design Decisions

- Silent fallback (no toast notification when falling back)
- Hardcoded path for now (configurable path is future work)
- JSON is fallback only, not primary source
- Uses existing CHATGPT_PROJECT_URL_BASE constant for URL construction

## Related ADRs
- ADR-003: Multiple API format support
- ADR-009: Dynamic API URL discovery

Please read the plan file first, then implement the feature.
```

---

## Alternative: Resume Command

If you have `/pro:backlog.resume` available, you can simply run:

```
/pro:backlog.resume
```

This will pick up backlog item #24 automatically.
