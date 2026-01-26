import { LocalStorage } from "@raycast/api";

const STORAGE_KEY = "recent-project-ids";
const MAX_STORED = 10; // Store more than we display for flexibility

/**
 * Gets the list of recent project IDs from storage.
 */
export async function getRecentProjectIds(): Promise<string[]> {
  const stored = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

/**
 * Adds a project ID to the front of the recent list.
 * Deduplicates and limits to MAX_STORED items.
 */
export async function addRecentProject(projectId: string): Promise<void> {
  const current = await getRecentProjectIds();

  // Remove if already exists, then add to front
  const filtered = current.filter((id) => id !== projectId);
  const updated = [projectId, ...filtered].slice(0, MAX_STORED);

  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Removes stale IDs from storage that no longer exist in the API.
 * Call after fetching projects to keep storage clean.
 */
export async function pruneStaleRecents(validIds: Set<string>): Promise<void> {
  const current = await getRecentProjectIds();
  const pruned = current.filter((id) => validIds.has(id));

  // Only update storage if something was pruned
  if (pruned.length !== current.length) {
    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  }
}
