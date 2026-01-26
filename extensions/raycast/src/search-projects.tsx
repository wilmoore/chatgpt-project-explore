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
import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import { fetchProjects, isSupabaseAPI, isEdgeFunctionAPI } from "./api";
import {
  addRecentProject,
  getRecentProjectIds,
  pruneStaleRecents,
} from "./recent-projects";
import type { Project } from "./types";

/** Fuse.js options for fuzzy project search */
const FUSE_OPTIONS = {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "description", weight: 0.3 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
};

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
  const apiType = isEdgeFunctionAPI(apiUrl)
    ? "Edge Function"
    : isSupabaseAPI(apiUrl)
      ? "Supabase"
      : "Custom API";

  // Prune stale recents when projects are fetched
  useEffect(() => {
    if (projects && projects.length > 0) {
      const validIds = new Set(projects.map((p) => p.id));
      pruneStaleRecents(validIds).then(() => revalidateRecents());
    }
  }, [projects]);

  const isLoading = isLoadingProjects || isLoadingRecents;

  // Build recent projects list (only IDs that still exist) - memoized
  const { recentProjects, recentIdSet } = useMemo(() => {
    const recentProjectsList: Project[] = [];
    const idSet = new Set<string>();

    if (projects && recentIds && recentCount > 0) {
      const projectMap = new Map(projects.map((p) => [p.id, p]));
      for (const id of recentIds.slice(0, recentCount)) {
        const project = projectMap.get(id);
        if (project) {
          recentProjectsList.push(project);
          idSet.add(id);
        }
      }
    }

    return { recentProjects: recentProjectsList, recentIdSet: idSet };
  }, [projects, recentIds, recentCount]);

  // Create Fuse instance once per dataset change
  const fuse = useMemo(
    () => (projects ? new Fuse(projects, FUSE_OPTIONS) : null),
    [projects],
  );

  // Only show recents when not searching
  const isSearching = searchText.trim().length > 0;
  const showRecents = !isSearching && recentProjects.length > 0;

  // Filter projects: use Fuse.js when searching, full list otherwise
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    const query = searchText.trim();

    // No search query: return all projects (excluding recents when not searching)
    if (!query) {
      return projects.filter((p) => !recentIdSet.has(p.id));
    }

    // Use Fuse.js for fuzzy search
    if (!fuse) return [];
    const results = fuse.search(query);
    return results.map((result) => result.item);
  }, [projects, searchText, fuse, recentIdSet]);

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
