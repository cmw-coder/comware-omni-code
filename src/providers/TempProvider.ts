import * as vscode from 'vscode';
import { OpenAIClient } from '../services/OpenAIClient';

interface TempSession {
    editor: vscode.TextEditor;
    originalSelection: vscode.Selection;
    originalText: string;
    chatPosition: vscode.Position;
    inputBoxDecoration?: vscode.TextEditorDecorationType;
    isActive: boolean;
}

export class TempProvider implements vscode.Disposable {
    private _activeSessions = new Map<string, TempSession>();
    private _inputBoxDecorationType: vscode.TextEditorDecorationType;
    private _suggestedCodeDecorationType: vscode.TextEditorDecorationType;

    constructor() {
        // Create decoration type for inline input box indicator
        this._inputBoxDecorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '💬 Click here to chat with AI',
                color: new vscode.ThemeColor('textLink.foreground'),
                backgroundColor: new vscode.ThemeColor('input.background'),
                border: '2px solid',
                borderColor: new vscode.ThemeColor('input.border'),
                margin: '0 4px',
                fontWeight: 'normal',
                textDecoration: 'none'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });

        this._suggestedCodeDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('diffEditor.insertedTextBackground'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('diffEditor.insertedTextBorder'),
            borderRadius: '3px',
            isWholeLine: true
        });
    }

    public async startInlineChat(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const sessionId = `${editor.document.uri.toString()}-${Date.now()}`;
        const position = editor.selection.active;

        const session: TempSession = {
            editor,
            originalSelection: editor.selection,
            originalText: editor.document.getText(editor.selection),
            chatPosition: position,
            isActive: true
        };

        this._activeSessions.set(sessionId, session);

        try {
            await this._showInlineInputBox(sessionId, session);
        } catch (error) {
            this._cleanupSession(sessionId);
            vscode.window.showErrorMessage(`Inline chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _showInlineInputBox(sessionId: string, session: TempSession): Promise<void> {
        const { editor, chatPosition } = session;

        // Create a decoration that looks like an input box indicator
        // const decoration = {
        //     range: new vscode.Range(chatPosition, chatPosition),
        //     hoverMessage: new vscode.MarkdownString(`**💬 Inline AI Chat**\n\nClick to start chatting with AI at this position\n\n*Or the input dialog will appear automatically*`)
        // };

        // editor.setDecorations(this._inputBoxDecorationType, [decoration]);

        // Small delay to show the decoration
        await new Promise(resolve => setTimeout(resolve, 100));

        // Show input box dialog
        const queryInput = await vscode.window.showInputBox({
            prompt: 'Test script generation - Please input your query',
            title: 'Comware Omni Inline Chat',
            ignoreFocusOut: true
        });

        // Clear the decoration
        // editor.setDecorations(this._inputBoxDecorationType, []);

        if (!queryInput || queryInput.trim() === '') {
            this._cleanupSession(sessionId);
            return;
        }

        await this._processInlineChatInput(sessionId, session, queryInput.trim());
    }

    private async _processInlineChatInput(sessionId: string, session: TempSession, input: string): Promise<void> {
        try {
            // Show thinking indicator
            await this._showThinkingIndicator(session);

            const response = await this._getAIResponse(session, input);

            if (response) {
                await this._handleInlineChatResponse(sessionId, session, input, response);
            }
        } catch (error) {
            this._cleanupSession(sessionId);
            vscode.window.showErrorMessage(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _showThinkingIndicator(session: TempSession): Promise<void> {
        const { editor, chatPosition } = session;

        const thinkingDecoration = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: '🤖 AI is thinking...',
                color: new vscode.ThemeColor('descriptionForeground'),
                backgroundColor: new vscode.ThemeColor('editor.inlineHintBackground'),
                border: '1px solid',
                borderColor: new vscode.ThemeColor('editor.inlineHintBorder'),
                margin: '0 4px',
                fontStyle: 'italic'
            }
        });

        const decoration = {
            range: new vscode.Range(chatPosition, chatPosition)
        };

        editor.setDecorations(thinkingDecoration, [decoration]);

        // Store for cleanup
        session.inputBoxDecoration = thinkingDecoration;
    }

    private async _getAIResponse(session: TempSession, input: string): Promise<string | null> {
        const { editor } = session;
        const document = editor.document;

        // Build comprehensive context
        const documentContent = document.getText();

        try {
            const response = await fetch('http://10.114.138.73:9070/sendpy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: input,
                    beforeScript: documentContent
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json() as { content: string; message: string };

            return data.content;
        } catch (error) {
            throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _handleInlineChatResponse(sessionId: string, session: TempSession, originalInput: string, response: string): Promise<void> {
        // Clear thinking indicator
        if (session.inputBoxDecoration) {
            session.editor.setDecorations(session.inputBoxDecoration, []);
        }

        // const isCodeResponse = this._isCodeResponse(originalInput, response, session.originalText);

        // if (isCodeResponse) {
        //     await this._showCodeSuggestion(sessionId, session, response);
        // } else {
        //     await this._showTextResponse(sessionId, session, response);
        // }
        await this._showCodeSuggestion(sessionId, session, response);
    }

    private _isCodeResponse(input: string, response: string, originalText: string): boolean {
        // Check if input suggests code modification
        const codeKeywords = ['edit', 'change', 'modify', 'refactor', 'fix', 'improve', 'optimize', 'rewrite', 'generate', 'create', 'add', 'update', 'implement'];
        const hasCodeKeyword = codeKeywords.some(keyword => input.toLowerCase().includes(keyword));

        // Check if response looks like code
        const codeIndicators = [
            /function\s+\w+/,
            /class\s+\w+/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /import\s+.*from/,
            /export\s+(default\s+)?/,
            /=>\s*{/,
            /{\s*$/m,
            /;\s*$/m,
            /if\s*\(/,
            /for\s*\(/,
            /while\s*\(/
        ];

        const looksLikeCode = codeIndicators.some(pattern => pattern.test(response));

        return (hasCodeKeyword && looksLikeCode) || (originalText.length > 0 && looksLikeCode);
    }

    private async _showCodeSuggestion(sessionId: string, session: TempSession, suggestedCode: string): Promise<void> {
        const { editor, chatPosition } = session;

        // Clean the suggested code (remove markdown if present)
        let cleanCode = suggestedCode.trim();
        const codeBlockMatch = cleanCode.match(/```[\w]*\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
            cleanCode = codeBlockMatch[1].trim();
        }

        // Show suggestion with hover preview
        const suggestionDecoration = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: `✨ AI Suggestion Available`,
                color: new vscode.ThemeColor('textLink.foreground'),
                backgroundColor: new vscode.ThemeColor('diffEditor.insertedTextBackground'),
                border: '2px solid',
                borderColor: new vscode.ThemeColor('diffEditor.insertedTextBorder'),
                margin: '0 4px',
                fontWeight: 'bold'
            }
        });

        const decoration = {
            range: new vscode.Range(chatPosition, chatPosition),
            hoverMessage: new vscode.MarkdownString(`**✨ AI Code Suggestion:**\n\n\`\`\`${editor.document.languageId}\n${cleanCode}\n\`\`\`\n\n*Choose an action below*`)
        };

        editor.setDecorations(suggestionDecoration, [decoration]);

        // Show action options
        const action = await vscode.window.showQuickPick([
            {
                label: '$(check) Accept Suggestion',
                description: 'Apply the AI suggestion to your code',
                action: 'accept'
            },
            {
                label: '$(x) Reject Suggestion',
                description: 'Discard the suggestion',
                action: 'reject'
            },
            {
                label: '$(eye) Preview in New File',
                description: 'Open the suggestion in a new editor tab',
                action: 'preview'
            },
            {
                label: '$(copy) Copy to Clipboard',
                description: 'Copy the suggestion to clipboard',
                action: 'copy'
            }
        ], {
            placeHolder: 'What would you like to do with the AI suggestion?',
            ignoreFocusOut: false
        });

        // Clear the suggestion decoration
        editor.setDecorations(suggestionDecoration, []);

        if (action) {
            switch (action.action) {
                case 'accept':
                    await this._applySuggestion(sessionId, session, cleanCode);
                    break;
                case 'preview':
                    await this._previewSuggestion(cleanCode, editor.document.languageId);
                    this._cleanupSession(sessionId);
                    break;
                case 'copy':
                    await vscode.env.clipboard.writeText(cleanCode);
                    vscode.window.showInformationMessage('✅ Code copied to clipboard!');
                    this._cleanupSession(sessionId);
                    break;
                default:
                    this._cleanupSession(sessionId);
                    break;
            }
        } else {
            this._cleanupSession(sessionId);
        }
    }

    private async _showTextResponse(sessionId: string, session: TempSession, response: string): Promise<void> {
        const { editor, chatPosition } = session;

        // Show text response with hover
        const responseDecoration = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: `🤖 AI Response Available`,
                color: new vscode.ThemeColor('textLink.foreground'),
                backgroundColor: new vscode.ThemeColor('editor.inlineHintBackground'),
                border: '2px solid',
                borderColor: new vscode.ThemeColor('editor.inlineHintBorder'),
                margin: '0 4px',
                fontWeight: 'bold'
            }
        });

        const decoration = {
            range: new vscode.Range(chatPosition, chatPosition),
            hoverMessage: new vscode.MarkdownString(`**🤖 AI Response:**\n\n${response}`)
        };

        editor.setDecorations(responseDecoration, [decoration]);

        // Show response in info message with option to see full response
        if (response.length <= 100) {
            const action = await vscode.window.showInformationMessage(
                `🤖 ${response}`,
                'Copy to Clipboard',
                'Show in New File'
            );

            if (action === 'Copy to Clipboard') {
                await vscode.env.clipboard.writeText(response);
                vscode.window.showInformationMessage('✅ Response copied to clipboard!');
            } else if (action === 'Show in New File') {
                await this._previewSuggestion(response, 'markdown');
            }
        } else {
            const action = await vscode.window.showInformationMessage(
                '🤖 AI has provided a detailed response',
                'Show in New File',
                'Copy to Clipboard'
            );

            if (action === 'Show in New File') {
                await this._previewSuggestion(response, 'markdown');
            } else if (action === 'Copy to Clipboard') {
                await vscode.env.clipboard.writeText(response);
                vscode.window.showInformationMessage('✅ Response copied to clipboard!');
            }
        }

        // Clean up decoration after a delay
        setTimeout(() => {
            editor.setDecorations(responseDecoration, []);
            this._cleanupSession(sessionId);
        }, 5000);
    }

    private async _applySuggestion(sessionId: string, session: TempSession, code: string): Promise<void> {
        const { editor, originalSelection } = session;

        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            if (originalSelection.isEmpty) {
                editBuilder.insert(originalSelection.start, code);
            } else {
                editBuilder.replace(originalSelection, code);
            }
        });

        vscode.window.showInformationMessage('✅ AI suggestion applied successfully!');
        this._cleanupSession(sessionId);
    }

    private async _previewSuggestion(content: string, language: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument({
            content,
            language
        });
        await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    }

    private _cleanupSession(sessionId: string): void {
        const session = this._activeSessions.get(sessionId);
        if (session) {
            // Clear any decorations
            if (session.inputBoxDecoration) {
                session.editor.setDecorations(session.inputBoxDecoration, []);
            }
            session.editor.setDecorations(this._inputBoxDecorationType, []);
            session.editor.setDecorations(this._suggestedCodeDecorationType, []);

            // Remove session
            this._activeSessions.delete(sessionId);
        }
    }

    public dispose(): void {
        // Cleanup all active sessions
        for (const sessionId of this._activeSessions.keys()) {
            this._cleanupSession(sessionId);
        }

        // Dispose decoration types
        this._inputBoxDecorationType.dispose();
        this._suggestedCodeDecorationType.dispose();
    }
}