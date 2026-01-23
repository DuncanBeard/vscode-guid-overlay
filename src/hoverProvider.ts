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

    // Generate deterministic visual identity
    const identity = generateVisualIdentity(guid);

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
    identity: { label: string; color: string; symbol: string; rawHash: string }
  ): vscode.Hover {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.supportHtml = true;

    // Visual identity display
    // Format: [Symbol] [Label]
    // Color indicator shown as inline HTML
    markdown.appendMarkdown(`### ${identity.symbol} \`${identity.label}\`\n\n`);

    // Color swatch (HTML block)
    markdown.appendMarkdown(
      `<div style="display: inline-block; width: 16px; height: 16px; background-color: ${identity.color}; border: 1px solid #ccc; border-radius: 3px; margin-right: 8px; vertical-align: middle;"></div>`
    );
    markdown.appendMarkdown(`<code style="vertical-align: middle;">${identity.color}</code>\n\n`);

    // GUID value
    markdown.appendMarkdown(`**GUID:** \`${guid}\`\n\n`);

    // Hash (for debugging/verification)
    markdown.appendMarkdown(`<details><summary>Hash</summary>\n\n`);
    markdown.appendMarkdown(`\`\`\`\n${identity.rawHash}\n\`\`\`\n\n`);
    markdown.appendMarkdown(`</details>`);

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
