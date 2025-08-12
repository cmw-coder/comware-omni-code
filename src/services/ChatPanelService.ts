import * as vscode from 'vscode';
import { OpenAIClient } from './OpenAIClient';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export class ChatPanelService implements vscode.WebviewViewProvider {
    public static readonly viewId = 'comwareOmniChat';
    private _view?: vscode.WebviewView;
    private _messages: ChatMessage[] = [];
    private _openAIClient: OpenAIClient;

    constructor(
        private readonly _context: vscode.ExtensionContext,
        openAIClient: OpenAIClient
    ) {
        this._openAIClient = openAIClient;
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

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'sendMessage':
                    await this._handleChatMessage(data.message);
                    break;
                case 'clearChat':
                    this._clearChat();
                    break;
                case 'editCode':
                    await this._handleEditCode(data.instruction);
                    break;
                case 'runAgent':
                    await this._handleRunAgent(data.task);
                    break;
            }
        });
    }

    private async _handleChatMessage(message: string) {
        if (!message.trim()) {
            return;
        }

        // Add user message
        const userMessage: ChatMessage = {
            id: this._generateId(),
            role: 'user',
            content: message,
            timestamp: new Date()
        };
        this._messages.push(userMessage);
        this._updateWebview();

        try {
            // Get AI response
            const response = await this._openAIClient.getChatCompletion(message, this._messages);
            
            const assistantMessage: ChatMessage = {
                id: this._generateId(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };
            this._messages.push(assistantMessage);
            this._updateWebview();
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: this._generateId(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
                timestamp: new Date()
            };
            this._messages.push(errorMessage);
            this._updateWebview();
        }
    }

    private async _handleEditCode(instruction: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showErrorMessage('Please select some code to edit');
            return;
        }

        try {
            const prompt = `Edit the following code according to this instruction: "${instruction}"\n\nCode:\n${selectedText}`;
            const editedCode = await this._openAIClient.getChatCompletion(prompt, []);
            
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, editedCode);
            });

            const message: ChatMessage = {
                id: this._generateId(),
                role: 'assistant',
                content: `Code edited successfully with instruction: "${instruction}"`,
                timestamp: new Date()
            };
            this._messages.push(message);
            this._updateWebview();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to edit code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async _handleRunAgent(task: string) {
        try {
            const prompt = `Act as a coding agent and help with this task: ${task}. Provide a detailed plan and any code suggestions.`;
            const response = await this._openAIClient.getChatCompletion(prompt, []);
            
            const message: ChatMessage = {
                id: this._generateId(),
                role: 'assistant',
                content: `🤖 Agent Task: ${task}\n\n${response}`,
                timestamp: new Date()
            };
            this._messages.push(message);
            this._updateWebview();
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: this._generateId(),
                role: 'assistant',
                content: `Agent task failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            this._messages.push(errorMessage);
            this._updateWebview();
        }
    }

    private _clearChat() {
        this._messages = [];
        this._updateWebview();
    }

    private _updateWebview() {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'updateMessages',
                messages: this._messages
            });
        }
    }

    private _generateId(): string {
        return Math.random().toString(36).substr(2, 9);
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
            padding: 8px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 8px;
        }

        .header h3 {
            margin: 0;
            flex-grow: 1;
            font-size: 14px;
            font-weight: 600;
        }

        .header-buttons {
            display: flex;
            gap: 4px;
        }

        .header-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
        }

        .header-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .chat-container {
            flex-grow: 1;
            overflow-y: auto;
            margin-bottom: 8px;
        }

        .message {
            margin-bottom: 12px;
            padding: 8px;
            border-radius: 6px;
            word-wrap: break-word;
        }

        .message.user {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            margin-left: 20px;
        }

        .message.assistant {
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            margin-right: 20px;
        }

        .message-header {
            font-size: 11px;
            opacity: 0.8;
            margin-bottom: 4px;
        }

        .message-content {
            white-space: pre-wrap;
            line-height: 1.4;
        }

        .input-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 8px;
        }

        .mode-selector {
            display: flex;
            gap: 4px;
        }

        .mode-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 12px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
            transition: all 0.2s;
        }

        .mode-button.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .mode-button:hover {
            background: var(--vscode-button-hoverBackground);
            color: var(--vscode-button-foreground);
        }

        .input-row {
            display: flex;
            gap: 4px;
        }

        .input-field {
            flex-grow: 1;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 6px 8px;
            border-radius: 2px;
            font-family: inherit;
            font-size: inherit;
            resize: none;
            min-height: 20px;
            max-height: 100px;
        }

        .input-field:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        .send-button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
        }

        .send-button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            margin-top: 40px;
        }

        .empty-state-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h3>🤖 Comware Omni</h3>
        <div class="header-buttons">
            <button class="header-button" onclick="clearChat()">Clear</button>
        </div>
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <div>Start a conversation with AI</div>
            <div style="font-size: 11px; margin-top: 4px;">Ask questions, edit code, or run agent tasks</div>
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

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateMessages':
                    updateChatDisplay(message.messages);
                    break;
            }
        });

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
                    input.placeholder = 'Describe how to edit the selected code...';
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

            const command = currentMode === 'chat' ? 'sendMessage' : 
                          currentMode === 'edit' ? 'editCode' : 'runAgent';
            
            const data = currentMode === 'chat' ? { command, message } :
                        currentMode === 'edit' ? { command, instruction: message } :
                        { command, task: message };

            vscode.postMessage(data);
            input.value = '';
            adjustTextareaHeight(input);
        }

        function clearChat() {
            vscode.postMessage({ command: 'clearChat' });
        }

        function updateChatDisplay(messages) {
            const container = document.getElementById('chatContainer');
            
            if (messages.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">💬</div>
                        <div>Start a conversation with AI</div>
                        <div style="font-size: 11px; margin-top: 4px;">Ask questions, edit code, or run agent tasks</div>
                    </div>
                \`;
                return;
            }

            container.innerHTML = messages.map(msg => \`
                <div class="message \${msg.role}">
                    <div class="message-header">
                        \${msg.role === 'user' ? '👤 You' : '🤖 Assistant'} • \${formatTime(msg.timestamp)}
                    </div>
                    <div class="message-content">\${escapeHtml(msg.content)}</div>
                </div>
            \`).join('');
            
            container.scrollTop = container.scrollHeight;
        }

        function formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function adjustTextareaHeight(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
        }

        // Setup event listeners
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        document.getElementById('messageInput').addEventListener('input', (e) => {
            adjustTextareaHeight(e.target);
        });
    </script>
</body>
</html>`;
    }
}
