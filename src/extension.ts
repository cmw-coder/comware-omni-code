import * as vscode from 'vscode';
import { InlineCompletionProvider } from './providers/InlineCompletionProvider';
import { InlineChatProvider } from './providers/InlineChatProvider';
import { ChatPanelService } from './services/ChatPanelService';
import { OpenAIClient } from './services/OpenAIClient';
import { TempProvider } from './providers/TempProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('[comware-omni-code] Extension activated');

    // Show a notification to confirm activation
    vscode.window.showInformationMessage('Comware Omni Code extension is now active!');

    // Create OpenAI client instance
    const openAIClient = new OpenAIClient();

    // Create inline chat provider
    const inlineChatProvider = new InlineChatProvider(openAIClient);

    const tempProvider = new TempProvider();

    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(copilot) Comware Omni";
    statusBarItem.tooltip = "Comware Omni Code is active";
    statusBarItem.command = 'comware-omni-code.showStatus';
    statusBarItem.show();

    // Create and register chat panel service
    const chatPanelService = new ChatPanelService(context, openAIClient);
    const chatPanelProvider = vscode.window.registerWebviewViewProvider(
        ChatPanelService.viewId, 
        chatPanelService,
        { webviewOptions: { retainContextWhenHidden: true } }
    );

    // Register commands
    const helloWorldCommand = vscode.commands.registerCommand('comware-omni-code.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Comware Omni Code!');
    });

    const showStatusCommand = vscode.commands.registerCommand('comware-omni-code.showStatus', () => {
        vscode.window.showInformationMessage('Comware Omni Code extension is running and active!');
    });

    const openChatPanelCommand = vscode.commands.registerCommand('comware-omni-code.openChatPanel', () => {
        vscode.commands.executeCommand('workbench.view.extension.comware-omni-sidebar');
    });

    const startChatSessionCommand = vscode.commands.registerCommand('comware-omni-code.startChatSession', () => {
        vscode.commands.executeCommand('workbench.view.extension.comware-omni-sidebar');
        vscode.window.showInformationMessage('Chat panel opened! Start a conversation with AI.');
    });

    const editCodeCommand = vscode.commands.registerCommand('comware-omni-code.editCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code to edit');
            return;
        }

        const instruction = await vscode.window.showInputBox({
            prompt: 'How should I edit this code?',
            placeHolder: 'Enter your editing instruction...'
        });

        if (!instruction) {
            return;
        }

        try {
            const prompt = `Edit the following code according to this instruction: "${instruction}"\n\nCode:\n${selectedText}\n\nReturn only the modified code without any explanation.`;
            const editedCode = await openAIClient.getChatCompletion(prompt, []);
            
            await editor.edit((editBuilder: vscode.TextEditorEdit) => {
                editBuilder.replace(selection, editedCode);
            });

            vscode.window.showInformationMessage('Code edited successfully!');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to edit code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    const runAgentCommand = vscode.commands.registerCommand('comware-omni-code.runAgent', async () => {
        const task = await vscode.window.showInputBox({
            prompt: 'What task should the AI agent help you with?',
            placeHolder: 'Describe the task...'
        });

        if (!task) {
            return;
        }

        // Open chat panel and send the agent task
        vscode.commands.executeCommand('workbench.view.extension.comware-omni-sidebar');
        
        // Show a notification that the agent is working
        vscode.window.showInformationMessage(`AI Agent is working on: ${task}`);
    });

    const inlineChatCommand = vscode.commands.registerCommand('comware-omni-code.inlineChat', async () => {
        await inlineChatProvider.startInlineChat();
    });
    const tempCommand = vscode.commands.registerCommand('comware-omni-code.tempCommand', async () => {
        await tempProvider.startInlineChat();
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
        openChatPanelCommand,
        startChatSessionCommand,
        editCodeCommand,
        runAgentCommand,
        inlineChatCommand,
        inlineProviderRegistration,
        chatPanelProvider,
        inlineChatProvider
    );
}

export function deactivate() {
    console.log('[comware-omni-code] Extension deactivated');
}
