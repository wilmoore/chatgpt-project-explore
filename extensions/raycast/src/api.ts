import { getPreferenceValues } from "@raycast/api";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type {
  Project,
  CustomAPIProjectsResponse,
  CustomAPIProject,
  SupabaseProject,
  ApiUrlConfig,
} from "./types";

/** Well-known location for API URL config written by chatgpt-project-indexer */
const API_URL_CONFIG_PATH = join(homedir(), ".chatgpt-indexer", "api-url.json");

/**
 * Reads the API URL from the well-known config file.
 * Returns undefined if file doesn't exist or is invalid.
 */
function readApiUrlFromConfig(): string | undefined {
  try {
    const content = readFileSync(API_URL_CONFIG_PATH, "utf-8");
    const config = JSON.parse(content) as ApiUrlConfig;
    return config.url;
  } catch {
    // File doesn't exist or is invalid - fall back to preferences
    return undefined;
  }
}

/**
 * Detects if the URL points to a Supabase REST API.
 * Per ADR-003: URLs containing "/rest/v1" are Supabase endpoints.
 */
export function isSupabaseAPI(baseUrl: string): boolean {
  return baseUrl.includes("/rest/v1");
}

/**
 * Detects if the URL points to a Supabase Edge Function.
 * Edge Functions use "/functions/v1" path.
 */
export function isEdgeFunctionAPI(baseUrl: string): boolean {
  return baseUrl.includes("/functions/v1");
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

/** ChatGPT project URL base */
const CHATGPT_PROJECT_URL_BASE = "https://chatgpt.com/g/p-";

/**
 * Converts a Supabase project to unified Project format.
 * URL is constructed from project ID since it's not stored in DB.
 */
function fromSupabase(project: SupabaseProject): Project {
  return {
    id: project.id,
    name: project.title,
    openUrl: `${CHATGPT_PROJECT_URL_BASE}${project.id}`,
    createdAt: project.created_at,
    updatedAt: project.last_confirmed_at,
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
  url.searchParams.set("select", "id,title,created_at,last_confirmed_at");
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
 * Fetches projects from Supabase Edge Function.
 * Edge Functions return array directly (not wrapped in { projects: [] }).
 */
async function fetchEdgeFunctionProjects(baseUrl: string): Promise<Project[]> {
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

  // Edge Function returns array directly
  const data = (await response.json()) as CustomAPIProject[];
  return data.map(fromCustomAPI);
}

/** Result of URL resolution with source info */
export interface ResolvedUrl {
  url: string;
  source: "auto" | "preference";
}

/**
 * Resolves the API URL from auto-discovery or preferences.
 * Priority: 1) ~/.chatgpt-indexer/api-url.json  2) Extension preferences
 * Returns both the URL and its source.
 */
export function resolveApiUrl(): ResolvedUrl {
  // Try auto-discovery from well-known config file first
  const autoDiscoveredUrl = readApiUrlFromConfig();
  if (autoDiscoveredUrl) {
    return { url: autoDiscoveredUrl, source: "auto" };
  }

  // Fall back to manual preference
  const preferences = getPreferenceValues<Preferences>();
  if (preferences.apiUrl) {
    return { url: preferences.apiUrl, source: "preference" };
  }

  throw new Error(
    "API URL not configured. Run chatgpt-indexer or set URL in extension preferences.",
  );
}

/**
 * Gets the current API URL or undefined if not configured.
 * Does not throw - for display purposes only.
 */
export function getCurrentApiUrl(): ResolvedUrl | undefined {
  try {
    return resolveApiUrl();
  } catch {
    return undefined;
  }
}

/**
 * Fetches projects from the configured API.
 * Auto-detects API type: Edge Function > Supabase REST > Custom API.
 */
export async function fetchProjects(): Promise<Project[]> {
  const { url } = resolveApiUrl();

  if (isEdgeFunctionAPI(url)) {
    return await fetchEdgeFunctionProjects(url);
  } else if (isSupabaseAPI(url)) {
    return await fetchSupabaseProjects(url);
  } else {
    return await fetchCustomAPIProjects(url);
  }
}
