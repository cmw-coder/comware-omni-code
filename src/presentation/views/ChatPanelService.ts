import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { container } from '../../core/container/Container';
import { TYPES } from '../../core/container/types';
import { IChatUseCase } from '../../application/usecases/ChatUseCase';
import { ILogger } from '../../core/interfaces/ILogger';
import { ChatMessage } from '../../domain/entities/ChatMessage';

export class ChatPanelService implements vscode.WebviewViewProvider {
    public static readonly viewId = 'comwareOmniChat';
    
    private _view?: vscode.WebviewView;
    private _messages: ChatMessage[] = [];
    private _currentSessionId?: string;
    
    private chatUseCase: IChatUseCase;
    private logger: ILogger;

    constructor(private readonly _context: vscode.ExtensionContext) {
        this.chatUseCase = container.get<IChatUseCase>(TYPES.ChatUseCase);
        this.logger = container.get<ILogger>(TYPES.Logger);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._context.extensionUri,
                vscode.Uri.joinPath(this._context.extensionUri, 'src', 'presentation', 'views')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            await this.handleMessage(data);
        });

        // Load chat history
        this.loadChatHistory();
    }

    private async handleMessage(data: any): Promise<void> {
        try {
            switch (data.type) {
                case 'sendMessage':
                    await this.handleSendMessage(data.message, data.mode);
                    break;
                case 'clearChat':
                    await this.handleClearChat();
                    break;
                case 'newSession':
                    await this.handleNewSession();
                    break;
            }
        } catch (error) {
            this.logger.error('Error handling webview message', error as Error, data);
            this.showError('An error occurred while processing your request');
        }
    }

    private async handleSendMessage(message: string, mode: string): Promise<void> {
        if (!message.trim()) {
            return;
        }

        this.logger.info('Handling send message', { message: message.substring(0, 50) + '...', mode });

        try {
            // Ensure we have a session
            if (!this._currentSessionId) {
                this._currentSessionId = await this.chatUseCase.createNewSession();
            }

            // Send message and get response
            const responseMessage = await this.chatUseCase.sendMessage(message, this._currentSessionId);
            
            // Reload chat history
            await this.loadChatHistory();
        } catch (error) {
            this.logger.error('Failed to send message', error as Error);
            this.showError('Failed to send message. Please try again.');
        }
    }

    private async handleClearChat(): Promise<void> {
        try {
            await this.chatUseCase.clearChatHistory(this._currentSessionId);
            this._messages = [];
            this.updateWebview();
            this.logger.info('Chat history cleared');
        } catch (error) {
            this.logger.error('Failed to clear chat', error as Error);
            this.showError('Failed to clear chat history');
        }
    }

    private async handleNewSession(): Promise<void> {
        try {
            this._currentSessionId = await this.chatUseCase.createNewSession();
            this._messages = [];
            this.updateWebview();
            this.logger.info('New chat session created', { sessionId: this._currentSessionId });
        } catch (error) {
            this.logger.error('Failed to create new session', error as Error);
            this.showError('Failed to create new session');
        }
    }

    private async loadChatHistory(): Promise<void> {
        try {
            this._messages = await this.chatUseCase.getChatHistory(this._currentSessionId);
            this.updateWebview();
        } catch (error) {
            this.logger.error('Failed to load chat history', error as Error);
        }
    }

    private updateWebview(): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateMessages',
                messages: this._messages.map(msg => ({
                    id: msg.id,
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp
                }))
            });
        }
    }

    private showError(message: string): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'showError',
                message
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // 使用扩展的安装路径，这在打包后也能正确工作
        const viewsPath = path.join(this._context.extensionPath, 'src', 'presentation', 'views');
        const htmlPath = path.join(viewsPath, 'ChatPanelView.html');
        const scriptPath = path.join(viewsPath, 'chatPanel.js');
        const cssPath = path.join(viewsPath, 'chatPanel.css');
        
        try {
            // 读取 HTML 模板
            let html = fs.readFileSync(htmlPath, 'utf8');
            
            // 获取资源的 webview URI
            const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptPath));
            const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
            
            // 替换占位符
            html = html.replace('{{scriptUri}}', scriptUri.toString());
            html = html.replace('{{cssUri}}', cssUri.toString());
            
            return html;
        } catch (error) {
            this.logger.error('Failed to load webview template files', error as Error);
            // 如果无法加载外部文件，提供一个基本的回退 HTML
            return this._getFallbackHtml();
        }
    }

    private _getFallbackHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comware Omni Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <h2>Chat Panel Loading Error</h2>
    <p>Failed to load chat panel resources. Please check the extension installation.</p>
</body>
</html>`;
    }
}
