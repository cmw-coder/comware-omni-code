import * as vscode from 'vscode';
import { OpenAIClient } from '../services/OpenAIClient';

interface InlineChatSession {
    editor: vscode.TextEditor;
    decorations: vscode.TextEditorDecorationType[];
    originalSelection: vscode.Selection;
    originalText: string;
    chatPosition: vscode.Position;
    insertedLineRange?: vscode.Range;
}

export class InlineChatProvider implements vscode.Disposable {
    private _openAIClient: OpenAIClient;
    private _activeSessions = new Map<string, InlineChatSession>();
    private _chatDecorationType: vscode.TextEditorDecorationType;
    private _suggestedCodeDecorationType: vscode.TextEditorDecorationType;
    private _inlineInputDecorationType: vscode.TextEditorDecorationType;

    constructor(openAIClient: OpenAIClient) {
        this._openAIClient = openAIClient;
        
        // Create decoration type for inline input widget
        this._inlineInputDecorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            backgroundColor: new vscode.ThemeColor('input.background'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('input.border'),
            borderRadius: '4px',
        });

        // Create decoration types for inline chat
        this._chatDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('editor.inlineHintBackground'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('editor.inlineHintBorder'),
            borderRadius: '4px',
            after: {
                contentText: ' ✨ AI Chat Active',
                color: new vscode.ThemeColor('editor.inlineHintForeground'),
                fontWeight: 'bold',
                margin: '0 0 0 4px'
            }
        });

        this._suggestedCodeDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('diffEditor.insertedTextBackground'),
            border: '1px solid',
            borderColor: new vscode.ThemeColor('diffEditor.insertedTextBorder'),
            borderRadius: '3px',
            after: {
                contentText: ' ✨ AI Suggestion - Tab to accept, Esc to reject',
                color: new vscode.ThemeColor('editorSuggestWidget.foreground'),
                backgroundColor: new vscode.ThemeColor('editorSuggestWidget.background'),
                fontStyle: 'italic'
            }
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
        
        const session: InlineChatSession = {
            editor,
            decorations: [],
            originalSelection: editor.selection,
            originalText: editor.document.getText(editor.selection),
            chatPosition: position
        };

        this._activeSessions.set(sessionId, session);

        try {
            await this._showInlineInputWidget(sessionId, session);
        } catch (error) {
            this._cleanupSession(sessionId);
            vscode.window.showErrorMessage(`Inline chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _showInlineInputWidget(sessionId: string, session: InlineChatSession): Promise<void> {
        const { editor, chatPosition } = session;
        
        // Insert a new line for the inline chat widget
        const insertPosition = new vscode.Position(chatPosition.line + 1, 0);
        
        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.insert(insertPosition, '💬 Ask AI: \n');
        });

        // Update the inserted line range
        const insertedLineStart = new vscode.Position(chatPosition.line + 1, 0);
        const insertedLineEnd = new vscode.Position(chatPosition.line + 1, 11); // Length of "💬 Ask AI: "
        session.insertedLineRange = new vscode.Range(insertedLineStart, insertedLineEnd);

        // Move cursor to the end of the inserted text
        const newCursorPosition = new vscode.Position(chatPosition.line + 1, 11);
        editor.selection = new vscode.Selection(newCursorPosition, newCursorPosition);

        // Create decoration for the input line
        const decoration = {
            range: session.insertedLineRange,
            hoverMessage: 'Type your question here and press Enter'
        };
        editor.setDecorations(this._inlineInputDecorationType, [decoration]);

        // Wait for user input via keyboard
        await this._waitForUserInput(sessionId, session);
    }

    private async _waitForUserInput(sessionId: string, session: InlineChatSession): Promise<void> {
        const { editor } = session;
        
        return new Promise<void>((resolve) => {
            let disposable: vscode.Disposable;
            
            const handleKeyPress = async (e: vscode.TextDocumentChangeEvent) => {
                if (e.document !== editor.document) return;
                
                const change = e.contentChanges[0];
                if (!change) return;

                // Check if user pressed Enter on the input line
                if (change.text.includes('\n') && session.insertedLineRange) {
                    const inputLine = editor.document.lineAt(session.insertedLineRange.start.line);
                    const inputText = inputLine.text.replace('💬 Ask AI: ', '').trim();
                    
                    if (inputText.length > 0) {
                        disposable.dispose();
                        
                        // Clear the decoration
                        editor.setDecorations(this._inlineInputDecorationType, []);
                        
                        // Replace the input line with just the prompt text
                        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
                            if (session.insertedLineRange) {
                                const fullLineRange = new vscode.Range(
                                    session.insertedLineRange.start,
                                    new vscode.Position(session.insertedLineRange.start.line + 1, 0)
                                );
                                editBuilder.replace(fullLineRange, `💬 AI is thinking...\n`);
                            }
                        });

                        // Process the input
                        await this._processInlineChatInput(sessionId, session, inputText);
                        resolve();
                    }
                }
            };

            disposable = vscode.workspace.onDidChangeTextDocument(handleKeyPress);
            
            // Also listen for escape key to cancel
            const disposableCommand = vscode.commands.registerCommand('extension.cancelInlineChat', () => {
                disposable.dispose();
                disposableCommand.dispose();
                this._removeInsertedLine(session);
                this._cleanupSession(sessionId);
                resolve();
            });
        });
    }

    private async _processInlineChatInput(sessionId: string, session: InlineChatSession, input: string): Promise<void> {
        try {
            const response = await this._getAIResponse(session, input);
            
            if (response) {
                await this._handleInlineChatResponse(sessionId, session, input, response);
            }
        } catch (error) {
            await this._removeInsertedLine(session);
            this._cleanupSession(sessionId);
            vscode.window.showErrorMessage(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _getAIResponse(session: InlineChatSession, input: string): Promise<string | null> {
        const { editor, originalSelection } = session;
        const document = editor.document;
        
        // Build comprehensive context
        let context = `File: ${document.fileName}\n`;
        context += `Language: ${document.languageId}\n`;
        context += `Line: ${originalSelection.start.line + 1}\n\n`;
        
        if (!originalSelection.isEmpty) {
            context += `Selected code:\n\`\`\`${document.languageId}\n${session.originalText}\n\`\`\`\n\n`;
        }
        
        // Get surrounding context
        const contextLines = 10;
        const startLine = Math.max(0, originalSelection.start.line - contextLines);
        const endLine = Math.min(document.lineCount - 1, originalSelection.end.line + contextLines);
        const contextRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        const surroundingCode = document.getText(contextRange);
        
        context += `Surrounding code (lines ${startLine + 1}-${endLine + 1}):\n\`\`\`${document.languageId}\n${surroundingCode}\n\`\`\`\n\n`;
        
        const fullPrompt = `${context}User request: ${input}\n\nInstructions:
- If the user asks for code changes, provide ONLY the exact code that should replace the selection (or be inserted at cursor if no selection)
- If the user asks for explanations, provide a clear and concise explanation
- If the user asks for refactoring, provide the refactored code
- Keep responses focused and relevant to the request
- Do not include markdown code blocks unless specifically requested

Response:`;

        try {
            return await this._openAIClient.getChatCompletion(fullPrompt, []);
        } catch (error) {
            throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _handleInlineChatResponse(sessionId: string, session: InlineChatSession, originalInput: string, response: string): Promise<void> {
        const isCodeResponse = this._isCodeResponse(originalInput, response, session.originalText);
        
        if (isCodeResponse) {
            await this._showCodeSuggestion(sessionId, session, response);
        } else {
            await this._showTextResponse(sessionId, session, response);
        }
    }

    private _isCodeResponse(input: string, response: string, originalText: string): boolean {
        // Check if input suggests code modification
        const codeKeywords = ['edit', 'change', 'modify', 'refactor', 'fix', 'improve', 'optimize', 'rewrite', 'generate', 'create', 'add'];
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
            /;\s*$/m
        ];
        
        const looksLikeCode = codeIndicators.some(pattern => pattern.test(response));
        
        return (hasCodeKeyword && looksLikeCode) || (originalText.length > 0 && looksLikeCode);
    }

    private async _showCodeSuggestion(sessionId: string, session: InlineChatSession, suggestedCode: string): Promise<void> {
        const { editor } = session;
        
        // Clean the suggested code (remove markdown if present)
        let cleanCode = suggestedCode.trim();
        const codeBlockMatch = cleanCode.match(/```[\w]*\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
            cleanCode = codeBlockMatch[1].trim();
        }
        
        // Replace the "thinking" line with the suggestion
        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            if (session.insertedLineRange) {
                const fullLineRange = new vscode.Range(
                    session.insertedLineRange.start,
                    new vscode.Position(session.insertedLineRange.start.line + 1, 0)
                );
                editBuilder.replace(fullLineRange, `✨ AI Suggestion (Tab=accept, Esc=reject):\n${cleanCode}\n\n`);
            }
        });

        // Apply decoration to the suggested code
        const suggestionStartLine = session.insertedLineRange!.start.line + 1;
        const codeLines = cleanCode.split('\n').length;
        const suggestionRange = new vscode.Range(
            new vscode.Position(suggestionStartLine, 0),
            new vscode.Position(suggestionStartLine + codeLines - 1, cleanCode.split('\n')[codeLines - 1].length)
        );
        
        editor.setDecorations(this._suggestedCodeDecorationType, [{
            range: suggestionRange,
            hoverMessage: 'Press Tab to accept, Esc to reject'
        }]);

        // Wait for user action
        await this._waitForUserAction(sessionId, session, cleanCode, suggestionRange);
    }

    private async _waitForUserAction(sessionId: string, session: InlineChatSession, suggestedCode: string, suggestionRange: vscode.Range): Promise<void> {
        // Show quick pick for user action
        const action = await vscode.window.showQuickPick([
            { label: '$(check) Accept', action: 'accept' },
            { label: '$(x) Reject', action: 'reject' },
            { label: '$(eye) Preview in new file', action: 'preview' }
        ], {
            placeHolder: 'Choose action for AI suggestion',
            ignoreFocusOut: false
        });
        
        if (action) {
            switch (action.action) {
                case 'accept':
                    await this._applySuggestion(sessionId, session, suggestedCode);
                    break;
                case 'preview':
                    await this._previewSuggestion(suggestedCode, session.editor.document.languageId);
                    await this._removeInsertedLine(session);
                    this._cleanupSession(sessionId);
                    break;
                default:
                    await this._removeInsertedLine(session);
                    this._cleanupSession(sessionId);
                    break;
            }
        } else {
            await this._removeInsertedLine(session);
            this._cleanupSession(sessionId);
        }
    }

    private async _showTextResponse(sessionId: string, session: InlineChatSession, response: string): Promise<void> {
        const { editor } = session;
        
        // Replace the "thinking" line with the response
        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            if (session.insertedLineRange) {
                const fullLineRange = new vscode.Range(
                    session.insertedLineRange.start,
                    new vscode.Position(session.insertedLineRange.start.line + 1, 0)
                );
                editBuilder.replace(fullLineRange, `🤖 AI: ${response}\n\n`);
            }
        });

        // Auto-cleanup after a few seconds
        setTimeout(() => {
            this._removeInsertedLine(session);
            this._cleanupSession(sessionId);
        }, 5000);
    }

    private async _applySuggestion(sessionId: string, session: InlineChatSession, code: string): Promise<void> {
        const { editor, originalSelection } = session;
        
        // First remove the inserted lines
        await this._removeInsertedLine(session);
        
        // Then apply the code
        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            if (originalSelection.isEmpty) {
                editBuilder.insert(originalSelection.start, code);
            } else {
                editBuilder.replace(originalSelection, code);
            }
        });
        
        vscode.window.showInformationMessage('✅ AI suggestion applied!');
        this._cleanupSession(sessionId);
    }

    private async _previewSuggestion(content: string, language: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument({
            content,
            language
        });
        await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    }

    private async _removeInsertedLine(session: InlineChatSession): Promise<void> {
        const { editor, insertedLineRange } = session;
        
        if (!insertedLineRange) return;

        // Find the actual range to delete (may have grown due to multiple lines)
        const startLine = insertedLineRange.start.line;
        const document = editor.document;
        let endLine = startLine;
        
        // Find where our inserted content ends
        while (endLine < document.lineCount) {
            const line = document.lineAt(endLine);
            if (line.text.includes('💬') || line.text.includes('🤖') || line.text.includes('✨')) {
                endLine++;
            } else if (line.text.trim() === '') {
                endLine++;
                break;
            } else {
                break;
            }
        }

        await editor.edit((editBuilder: vscode.TextEditorEdit) => {
            const rangeToDelete = new vscode.Range(
                new vscode.Position(startLine, 0),
                new vscode.Position(endLine, 0)
            );
            editBuilder.delete(rangeToDelete);
        });
    }

    private _cleanupSession(sessionId: string): void {
        const session = this._activeSessions.get(sessionId);
        if (session) {
            // Clear any decorations
            session.editor.setDecorations(this._chatDecorationType, []);
            session.editor.setDecorations(this._suggestedCodeDecorationType, []);
            session.editor.setDecorations(this._inlineInputDecorationType, []);
            
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
        this._chatDecorationType.dispose();
        this._suggestedCodeDecorationType.dispose();
        this._inlineInputDecorationType.dispose();
    }
}