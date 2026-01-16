import { getPreferenceValues } from "@raycast/api";
import type {
  Project,
  CustomAPIProjectsResponse,
  CustomAPIProject,
  SupabaseProject,
} from "./types";
import { SUPABASE_ANON_KEY } from "./constants";

/**
 * Detects if the URL points to a Supabase REST API.
 * Per ADR-003: URLs containing "/rest/v1" are Supabase endpoints.
 */
export function isSupabaseAPI(baseUrl: string): boolean {
  return baseUrl.includes("/rest/v1");
}

/**
 * Normalizes a URL to ensure it has a trailing context for API calls.
 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

/**
 * Converts a Custom API project to unified Project format.
 */
function fromCustomAPI(project: CustomAPIProject): Project {
  return {
    id: project.id,
    name: project.name,
    openUrl: project.open_url,
    description: project.description,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

/**
 * Converts a Supabase project to unified Project format.
 */
function fromSupabase(project: SupabaseProject): Project {
  return {
    id: project.id,
    name: project.title,
    openUrl: project.url,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

/**
 * Fetches projects from Supabase REST API.
 */
async function fetchSupabaseProjects(baseUrl: string): Promise<Project[]> {
  const normalizedUrl = normalizeBaseUrl(baseUrl);

  // Build URL - add /projects if not already present
  let projectsUrl = normalizedUrl;
  if (!normalizedUrl.endsWith("/projects")) {
    projectsUrl = `${normalizedUrl}/projects`;
  }

  // Add query parameters for Supabase
  const url = new URL(projectsUrl);
  url.searchParams.set("select", "id,title,url,created_at,updated_at");
  url.searchParams.set("order", "title.asc");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as SupabaseProject[];
  return data.map(fromSupabase);
}

/**
 * Fetches projects from Custom API.
 */
async function fetchCustomAPIProjects(baseUrl: string): Promise<Project[]> {
  const normalizedUrl = normalizeBaseUrl(baseUrl);

  // Build URL - add /projects if not already present
  let projectsUrl = normalizedUrl;
  if (!normalizedUrl.endsWith("/projects")) {
    projectsUrl = `${normalizedUrl}/projects`;
  }

  const response = await fetch(projectsUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as CustomAPIProjectsResponse;
  return data.projects.map(fromCustomAPI);
}

/**
 * Fetches projects from the configured API.
 * Auto-detects API type (Custom vs Supabase) per ADR-003.
 */
export async function fetchProjects(): Promise<Project[]> {
  const preferences = getPreferenceValues<Preferences>();
  const apiUrl = preferences.apiUrl;

  if (!apiUrl) {
    throw new Error(
      "API URL not configured. Please set your API URL in extension preferences.",
    );
  }

  if (isSupabaseAPI(apiUrl)) {
    return await fetchSupabaseProjects(apiUrl);
  } else {
    return await fetchCustomAPIProjects(apiUrl);
  }
}

/**
 * Queues a touch request for a project.
 * Only works with Supabase API.
 * Touch moves the project to the top of the list within 5-10 seconds
 * when the indexer is running in watch mode.
 */
export async function touchProject(
  baseUrl: string,
  projectId: string,
): Promise<void> {
  if (!isSupabaseAPI(baseUrl)) {
    throw new Error("Touch is only available with Supabase API");
  }

  // Build touch_queue endpoint
  // e.g., http://127.0.0.1:54321/rest/v1/touch_queue
  const normalizedUrl = normalizeBaseUrl(baseUrl);
  const baseApiUrl = normalizedUrl.replace(/\/projects$/, "");
  const touchUrl = `${baseApiUrl}/touch_queue`;

  const response = await fetch(touchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ project_id: projectId }),
  });

  if (!response.ok) {
    throw new Error(`Touch failed: HTTP ${response.status}`);
  }
}
