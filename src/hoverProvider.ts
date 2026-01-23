/**
 * GUID Hover Provider
 *
 * Displays deterministic visual overlay when hovering over GUIDs.
 * No text modification, state-free operation.
 */

import * as vscode from 'vscode';
import { getGuidAtPosition } from './guidDetector';
import { generateVisualIdentity } from './visualIdentity';
import { getCachedAadObject, triggerAadLookup, formatAadObjectForHover, AadObject } from './aadLookup';

/**
 * Hover provider for GUID visual overlays
 * Implements VS Code HoverProvider interface
 */
export class GuidHoverProvider implements vscode.HoverProvider {
  /**
   * Provide hover content for GUID at position
   * Returns null if no GUID found at position
   *
   * Avatar loads immediately; AAD info appears on subsequent hovers once cached
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

    // Check cache synchronously for AAD info (non-blocking)
    let aadObject: AadObject | null = null;
    if (enableAadLookup) {
      // Get from cache if available (immediate)
      const cached = getCachedAadObject(guid);
      if (cached !== undefined) {
        aadObject = cached; // Use cached result (may be null if not found in AAD)
      } else {
        // Not in cache - trigger background lookup for next hover
        triggerAadLookup(guid);
      }
    }

    // Create hover content with visual overlay (returns immediately)
    const hover = this.createHoverContent(guid, identity, aadObject);

    return hover;
  }

  /**
   * Create hover content with visual overlay
   * Uses Markdown for formatting and color display
   */
  private createHoverContent(
    guid: string,
    identity: { label: string; color: string; symbol: string; rawHash: string; avatarSvg: string },
    aadObject: AadObject | null
  ): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Convert SVG to base64 data URI for embedding in markdown
    const svgBase64 = Buffer.from(identity.avatarSvg).toString('base64');
    const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

    // Large avatar image only
    markdown.appendMarkdown(`<img src="${svgDataUri}" width="120" height="120" />`);

    // Append AAD object info if found
    if (aadObject) {
      markdown.appendMarkdown('\n\n---\n\n');
      markdown.appendMarkdown(formatAadObjectForHover(aadObject));
    }

    return new vscode.Hover(markdown);
  }
}

/**
 * Register GUID hover provider for all file types
 */
export function registerGuidHoverProvider(context: vscode.ExtensionContext): void {
  const provider = new GuidHoverProvider();

  // Register for all languages/files
  const disposable = vscode.languages.registerHoverProvider(
    { scheme: '*', language: '*' },
    provider
  );

  context.subscriptions.push(disposable);
}
