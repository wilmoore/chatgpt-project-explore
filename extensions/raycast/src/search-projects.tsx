import {
  Action,
  ActionPanel,
  Icon,
  List,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { exec } from "child_process";
import { fetchProjects, isSupabaseAPI } from "./api";

/** Opens URL directly in Chrome, bypassing system URL handlers */
function openInChrome(url: string): void {
  exec(`open -a "Google Chrome" "${url}"`);
}

export default function SearchProjects() {
  const preferences = getPreferenceValues<Preferences>();
  const apiUrl = preferences.apiUrl;

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

  const { data: projects, isLoading, error, revalidate } = useCachedPromise(fetchProjects);

  // Determine API type for display
  const apiType = isSupabaseAPI(apiUrl) ? "Supabase" : "Custom API";

  if (error) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Failed to Load Projects"
          description={error.message || "Please check your API URL and try again."}
          actions={
            <ActionPanel>
              <Action title="Retry" icon={Icon.ArrowClockwise} onAction={revalidate} />
              <Action title="Open Preferences" icon={Icon.Gear} onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search projects..." throttle>
      <List.Section title="Projects" subtitle={`${projects?.length ?? 0} projects via ${apiType}`}>
        {projects?.map((project) => (
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
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title="Open in Browser"
                    icon={Icon.Globe}
                    onAction={() => openInChrome(project.openUrl)}
                  />
                  <Action.Open
                    title="Open in ChatGPT App"
                    target={project.openUrl}
                    icon={Icon.AppWindow}
                    shortcut={{ modifiers: ["opt"], key: "return" }}
                  />
                  <Action.CopyToClipboard
                    title="Copy URL"
                    content={project.openUrl}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
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
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
