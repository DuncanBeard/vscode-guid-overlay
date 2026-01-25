/**
 * GUID Hover Provider
 *
 * Displays deterministic visual overlay when hovering over GUIDs.
 * No text modification, state-free operation.
 */

import * as vscode from 'vscode';
import { getGuidAtPosition } from './guidDetector';
import { generateVisualIdentity } from './visualIdentity';
import { getCachedAadObject, lookupGuidInAad, formatAadObjectForHover, clearAadLookupCache, AadObject } from './aadLookup';

/** AAD lookup mode options */
type AadLookupMode = 'disabled' | 'enabled' | 'auto';

/** Track GUIDs with pending lookups to show loading state */
const pendingLookups = new Set<string>();

/**
 * Hover provider for GUID visual overlays
 * Implements VS Code HoverProvider interface
 */
export class GuidHoverProvider implements vscode.HoverProvider {
  /**
   * Provide hover content for GUID at position
   * Returns null if no GUID found at position
   *
   * Behavior depends on aadLookupMode setting:
   * - disabled: Avatar only
   * - enabled: Avatar + lookup button (results in notification)
   * - auto: Wait for AAD lookup, then show avatar + info
   */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    // Get text at current line
    const line = document.lineAt(position.line);
    const lineText = line.text;

    // Calculate character position in line
    const charPosition = position.character;

    // Check if position contains a GUID
    const guid = getGuidAtPosition(lineText, charPosition);

    if (!guid) {
      return null;
    }

    // Get configuration
    const config = vscode.workspace.getConfiguration('guidVisualOverlay');
    const styleName = config.get<string>('avatarStyle', 'bottts');
    const aadMode = config.get<AadLookupMode>('aadLookupMode', 'disabled');
    const aadTimeout = config.get<number>('aadLookupTimeout', 5000);

    // Generate deterministic visual identity (synchronous)
    const identity = generateVisualIdentity(guid, styleName);

    // Handle based on mode
    if (aadMode === 'auto') {
      return this.provideHoverWithAutoLookup(guid, identity, aadTimeout, token);
    } else {
      return this.provideHoverImmediate(guid, identity, aadMode === 'enabled');
    }
  }

  /**
   * Provide hover immediately (for disabled/enabled modes)
   */
  private provideHoverImmediate(
    guid: string,
    identity: { avatarSvg: string },
    enableLookupButton: boolean
  ): vscode.Hover {
    let aadObject: AadObject | null = null;
    let showLookupButton = false;

    if (enableLookupButton) {
      const cached = getCachedAadObject(guid);
      if (cached !== undefined) {
        aadObject = cached;
      } else {
        showLookupButton = true;
      }
    }

    return this.createHoverContent(guid, identity, aadObject, showLookupButton);
  }

  /**
   * Provide hover after waiting for AAD lookup (for auto mode)
   */
  private async provideHoverWithAutoLookup(
    guid: string,
    identity: { avatarSvg: string },
    timeoutMs: number,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    // Check cache first
    const cached = getCachedAadObject(guid);
    if (cached !== undefined) {
      // Already cached, return immediately
      return this.createHoverContent(guid, identity, cached, false);
    }

    // Wait for lookup with timeout
    try {
      const result = await Promise.race([
        lookupGuidInAad(guid),
        new Promise<AadObject | null>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        ),
        new Promise<AadObject | null>((_, reject) => {
          token.onCancellationRequested(() => reject(new Error('cancelled')));
        }),
      ]);

      if (token.isCancellationRequested) {
        return null;
      }

      return this.createHoverContent(guid, identity, result, false);
    } catch {
      // Timeout or cancelled - show avatar without AAD info
      if (token.isCancellationRequested) {
        return null;
      }
      return this.createHoverContent(guid, identity, null, false);
    }
  }

  /**
   * Create hover content with visual overlay
   * Uses Markdown for formatting and color display
   */
  private createHoverContent(
    guid: string,
    identity: { avatarSvg: string },
    aadObject: AadObject | null,
    showLookupButton: boolean
  ): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Convert SVG to base64 data URI for embedding in markdown
    const svgBase64 = Buffer.from(identity.avatarSvg).toString('base64');
    const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

    // Large avatar image only
    markdown.appendMarkdown(`<img src="${svgDataUri}" width="120" height="120" />`);

    // Append AAD section based on status
    if (aadObject) {
      markdown.appendMarkdown('\n\n---\n\n');
      markdown.appendMarkdown(formatAadObjectForHover(aadObject));
    } else if (showLookupButton) {
      // Show button to trigger lookup
      markdown.appendMarkdown('\n\n---\n\n');
      const commandUri = `command:guid-visual-overlay.lookupAad?${encodeURIComponent(JSON.stringify(guid))}`;
      markdown.appendMarkdown(`[🔍 Look up in Azure AD](${commandUri})`);
    }

    return new vscode.Hover(markdown);
  }
}

/**
 * Execute AAD lookup and show results in a notification
 */
async function executeAadLookup(guid: string): Promise<void> {
  if (pendingLookups.has(guid)) {
    return; // Already in progress
  }

  pendingLookups.add(guid);

  try {
    // Show progress while looking up
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Looking up GUID in Azure AD...',
        cancellable: false,
      },
      async () => {
        const result = await lookupGuidInAad(guid);

        if (result) {
          // Format the result for display
          const icon = result.type === 'user' ? '👤' :
                       result.type === 'group' ? '👥' :
                       result.type === 'servicePrincipal' ? '🤖' : '📱';
          const typeLabel = result.type === 'user' ? 'User' :
                            result.type === 'group' ? 'Group' :
                            result.type === 'servicePrincipal' ? 'Service Principal' : 'App Registration';

          let message = `${icon} ${typeLabel}: ${result.displayName}`;

          // Add extra details
          if (result.mail) {
            message += ` (${result.mail})`;
          } else if (result.userPrincipalName) {
            message += ` (${result.userPrincipalName})`;
          } else if (result.appId) {
            message += ` (App ID: ${result.appId})`;
          }

          vscode.window.showInformationMessage(message);
        } else {
          vscode.window.showInformationMessage(`GUID not found in Azure AD: ${guid}`);
        }
      }
    );
  } catch (error) {
    vscode.window.showErrorMessage('Failed to look up GUID in Azure AD');
  } finally {
    pendingLookups.delete(guid);
  }
}

/**
 * Register GUID hover provider for all file types
 */
export function registerGuidHoverProvider(context: vscode.ExtensionContext): void {
  const provider = new GuidHoverProvider();

  // Register for all languages/files
  const hoverDisposable = vscode.languages.registerHoverProvider(
    { scheme: '*', language: '*' },
    provider
  );

  // Register AAD lookup command (triggered by hover button)
  const lookupCommand = vscode.commands.registerCommand(
    'guid-visual-overlay.lookupAad',
    (guid: string) => executeAadLookup(guid)
  );

  // Register command to look up GUID at cursor
  const lookupAtCursorCommand = vscode.commands.registerCommand(
    'guid-visual-overlay.lookupGuidAtCursor',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const position = editor.selection.active;
      const line = editor.document.lineAt(position.line);
      const guid = getGuidAtPosition(line.text, position.character);

      if (!guid) {
        vscode.window.showWarningMessage('No GUID found at cursor position');
        return;
      }

      executeAadLookup(guid);
    }
  );

  // Register command to clear AAD cache
  const clearCacheCommand = vscode.commands.registerCommand(
    'guid-visual-overlay.clearAadCache',
    () => {
      clearAadLookupCache();
      vscode.window.showInformationMessage('Azure AD lookup cache cleared');
    }
  );

  context.subscriptions.push(hoverDisposable, lookupCommand, lookupAtCursorCommand, clearCacheCommand);
}
