import * as vscode from 'vscode';
import { OpenAIClient } from '../services/OpenAIClient';

export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private openAIClient: OpenAIClient;

    constructor() {
        this.openAIClient = new OpenAIClient();
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | undefined> {
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

        // 获取更多上下文
        const contextLines = this.getContext(document, position);
        const fullContext = contextLines + linePrefix;

        try {
            const suggestion = await this.openAIClient.getCompletion(fullContext);
            if (suggestion && suggestion.trim()) {
                // 清理建议文本 - 移除前缀重复部分
                const cleanSuggestion = this.cleanSuggestion(suggestion, linePrefix);
                
                if (cleanSuggestion && cleanSuggestion.trim()) {
                    // 创建内联补全项
                    const inlineCompletionItem = new vscode.InlineCompletionItem(
                        cleanSuggestion,
                        new vscode.Range(position, position)
                    );

                    return [inlineCompletionItem];
                }
            }
        } catch (error) {
            console.error('Error fetching inline completion:', error);
            // 静默处理错误，避免打断用户
        }

        return undefined;
    }

    /**
     * 获取当前位置的上下文（前几行代码）
     */
    private getContext(document: vscode.TextDocument, position: vscode.Position): string {
        const startLine = Math.max(0, position.line - 5); // 获取前5行作为上下文
        const contextLines: string[] = [];

        for (let i = startLine; i < position.line; i++) {
            contextLines.push(document.lineAt(i).text);
        }

        return contextLines.join('\n') + (contextLines.length > 0 ? '\n' : '');
    }

    /**
     * 清理建议文本，移除与当前行前缀重复的部分
     */
    private cleanSuggestion(suggestion: string, linePrefix: string): string {
        // 移除建议开头与行前缀重复的部分
        let cleaned = suggestion;
        
        // 如果建议以行前缀开始，移除这部分
        if (cleaned.startsWith(linePrefix)) {
            cleaned = cleaned.substring(linePrefix.length);
        }

        // 移除开头的空白字符（但保留必要的缩进）
        cleaned = cleaned.trimStart();

        // 只取第一行作为内联补全（避免多行建议）
        const firstLine = cleaned.split('\n')[0];
        
        return firstLine;
    }
}
