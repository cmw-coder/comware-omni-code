import * as vscode from 'vscode';
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
            localResourceRoots: [this._context.extensionUri]
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
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comware Omni Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-buttons {
            display: flex;
            gap: 8px;
        }
        
        .header-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .header-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .message {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .message-header {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .message-content {
            padding: 8px 12px;
            border-radius: 6px;
            line-height: 1.4;
            white-space: pre-wrap;
        }
        
        .message.user .message-content {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            margin-left: 20px;
        }
        
        .message.assistant .message-content {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            margin-right: 20px;
        }
        
        .input-container {
            border-top: 1px solid var(--vscode-panel-border);
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .mode-selector {
            display: flex;
            gap: 4px;
            margin-bottom: 8px;
        }
        
        .mode-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .mode-button.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        
        .input-field {
            flex: 1;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 8px;
            font-family: inherit;
            font-size: inherit;
            resize: vertical;
            min-height: 20px;
            max-height: 120px;
        }
        
        .send-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .send-button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .send-button:disabled {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: not-allowed;
        }
        
        .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 8px;
            border-radius: 3px;
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <span>💬 Comware Omni Chat</span>
        <div class="header-buttons">
            <button class="header-button" onclick="clearChat()">Clear</button>
            <button class="header-button" onclick="newSession()">New Session</button>
        </div>
    </div>
    
    <div class="chat-container" id="chatContainer">
        <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <p>Start a conversation with AI</p>
            <p style="font-size: 12px;">Ask questions, get code help, or chat about anything!</p>
        </div>
    </div>
    
    <div class="input-container">
        <div class="mode-selector">
            <button class="mode-button active" data-mode="chat" onclick="setMode('chat')">Chat</button>
            <button class="mode-button" data-mode="edit" onclick="setMode('edit')">Edit</button>
            <button class="mode-button" data-mode="agent" onclick="setMode('agent')">Agent</button>
        </div>
        
        <div class="input-row">
            <textarea class="input-field" id="messageInput" placeholder="Type your message..." rows="1"></textarea>
            <button class="send-button" id="sendButton" onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentMode = 'chat';

        function setMode(mode) {
            currentMode = mode;
            document.querySelectorAll('.mode-button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === mode);
            });
            
            const input = document.getElementById('messageInput');
            switch(mode) {
                case 'chat':
                    input.placeholder = 'Type your message...';
                    break;
                case 'edit':
                    input.placeholder = 'Describe what you want to edit...';
                    break;
                case 'agent':
                    input.placeholder = 'Describe the task for the AI agent...';
                    break;
            }
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            vscode.postMessage({
                type: 'sendMessage',
                message: message,
                mode: currentMode
            });
            
            input.value = '';
            adjustTextareaHeight(input);
        }

        function clearChat() {
            vscode.postMessage({ type: 'clearChat' });
        }

        function newSession() {
            vscode.postMessage({ type: 'newSession' });
        }

        function adjustTextareaHeight(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }

        // Auto-resize textarea
        document.getElementById('messageInput').addEventListener('input', function() {
            adjustTextareaHeight(this);
        });

        // Send on Enter (but not Shift+Enter)
        document.getElementById('messageInput').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'updateMessages':
                    updateMessages(message.messages);
                    break;
                case 'showError':
                    showError(message.message);
                    break;
            }
        });

        function updateMessages(messages) {
            const container = document.getElementById('chatContainer');
            
            if (messages.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <p>Start a conversation with AI</p>
                        <p style="font-size: 12px;">Ask questions, get code help, or chat about anything!</p>
                    </div>
                \`;
            } else {
                container.innerHTML = messages.map(msg => \`
                <div class="message \${msg.role}">
                    <div class="message-header">
                        <strong>\${msg.role === 'user' ? 'You' : 'AI'}</strong>
                        <span>\${new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-content">\${escapeHtml(msg.content)}</div>
                </div>
                \`).join('');
            }
            
            container.scrollTop = container.scrollHeight;
        }

        function showError(message) {
            const container = document.getElementById('chatContainer');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            container.appendChild(errorDiv);
            container.scrollTop = container.scrollHeight;
            
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
    }
}
