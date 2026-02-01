/**
 * User-facing strings for i18n support.
 * All UI text should be referenced from this constant to avoid magic strings.
 */
export const STRINGS = {
  setup: {
    title: "API URL Not Configured",
    description:
      "Please configure your Project Index API URL in extension preferences.",
    openPreferences: "Open Preferences",
  },
  error: {
    title: "Failed to Load Projects",
    fallbackDescription: "Please check your API URL and try again.",
    retry: "Retry",
    openPreferences: "Open Preferences",
  },
  search: {
    placeholder: "Search projects...",
  },
  sections: {
    recent: "Recent",
    projects: "Projects",
    projectsSubtitle: (count: number) => `${count} projects`,
  },
  actions: {
    openInBrowser: "Open in Browser",
    openInChatGPTApp: "Open in ChatGPT App",
    copyUrl: "Copy URL",
    copyProjectTitle: "Copy Project Title",
    refresh: "Refresh",
  },
  tooltips: {
    lastUpdated: "Last updated",
  },
} as const;
