/**
 * GUID Hover Provider
 *
 * Displays deterministic visual overlay when hovering over GUIDs.
 * No text modification, state-free operation.
 */

import * as vscode from 'vscode';
import { getGuidAtPosition } from './guidDetector';
import { generateVisualIdentity } from './visualIdentity';
import { getCachedAadObject, lookupGuidInAad, formatAadObjectForHover, AadObject } from './aadLookup';

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
   * Avatar shows immediately; AAD lookup triggered by button click
   */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.Hover | null {
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

    // Get configured avatar style and AAD lookup setting
    const config = vscode.workspace.getConfiguration('guidVisualOverlay');
    const styleName = config.get<string>('avatarStyle', 'bottts');
    const enableAadLookup = config.get<boolean>('enableAadLookup', false);

    // Generate deterministic visual identity (synchronous)
    const identity = generateVisualIdentity(guid, styleName);

    // Check cache synchronously for AAD info
    let aadObject: AadObject | null = null;
    let showLookupButton = false;

    if (enableAadLookup) {
      const cached = getCachedAadObject(guid);
      if (cached !== undefined) {
        aadObject = cached; // May be null if previously looked up and not found
      } else {
        showLookupButton = true; // Not in cache, show button
      }
    }

    // Create hover content with visual overlay (returns immediately)
    const hover = this.createHoverContent(guid, identity, aadObject, showLookupButton);

    return hover;
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

  context.subscriptions.push(hoverDisposable, lookupCommand);
}
