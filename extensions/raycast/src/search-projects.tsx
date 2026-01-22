import {
  Action,
  ActionPanel,
  Icon,
  List,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import { useCachedPromise, usePromise } from "@raycast/utils";
import { exec } from "child_process";
import { useState } from "react";
import { fetchProjects, isSupabaseAPI } from "./api";
import { addRecentProject, getRecentProjectIds } from "./recent-projects";
import type { Project } from "./types";

/** Opens URL directly in Chrome, bypassing system URL handlers */
function openInChrome(url: string): void {
  exec(`open -a "Google Chrome" "${url}"`);
}

export default function SearchProjects() {
  const preferences = getPreferenceValues<Preferences>();
  const apiUrl = preferences.apiUrl;
  const recentCount = parseInt(preferences.recentCount || "3", 10);

  const [searchText, setSearchText] = useState("");

  // Show setup screen if API URL is not configured
  if (!apiUrl) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.Gear}
          title="API URL Not Configured"
          description="Please configure your Project Index API URL in extension preferences."
          actions={
            <ActionPanel>
              <Action
                title="Open Preferences"
                icon={Icon.Gear}
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  const {
    data: projects,
    isLoading: isLoadingProjects,
    error,
    revalidate,
  } = useCachedPromise(fetchProjects);

  const {
    data: recentIds,
    isLoading: isLoadingRecents,
    revalidate: revalidateRecents,
  } = usePromise(getRecentProjectIds);

  // Determine API type for display
  const isSupabase = isSupabaseAPI(apiUrl);
  const apiType = isSupabase ? "Supabase" : "Custom API";

  const isLoading = isLoadingProjects || isLoadingRecents;

  // Build recent projects list (only IDs that still exist)
  const recentProjects: Project[] = [];
  const recentIdSet = new Set<string>();

  if (projects && recentIds && recentCount > 0) {
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    for (const id of recentIds.slice(0, recentCount)) {
      const project = projectMap.get(id);
      if (project) {
        recentProjects.push(project);
        recentIdSet.add(id);
      }
    }
  }

  // Filter projects by search text
  const searchLower = searchText.toLowerCase().trim();
  const matchesSearch = (project: Project) =>
    searchLower.length === 0 ||
    project.name.toLowerCase().includes(searchLower) ||
    project.description?.toLowerCase().includes(searchLower);

  // Only show recents when not searching
  const isSearching = searchText.length > 0;
  const showRecents = !isSearching && recentProjects.length > 0;

  // When searching, include all projects; otherwise exclude recents (they're shown separately)
  const filteredProjects =
    projects?.filter((p) => {
      if (!matchesSearch(p)) return false;
      if (isSearching) return true; // Include all matches when searching
      return !recentIdSet.has(p.id); // Exclude recents when not searching
    }) ?? [];

  /** Opens a project and tracks it as recent */
  async function handleOpenProject(project: Project, inChrome: boolean) {
    await addRecentProject(project.id);
    revalidateRecents();

    if (inChrome) {
      openInChrome(project.openUrl);
    }
    // Note: Action.Open handles its own opening
  }

  /** Renders the action panel for a project */
  function renderActions(project: Project) {
    return (
      <ActionPanel>
        <ActionPanel.Section>
          <Action
            title="Open in Browser"
            icon={Icon.Globe}
            onAction={() => handleOpenProject(project, true)}
          />
          <Action.Open
            title="Open in Chatgpt App"
            target={project.openUrl}
            icon={Icon.AppWindow}
            shortcut={{ modifiers: ["opt"], key: "return" }}
            onOpen={() => handleOpenProject(project, false)}
          />
          <Action.CopyToClipboard
            title="Copy URL"
            content={project.openUrl}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title="Copy Project Title"
            content={project.name}
            shortcut={{ modifiers: ["cmd"], key: "t" }}
          />
        </ActionPanel.Section>
        <ActionPanel.Section>
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={revalidate}
          />
        </ActionPanel.Section>
      </ActionPanel>
    );
  }

  /** Renders a project list item */
  function renderProjectItem(project: Project) {
    return (
      <List.Item
        key={project.id}
        title={project.name}
        subtitle={project.description}
        accessories={[
          {
            date: project.updatedAt ? new Date(project.updatedAt) : undefined,
            tooltip: project.updatedAt ? "Last updated" : undefined,
          },
        ]}
        actions={renderActions(project)}
      />
    );
  }

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Failed to Load Projects"
          description={
            error.message || "Please check your API URL and try again."
          }
          actions={
            <ActionPanel>
              <Action
                title="Retry"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
              />
              <Action
                title="Open Preferences"
                icon={Icon.Gear}
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search projects..."
      throttle
      filtering={false}
      onSearchTextChange={setSearchText}
    >
      {showRecents && (
        <List.Section title="Recent" subtitle={`${recentProjects.length}`}>
          {recentProjects.map(renderProjectItem)}
        </List.Section>
      )}
      <List.Section
        title="Projects"
        subtitle={`${filteredProjects.length} projects via ${apiType}`}
      >
        {filteredProjects.map(renderProjectItem)}
      </List.Section>
    </List>
  );
}
