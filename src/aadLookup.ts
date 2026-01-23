/**
 * Azure AD GUID Lookup
 *
 * Provides optional AAD object lookup for GUIDs using the Azure CLI.
 * Queries users, groups, service principals, and app registrations.
 */

import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execAsync = promisify(exec);

/** AAD object types with their display icons */
export type AadObjectType = 'user' | 'group' | 'servicePrincipal' | 'app';

/** Icons for each AAD object type */
export const AAD_TYPE_ICONS: Record<AadObjectType, string> = {
  user: '👤',
  group: '👥',
  servicePrincipal: '🤖',
  app: '📱',
};

/** Represents an AAD object found by GUID */
export interface AadObject {
  type: AadObjectType;
  displayName: string;
  /** User principal name or email for users */
  userPrincipalName?: string;
  /** Email for users/groups */
  mail?: string;
  /** App ID for service principals and apps */
  appId?: string;
  /** Description for groups */
  description?: string;
}

/** Cache entry with TTL tracking */
interface CacheEntry {
  result: AadObject | null;
  timestamp: number;
}

/** LRU cache for AAD lookup results */
class LruCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize: number = 100, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key: string): AadObject | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined; // Not in cache
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined; // Expired
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.result;
  }

  /** Check if key exists and is not expired (without updating LRU order) */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  set(key: string, result: AadObject | null): void {
    // Remove oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/** Global cache instance */
const lookupCache = new LruCache();

/** CLI status cache to avoid repeated checks */
let cliStatusCache: { available: boolean; timestamp: number } | null = null;
const CLI_STATUS_TTL_MS = 60 * 1000; // 1 minute

/**
 * Check if Azure CLI is installed and authenticated
 * @returns true if az CLI is available and authenticated
 */
export async function checkAzCliStatus(): Promise<boolean> {
  // Check cached status
  if (cliStatusCache && Date.now() - cliStatusCache.timestamp < CLI_STATUS_TTL_MS) {
    return cliStatusCache.available;
  }

  const timeoutMs = getTimeoutSetting();

  try {
    // Check if az CLI is installed and authenticated by getting current account
    await execAsync('az account show --output none', {
      timeout: timeoutMs,
      windowsHide: true,
    });

    cliStatusCache = { available: true, timestamp: Date.now() };
    return true;
  } catch {
    // CLI not installed, not authenticated, or error
    cliStatusCache = { available: false, timestamp: Date.now() };
    return false;
  }
}

/**
 * Get the configured timeout setting
 */
function getTimeoutSetting(): number {
  const config = vscode.workspace.getConfiguration('guidVisualOverlay');
  return config.get<number>('aadLookupTimeout', 5000);
}

/**
 * Execute an az CLI command safely
 * @returns parsed JSON output or null on any error
 */
async function execAzCommand<T>(command: string, timeoutMs: number): Promise<T | null> {
  try {
    const { stdout } = await execAsync(command, {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    return JSON.parse(stdout) as T;
  } catch {
    // Command failed (not found, not authenticated, timeout, etc.)
    return null;
  }
}

/** Raw user response from az ad user show */
interface AzAdUser {
  displayName?: string;
  userPrincipalName?: string;
  mail?: string;
}

/** Raw group response from az ad group show */
interface AzAdGroup {
  displayName?: string;
  mail?: string;
  description?: string;
}

/** Raw service principal response from az ad sp show */
interface AzAdServicePrincipal {
  displayName?: string;
  appId?: string;
}

/** Raw app response from az ad app show */
interface AzAdApp {
  displayName?: string;
  appId?: string;
}

/**
 * Look up a GUID in Azure AD
 * Queries users, groups, service principals, and app registrations in parallel
 *
 * @param guid - The GUID to look up (normalized lowercase with dashes)
 * @returns AadObject if found, null if not found or on any error
 */
export async function lookupGuidInAad(guid: string): Promise<AadObject | null> {
  // Check cache first
  const cached = lookupCache.get(guid);
  if (cached !== undefined) {
    return cached;
  }

  // Check if CLI is available
  const cliAvailable = await checkAzCliStatus();
  if (!cliAvailable) {
    lookupCache.set(guid, null);
    return null;
  }

  const timeoutMs = getTimeoutSetting();

  // Run all 4 lookups in parallel
  const [userResult, groupResult, spResult, appResult] = await Promise.all([
    execAzCommand<AzAdUser>(`az ad user show --id "${guid}" --output json`, timeoutMs),
    execAzCommand<AzAdGroup>(`az ad group show --group "${guid}" --output json`, timeoutMs),
    execAzCommand<AzAdServicePrincipal>(`az ad sp show --id "${guid}" --output json`, timeoutMs),
    execAzCommand<AzAdApp>(`az ad app show --id "${guid}" --output json`, timeoutMs),
  ]);

  let result: AadObject | null = null;

  // Check results in order of specificity
  if (userResult?.displayName) {
    result = {
      type: 'user',
      displayName: userResult.displayName,
      userPrincipalName: userResult.userPrincipalName,
      mail: userResult.mail,
    };
  } else if (groupResult?.displayName) {
    result = {
      type: 'group',
      displayName: groupResult.displayName,
      mail: groupResult.mail,
      description: groupResult.description,
    };
  } else if (spResult?.displayName) {
    result = {
      type: 'servicePrincipal',
      displayName: spResult.displayName,
      appId: spResult.appId,
    };
  } else if (appResult?.displayName) {
    result = {
      type: 'app',
      displayName: appResult.displayName,
      appId: appResult.appId,
    };
  }

  // Cache the result (including null for not found)
  lookupCache.set(guid, result);

  return result;
}

/**
 * Format AAD object for display in hover
 * @returns Markdown-formatted string with icon and details
 */
export function formatAadObjectForHover(obj: AadObject): string {
  const icon = AAD_TYPE_ICONS[obj.type];
  const typeLabel = formatTypeLabel(obj.type);

  let details = `${icon} **${typeLabel}**: ${escapeMarkdown(obj.displayName)}`;

  // Add relevant details based on type
  switch (obj.type) {
    case 'user':
      if (obj.mail) {
        details += `\n\n📧 ${escapeMarkdown(obj.mail)}`;
      } else if (obj.userPrincipalName) {
        details += `\n\n📧 ${escapeMarkdown(obj.userPrincipalName)}`;
      }
      break;
    case 'group':
      if (obj.mail) {
        details += `\n\n📧 ${escapeMarkdown(obj.mail)}`;
      }
      if (obj.description) {
        details += `\n\n📝 ${escapeMarkdown(obj.description)}`;
      }
      break;
    case 'servicePrincipal':
    case 'app':
      if (obj.appId) {
        details += `\n\n🔑 App ID: \`${obj.appId}\``;
      }
      break;
  }

  return details;
}

/**
 * Format type label for display
 */
function formatTypeLabel(type: AadObjectType): string {
  switch (type) {
    case 'user':
      return 'User';
    case 'group':
      return 'Group';
    case 'servicePrincipal':
      return 'Service Principal';
    case 'app':
      return 'App Registration';
  }
}

/**
 * Escape special markdown characters
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[*_`[\]]/g, '\\$&');
}

/** Set of GUIDs currently being looked up (to avoid duplicate requests) */
const pendingLookups = new Set<string>();

/**
 * Get cached AAD object synchronously (for immediate hover display)
 * @returns AadObject if cached and valid, null if cached as not found, undefined if not in cache
 */
export function getCachedAadObject(guid: string): AadObject | null | undefined {
  return lookupCache.get(guid);
}

/**
 * Trigger a background AAD lookup for a GUID (non-blocking)
 * Results will be available in cache for subsequent hovers
 * @param guid - The GUID to look up
 */
export function triggerAadLookup(guid: string): void {
  // Skip if already cached or lookup in progress
  if (lookupCache.has(guid) || pendingLookups.has(guid)) {
    return;
  }

  pendingLookups.add(guid);

  // Fire and forget - lookup runs in background
  lookupGuidInAad(guid).finally(() => {
    pendingLookups.delete(guid);
  });
}

/**
 * Clear the lookup cache (useful for testing or manual refresh)
 */
export function clearAadLookupCache(): void {
  lookupCache.clear();
  cliStatusCache = null;
}
