import * as vscode from 'vscode';
import { configureDependencies } from './core/container/containerConfig';
import { container } from './core/container/Container';
import { TYPES } from './core/container/types';

// Presentation layer imports
import { CompletionProvider } from './presentation/providers/CompletionProvider';
import { InlineCompletionProvider } from './presentation/providers/InlineCompletionProvider';
import { InlineChatProvider } from './presentation/providers/InlineChatProvider';
import { ChatPanelService } from './presentation/views/ChatPanelService';

// Application layer imports
import { IChatUseCase } from './application/usecases/ChatUseCase';
import { ICodeCompletionUseCase } from './application/usecases/CodeCompletionUseCase';
import { IInlineChatUseCase } from './application/usecases/InlineChatUseCase';

// Core interfaces
import { ILogger } from './core/interfaces/ILogger';

export function activate(context: vscode.ExtensionContext) {
    try {
        // Configure dependency injection
        configureDependencies();
        
        const logger = container.get<ILogger>(TYPES.Logger);
        logger.info('Comware Omni Code extension activated');

        // Show activation notification
        vscode.window.showInformationMessage('Comware Omni Code extension is now active!');

        // Create status bar item
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(copilot) Comware Omni";
        statusBarItem.tooltip = "Comware Omni Code is active";
        statusBarItem.command = 'comware-omni-code.showStatus';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);

        // Register providers
        registerProviders(context);
        
        // Register commands
        registerCommands(context);
        
        // Register chat panel
        registerChatPanel(context);

        logger.info('Extension activation completed successfully');
    } catch (error) {
        console.error('Failed to activate extension:', error);
        vscode.window.showErrorMessage(`Failed to activate Comware Omni Code: ${(error as Error).message}`);
    }
}

function registerProviders(context: vscode.ExtensionContext): void {
    const logger = container.get<ILogger>(TYPES.Logger);
    
    try {
        // Register completion providers
        const completionProvider = new CompletionProvider();
        const completionProviderDisposable = vscode.languages.registerCompletionItemProvider(
            ['typescript', 'javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'], 
            completionProvider
        );
        context.subscriptions.push(completionProviderDisposable);

        // Register inline completion provider
        const inlineCompletionProvider = new InlineCompletionProvider();
        const inlineCompletionProviderDisposable = vscode.languages.registerInlineCompletionItemProvider(
            ['typescript', 'javascript', 'python', 'java', 'cpp', 'c', 'go', 'rust'], 
            inlineCompletionProvider
        );
        context.subscriptions.push(inlineCompletionProviderDisposable);

        // Register inline chat provider
        const inlineChatProvider = new InlineChatProvider();
        context.subscriptions.push(inlineChatProvider);

        logger.info('Providers registered successfully');
    } catch (error) {
        logger.error('Failed to register providers', error as Error);
        throw error;
    }
}

function registerCommands(context: vscode.ExtensionContext): void {
    const logger = container.get<ILogger>(TYPES.Logger);
    
    try {
        // Basic commands
        const helloWorldCommand = vscode.commands.registerCommand('comware-omni-code.helloWorld', () => {
            vscode.window.showInformationMessage('Hello World from Comware Omni Code!');
        });

        const showStatusCommand = vscode.commands.registerCommand('comware-omni-code.showStatus', () => {
            vscode.window.showInformationMessage('Comware Omni Code extension is running and active!');
        });

        const openChatPanelCommand = vscode.commands.registerCommand('comware-omni-code.openChatPanel', () => {
            vscode.commands.executeCommand('workbench.view.extension.comware-omni-sidebar');
        });

        // Chat commands
        const startChatSessionCommand = vscode.commands.registerCommand('comware-omni-code.startChatSession', async () => {
            try {
                const chatUseCase = container.get<IChatUseCase>(TYPES.ChatUseCase);
                const sessionId = await chatUseCase.createNewSession();
                vscode.window.showInformationMessage(`New chat session created: ${sessionId}`);
            } catch (error) {
                logger.error('Failed to start chat session', error as Error);
                vscode.window.showErrorMessage('Failed to start chat session');
            }
        });

        // Inline chat command
        const editCodeCommand = vscode.commands.registerCommand('comware-omni-code.editCode', async () => {
            try {
                const inlineChatProvider = new InlineChatProvider();
                await inlineChatProvider.startInlineChat();
            } catch (error) {
                logger.error('Failed to start inline chat', error as Error);
                vscode.window.showErrorMessage('Failed to start code editing');
            }
        });

        // Agent command placeholder
        const runAgentCommand = vscode.commands.registerCommand('comware-omni-code.runAgent', () => {
            vscode.window.showInformationMessage('AI Agent functionality coming soon!');
        });

        // Clear completion history command
        const clearHistoryCommand = vscode.commands.registerCommand('comware-omni-code.clearCompletionHistory', async () => {
            try {
                const codeCompletionUseCase = container.get<ICodeCompletionUseCase>(TYPES.CodeCompletionUseCase);
                await codeCompletionUseCase.clearCompletionHistory();
                vscode.window.showInformationMessage('Completion history cleared');
            } catch (error) {
                logger.error('Failed to clear completion history', error as Error);
                vscode.window.showErrorMessage('Failed to clear completion history');
            }
        });

        // Add all commands to subscriptions
        context.subscriptions.push(
            helloWorldCommand,
            showStatusCommand,
            openChatPanelCommand,
            startChatSessionCommand,
            editCodeCommand,
            runAgentCommand,
            clearHistoryCommand
        );

        logger.info('Commands registered successfully');
    } catch (error) {
        logger.error('Failed to register commands', error as Error);
        throw error;
    }
}

function registerChatPanel(context: vscode.ExtensionContext): void {
    const logger = container.get<ILogger>(TYPES.Logger);
    
    try {
        // Create and register chat panel service
        const chatPanelService = new ChatPanelService(context);
        const chatPanelProvider = vscode.window.registerWebviewViewProvider(
            ChatPanelService.viewId, 
            chatPanelService,
            { webviewOptions: { retainContextWhenHidden: true } }
        );
        context.subscriptions.push(chatPanelProvider);

        logger.info('Chat panel registered successfully');
    } catch (error) {
        logger.error('Failed to register chat panel', error as Error);
        throw error;
    }
}

export function deactivate() {
    const logger = container.get<ILogger>(TYPES.Logger);
    logger.info('Comware Omni Code extension deactivated');
    
    // Clean up container
    container.clear();
}
