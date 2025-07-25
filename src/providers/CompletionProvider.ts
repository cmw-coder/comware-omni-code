import * as vscode from 'vscode';
import { OpenAIClient } from '../services/OpenAIClient';

export class CompletionProvider implements vscode.CompletionItemProvider {
    private openAIClient: OpenAIClient;

    constructor() {
        this.openAIClient = new OpenAIClient();
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const linePrefix = document.lineAt(position).text.substring(0, position.character);
        if (!linePrefix.trim()) {
            return [];
        }

        try {
            const suggestion = await this.openAIClient.getCompletion(linePrefix);
            if (suggestion) {
                const completionItem = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Snippet);
                completionItem.insertText = new vscode.SnippetString(suggestion);
                return [completionItem];
            }
        } catch (error) {
            vscode.window.showErrorMessage('Error fetching completion: ' + (error as Error).message);
        }


        return [];
    }
}
