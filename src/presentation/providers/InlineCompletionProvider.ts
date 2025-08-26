import * as vscode from 'vscode';
import { container } from '../../core/container/Container';
import { TYPES } from '../../core/container/types';
import { ICodeCompletionUseCase } from '../../application/usecases/CodeCompletionUseCase';
import { ILogger } from '../../core/interfaces/ILogger';

export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private codeCompletionUseCase: ICodeCompletionUseCase;
    private logger: ILogger;

    constructor() {
        this.codeCompletionUseCase = container.get<ICodeCompletionUseCase>(TYPES.CodeCompletionUseCase);
        this.logger = container.get<ILogger>(TYPES.Logger);
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | undefined> {
        try {
            // 如果用户已经选择了补全建议，不提供内联补全
            if (context.selectedCompletionInfo) {
                return undefined;
            }

            const linePrefix = document.lineAt(position).text.substring(0, position.character);
            const lineSuffix = document.lineAt(position).text.substring(position.character);
            
            // 如果当前行为空或只有空白字符，不提供补全
            if (!linePrefix.trim()) {
                return undefined;
            }

            // 如果光标在行尾且行已经有内容，才提供补全
            if (lineSuffix.trim().length > 0) {
                return undefined;
            }

            const language = document.languageId;
            const fileName = document.fileName;
            const lineNumber = position.line + 1;

            // Get surrounding code for context
            const startLine = Math.max(0, position.line - 10);
            const endLine = Math.min(document.lineCount - 1, position.line + 10);
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

            if (suggestion && suggestion.trim()) {
                const inlineCompletionItem = new vscode.InlineCompletionItem(suggestion);
                inlineCompletionItem.range = new vscode.Range(position, position);
                return [inlineCompletionItem];
            }

            return undefined;
        } catch (error) {
            this.logger.error('Error in inline completion provider', error as Error);
            return undefined;
        }
    }
}
