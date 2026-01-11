# ChatGPT Project Explorer

Search and open your ChatGPT projects directly from Raycast.

## Features

- **Quick Search**: Command-K style search through all your ChatGPT projects
- **Fast Filtering**: Type to instantly filter projects by name or description
- **One-Click Open**: Press Enter to open any project in ChatGPT
- **Dual API Support**: Works with both custom Project Index API and Supabase

## Setup

1. Install the extension
2. Open Raycast and run "Search Projects"
3. Configure your API URL in the extension preferences:
   - **Custom API**: `https://your-api.example.com`
   - **Supabase**: `https://your-project.supabase.co/rest/v1`

## API Compatibility

This extension supports two API formats:

### Custom Project Index API

Expects endpoints:
- `GET /projects` - Returns `{ projects: [...] }`

Project fields: `id`, `name`, `open_url`, `description`, `created_at`, `updated_at`

### Supabase REST API

Auto-detected when URL contains `/rest/v1`.

Expects endpoint:
- `GET /rest/v1/projects` - Returns direct array

Project fields: `id`, `title`, `url`, `created_at`, `updated_at`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Open project in Chrome |
| Opt+Enter | Open in ChatGPT App |
| Cmd+C | Copy project URL |
| Cmd+R | Refresh project list |

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build extension
npm run build

# Lint code
npm run lint
```
