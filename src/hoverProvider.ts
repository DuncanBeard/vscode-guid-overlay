/**
 * GUID Hover Provider
 *
 * Displays deterministic visual overlay when hovering over GUIDs.
 * No text modification, state-free operation.
 */

import * as vscode from 'vscode';
import { getGuidAtPosition } from './guidDetector';
import { generateVisualIdentity } from './visualIdentity';

/**
 * Hover provider for GUID visual overlays
 * Implements VS Code HoverProvider interface
 */
export class GuidHoverProvider implements vscode.HoverProvider {
  /**
   * Provide hover content for GUID at position
   * Returns null if no GUID found at position
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

    // Get configured avatar style
    const config = vscode.workspace.getConfiguration('guidVisualOverlay');
    const styleName = config.get<string>('avatarStyle', 'bottts');

    // Generate deterministic visual identity
    const identity = generateVisualIdentity(guid, styleName);

    // Create hover content with visual overlay
    const hover = this.createHoverContent(guid, identity);

    return hover;
  }

  /**
   * Create hover content with visual overlay
   * Uses Markdown for formatting and color display
   */
  private createHoverContent(
    guid: string,
    identity: { avatarSvg: string }
  ): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    // Security: Use markdown image syntax instead of HTML
    // This avoids the need for isTrusted=true and supportHtml=true
    markdown.isTrusted = false;
    markdown.supportHtml = false;

    // Convert SVG to base64 data URI for embedding in markdown
    const svgBase64 = Buffer.from(identity.avatarSvg).toString('base64');
    const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

    // Use markdown image syntax (safer than HTML)
    markdown.appendMarkdown(`![GUID Avatar](${svgDataUri})`);

    return new vscode.Hover(markdown);
  }
}

/**
 * Register GUID hover provider for all file types
 */
export function registerGuidHoverProvider(context: vscode.ExtensionContext): void {
  const provider = new GuidHoverProvider();

  // Register for file and untitled schemes only (security best practice)
  const disposable = vscode.languages.registerHoverProvider(
    [
      { scheme: 'file' },
      { scheme: 'untitled' }
    ],
    provider
  );

  context.subscriptions.push(disposable);
}
