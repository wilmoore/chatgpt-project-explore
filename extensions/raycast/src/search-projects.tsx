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
import { fetchProjects, getCurrentApiUrl } from "./api";
import { STRINGS } from "./constants";
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
  const recentCount = parseInt(preferences.recentCount || "3", 10);

  const [searchText, setSearchText] = useState("");

  // Get current API URL for display
  const apiUrlInfo = getCurrentApiUrl();

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
            title={STRINGS.actions.openInBrowser}
            icon={Icon.Globe}
            onAction={() => handleOpenProject(project, true)}
          />
          <Action.Open
            title={STRINGS.actions.openInChatGPTApp}
            target={project.openUrl}
            icon={Icon.AppWindow}
            shortcut={{ modifiers: ["opt"], key: "return" }}
            onOpen={() => handleOpenProject(project, false)}
          />
          <Action.CopyToClipboard
            title={STRINGS.actions.copyUrl}
            content={project.openUrl}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
          <Action.CopyToClipboard
            title={STRINGS.actions.copyProjectTitle}
            content={project.name}
            shortcut={{ modifiers: ["cmd"], key: "t" }}
          />
        </ActionPanel.Section>
        <ActionPanel.Section>
          <Action
            title={STRINGS.actions.refresh}
            icon={Icon.ArrowClockwise}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
            onAction={revalidate}
          />
          {apiUrlInfo && (
            <Action.CopyToClipboard
              title={STRINGS.actions.copyApiUrl}
              content={apiUrlInfo.url}
              icon={Icon.Link}
            />
          )}
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
            tooltip: project.updatedAt
              ? STRINGS.tooltips.lastUpdated
              : undefined,
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
          title={STRINGS.error.title}
          description={error.message || STRINGS.error.fallbackDescription}
          actions={
            <ActionPanel>
              <Action
                title={STRINGS.error.retry}
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
              />
              <Action
                title={STRINGS.error.openPreferences}
                icon={Icon.Gear}
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // Show empty view when no projects at all
  const hasNoProjects = !isLoading && projects && projects.length === 0;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={STRINGS.search.placeholder}
      throttle
      filtering={false}
      onSearchTextChange={setSearchText}
    >
      {hasNoProjects && apiUrlInfo ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title={STRINGS.noResults.title}
          description={STRINGS.noResults.description(apiUrlInfo.url)}
          actions={
            <ActionPanel>
              <Action
                title={STRINGS.actions.refresh}
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
              />
              <Action.CopyToClipboard
                title={STRINGS.actions.copyApiUrl}
                content={apiUrlInfo.url}
                icon={Icon.Link}
              />
            </ActionPanel>
          }
        />
      ) : (
        <>
          {showRecents && (
            <List.Section
              title={STRINGS.sections.recent}
              subtitle={`${recentProjects.length}`}
            >
              {recentProjects.map(renderProjectItem)}
            </List.Section>
          )}
          <List.Section
            title={STRINGS.sections.projects}
            subtitle={STRINGS.sections.projectsSubtitle(filteredProjects.length)}
          >
            {filteredProjects.map(renderProjectItem)}
          </List.Section>
        </>
      )}
    </List>
  );
}
