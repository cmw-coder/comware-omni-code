import * as vscode from 'vscode';
import { container } from '../../core/container/Container';
import { TYPES } from '../../core/container/types';
import { IInlineChatUseCase } from '../../application/usecases/InlineChatUseCase';
import { ILogger } from '../../core/interfaces/ILogger';

interface InlineChatSession {
    editor: vscode.TextEditor;
    originalSelection: vscode.Selection;
    originalText: string;
    chatPosition: vscode.Position;
    inputBoxDecoration?: vscode.TextEditorDecorationType;
    isActive: boolean;
}

export class InlineChatProvider implements vscode.Disposable {
    private inlineChatUseCase: IInlineChatUseCase;
    private logger: ILogger;
    private _activeSessions = new Map<string, InlineChatSession>();
    private _inputBoxDecorationType: vscode.TextEditorDecorationType;
    private _suggestedCodeDecorationType: vscode.TextEditorDecorationType;

    constructor() {
        this.inlineChatUseCase = container.get<IInlineChatUseCase>(TYPES.InlineChatUseCase);
        this.logger = container.get<ILogger>(TYPES.Logger);
        
        // Create decoration types
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

        try {
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText.trim()) {
                vscode.window.showErrorMessage('Please select some text to chat about');
                return;
            }

            this.logger.info('Starting inline chat session');

            // Show input box for instruction
            const instruction = await vscode.window.showInputBox({
                prompt: 'What would you like me to do with the selected code?',
                placeHolder: 'e.g., Add error handling, Optimize performance, Add comments...'
            });

            if (!instruction) {
                return;
            }

            // Get context
            const fileName = editor.document.fileName;
            const language = editor.document.languageId;
            const surroundingCode = this.getSurroundingCode(editor, selection);

            // Process the inline chat request
            const suggestion = await this.inlineChatUseCase.processInlineChat(
                selectedText,
                instruction,
                {
                    fileName,
                    language,
                    surroundingCode
                }
            );

            if (suggestion) {
                await this.showSuggestion(editor, selection, suggestion);
            } else {
                vscode.window.showErrorMessage('Failed to generate suggestion');
            }
        } catch (error) {
            this.logger.error('Error in inline chat', error as Error);
            vscode.window.showErrorMessage(`Inline chat error: ${(error as Error).message}`);
        }
    }

    private getSurroundingCode(editor: vscode.TextEditor, selection: vscode.Selection): string {
        const document = editor.document;
        const startLine = Math.max(0, selection.start.line - 10);
        const endLine = Math.min(document.lineCount - 1, selection.end.line + 10);
        return document.getText(new vscode.Range(startLine, 0, endLine, 0));
    }

    private async showSuggestion(
        editor: vscode.TextEditor,
        originalSelection: vscode.Selection,
        suggestion: string
    ): Promise<void> {
        // Show quick pick with options
        const action = await vscode.window.showQuickPick([
            { label: 'Accept', description: 'Replace selected text with suggestion' },
            { label: 'Preview', description: 'Show suggestion in diff view' },
            { label: 'Reject', description: 'Dismiss suggestion' }
        ], {
            placeHolder: 'What would you like to do with the AI suggestion?'
        });

        if (!action) {
            return;
        }

        switch (action.label) {
            case 'Accept':
                await this.applySuggestion(editor, originalSelection, suggestion);
                break;
            case 'Preview':
                await this.showDiffPreview(editor, originalSelection, suggestion);
                break;
            case 'Reject':
                // Do nothing
                break;
        }
    }

    private async applySuggestion(
        editor: vscode.TextEditor,
        selection: vscode.Selection,
        suggestion: string
    ): Promise<void> {
        await editor.edit(editBuilder => {
            editBuilder.replace(selection, suggestion);
        });
        
        vscode.window.showInformationMessage('AI suggestion applied successfully!');
    }

    private async showDiffPreview(
        editor: vscode.TextEditor,
        selection: vscode.Selection,
        suggestion: string
    ): Promise<void> {
        const originalText = editor.document.getText(selection);
        
        // Create temporary documents for diff view
        const originalUri = vscode.Uri.parse(`untitled:Original`);
        const suggestedUri = vscode.Uri.parse(`untitled:AI Suggestion`);
        
        try {
            const originalDoc = await vscode.workspace.openTextDocument(originalUri);
            const suggestedDoc = await vscode.workspace.openTextDocument(suggestedUri);
            
            await vscode.window.showTextDocument(originalDoc);
            await vscode.window.activeTextEditor?.edit(edit => {
                edit.insert(new vscode.Position(0, 0), originalText);
            });
            
            await vscode.window.showTextDocument(suggestedDoc);
            await vscode.window.activeTextEditor?.edit(edit => {
                edit.insert(new vscode.Position(0, 0), suggestion);
            });
            
            // Show diff
            await vscode.commands.executeCommand('vscode.diff', originalUri, suggestedUri, 'AI Suggestion Diff');
        } catch (error) {
            this.logger.error('Error showing diff preview', error as Error);
            vscode.window.showErrorMessage('Failed to show diff preview');
        }
    }

    public dispose(): void {
        this._inputBoxDecorationType.dispose();
        this._suggestedCodeDecorationType.dispose();
        this._activeSessions.clear();
    }
}
