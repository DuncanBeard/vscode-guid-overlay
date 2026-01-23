/**
 * GUID Visual Overlay Extension
 *
 * Main entry point for VS Code extension.
 * Registers hover provider for deterministic GUID visual identity display.
 */

import * as vscode from 'vscode';
import { registerGuidHoverProvider } from './hoverProvider';

/**
 * Extension activation
 * Called when extension is first activated
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('GUID Visual Overlay extension activated');

  // Register hover provider for GUIDs
  registerGuidHoverProvider(context);
}

/**
 * Extension deactivation
 * Called when extension is deactivated
 */
export function deactivate(): void {
  console.log('GUID Visual Overlay extension deactivated');
}
