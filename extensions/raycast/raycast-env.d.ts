/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** API URL (Optional) - Auto-discovered from ~/.chatgpt-indexer/api-url.json. Only set manually for custom API endpoints. */
  "apiUrl"?: string,
  /** Recent Projects Count - Number of recently opened projects to show at the top (0 to disable) */
  "recentCount": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-projects` command */
  export type SearchProjects = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-projects` command */
  export type SearchProjects = {}
}

