import * as vscode from 'vscode';
import { CompletionProvider } from './providers/CompletionProvider';

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

    const completionProvider = new CompletionProvider();

    const providerRegistration = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: '*' },
        completionProvider,
        ...[' ', '.', '(', "'", '"']
    );

    context.subscriptions.push(
        statusBarItem,
        helloWorldCommand,
        showStatusCommand,
        providerRegistration
    );
}

export function deactivate() {
    console.log('[comware-omni-code] Extension deactivated');
}
