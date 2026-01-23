/**
 * GUID Visual Overlay Extension
 *
 * Main entry point for VS Code extension.
 * Registers hover provider for deterministic GUID visual identity display.
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { registerGuidHoverProvider } from './hoverProvider';

/**
 * Extension activation
 * Called when extension is first activated
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('GUID Visual Overlay extension activated');

  // Register hover provider for GUIDs
  registerGuidHoverProvider(context);

  // Register insert GUID command
  const insertGuidCommand = vscode.commands.registerCommand(
    'guid-visual-overlay.insertGuid',
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      const guid = crypto.randomUUID();
      editor.edit((editBuilder) => {
        editor.selections.forEach((selection) => {
          editBuilder.replace(selection, guid);
        });
      });
    }
  );

  context.subscriptions.push(insertGuidCommand);
}

/**
 * Extension deactivation
 * Called when extension is deactivated
 */
export function deactivate(): void {
  console.log('GUID Visual Overlay extension deactivated');
}
