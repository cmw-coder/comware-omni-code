import * as vscode from 'vscode';
import { container } from '../../core/container/Container';
import { TYPES } from '../../core/container/types';
import { ICodeCompletionUseCase } from '../../application/usecases/CodeCompletionUseCase';
import { ILogger } from '../../core/interfaces/ILogger';

export class CompletionProvider implements vscode.CompletionItemProvider {
    private codeCompletionUseCase: ICodeCompletionUseCase;
    private logger: ILogger;

    constructor() {
        this.codeCompletionUseCase = container.get<ICodeCompletionUseCase>(TYPES.CodeCompletionUseCase);
        this.logger = container.get<ILogger>(TYPES.Logger);
    }

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        try {
            const linePrefix = document.lineAt(position).text.substring(0, position.character);
            if (!linePrefix.trim()) {
                return [];
            }

            const language = document.languageId;
            const fileName = document.fileName;
            const lineNumber = position.line + 1;

            // Get surrounding code for context
            const startLine = Math.max(0, position.line - 5);
            const endLine = Math.min(document.lineCount - 1, position.line + 5);
            const surroundingCode = document.getText(new vscode.Range(startLine, 0, endLine, 0));

            const suggestion = await this.codeCompletionUseCase.getCompletion(
                linePrefix,
                language,
                {
                    fileName,
                    lineNumber,
                    surroundingCode
                }
            );

            if (suggestion) {
                const completionItem = new vscode.CompletionItem(suggestion, vscode.CompletionItemKind.Snippet);
                completionItem.insertText = new vscode.SnippetString(suggestion);
                completionItem.detail = 'AI Completion';
                completionItem.documentation = 'Code completion provided by Comware Omni AI';
                return [completionItem];
            }

            return [];
        } catch (error) {
            this.logger.error('Error in completion provider', error as Error);
            return [];
        }
    }
}
