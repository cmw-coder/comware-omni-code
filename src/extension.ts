import * as vscode from 'vscode';
import { InlineCompletionProvider } from './providers/InlineCompletionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('[comware-omni-code] Extension activated');

    // Show a notification to confirm activation
    vscode.window.showInformationMessage('Comware Omni Code extension is now active!');

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(copilot) Comware Omni";
    statusBarItem.tooltip = "Comware Omni Code is active";
    statusBarItem.command = 'comware-omni-code.showStatus';
    statusBarItem.show();

    // Register commands
    const helloWorldCommand = vscode.commands.registerCommand('comware-omni-code.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Comware Omni Code!');
    });

    const showStatusCommand = vscode.commands.registerCommand('comware-omni-code.showStatus', () => {
        vscode.window.showInformationMessage('Comware Omni Code extension is running and active!');
    });

    const inlineCompletionProvider = new InlineCompletionProvider();

    const inlineProviderRegistration = vscode.languages.registerInlineCompletionItemProvider(
        { scheme: 'file', language: '*' },
        inlineCompletionProvider
    );

    context.subscriptions.push(
        statusBarItem,
        helloWorldCommand,
        showStatusCommand,
        inlineProviderRegistration
    );
}

export function deactivate() {
    console.log('[comware-omni-code] Extension deactivated');
}
