/**
 * Unified project representation across API types.
 * Normalized from both Custom API and Supabase responses.
 */
export interface Project {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** URL to open in ChatGPT */
  openUrl: string;
  /** Optional description */
  description?: string;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Custom API response wrapper
 */
export interface CustomAPIProjectsResponse {
  projects: CustomAPIProject[];
}

/**
 * Project from Custom API
 */
export interface CustomAPIProject {
  id: string;
  name: string;
  open_url: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Project from Supabase REST API
 * Note: URL is constructed from id, not stored in DB
 */
export interface SupabaseProject {
  id: string;
  title: string;
  created_at?: string;
  last_confirmed_at?: string;
}

/**
 * API meta response (Custom API only)
 */
export interface APIMetaResponse {
  version: string;
  name?: string;
  project_count?: number;
}
