import * as vscode from 'vscode';
import { CompletionProvider } from './providers/CompletionProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "comware-omni-code" is now active!');

    // Show a notification to confirm activation
    vscode.window.showInformationMessage('Comware Omni Code extension is now active!');

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
        helloWorldCommand,
        showStatusCommand,
        providerRegistration
    );
}

export function deactivate() {
    console.log('Comware Omni Code extension is now deactivated');
}
