import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { container } from '../../core/container/Container';
import { TYPES } from '../../core/container/types';
import { IChatUseCase } from '../../application/usecases/ChatUseCase';
import { ILogger } from '../../core/interfaces/ILogger';
import { ChatMessage, ChatMessageEntity } from '../../domain/entities/ChatMessage';
import { TestScriptRequest } from '../../core/interfaces/IAIClient';

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
                case 'openFile':
                    await this.handleOpenFile(data.fileName);
                    break;
                case 'insertCode':
                    await this.handleInsertCode(data.code);
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

            // 立即创建并显示用户消息
            await this.chatUseCase.addUserMessage(message, this._currentSessionId);
            await this.loadChatHistory();

            let responseMessage: ChatMessage;

            if (mode === 'testScript') {
                // Handle testScript mode
                const testScriptRequest = await this.prepareTestScriptRequest(message);
                responseMessage = await this.chatUseCase.sendTestScriptMessageWithoutUserMessage(testScriptRequest, this._currentSessionId);
            } else {
                // Handle regular chat mode
                responseMessage = await this.chatUseCase.sendMessageWithoutUserMessage(this._currentSessionId, mode);
            }
            
            // Reload chat history to show AI response
            await this.loadChatHistory();
        } catch (error) {
            this.logger.error('Failed to send message', error as Error);
            this.showError('Failed to send message. Please try again.');
        }
    }

    private async prepareTestScriptRequest(query: string): Promise<TestScriptRequest> {
        try {
            // 发送开始准备的状态消息
            await this.addProgressMessage('正在准备测试脚本生成请求...', 'info');

            // 获取当前活动编辑器
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                await this.addProgressMessage('❌ 未找到活动编辑器', 'error');
                throw new Error('No active editor found');
            }

            const currentDocument = activeEditor.document;
            const currentFilePath = currentDocument.fileName;
            const currentFileName = path.basename(currentFilePath);
            const currentFileDir = path.dirname(currentFilePath);

            // 获取光标位置上文
            await this.addProgressMessage('正在读取光标上文...', 'info');
            const cursorPosition = activeEditor.selection.active;
            const beforeScript = currentDocument.getText(new vscode.Range(new vscode.Position(0, 0), cursorPosition));
            const lineCount = cursorPosition.line + 1;
            await this.addProgressMessage(`✅ 已读取 ${currentFileName} 前 ${lineCount} 行代码`, 'success', currentFileName);

            // 读取conftest.py文件
            await this.addProgressMessage('正在查找 conftest.py...', 'info');
            const conftestPath = path.join(currentFileDir, 'conftest.py');
            let conftestContent = '';
            try {
                if (fs.existsSync(conftestPath)) {
                    conftestContent = fs.readFileSync(conftestPath, 'utf8');
                    const lines = conftestContent.split('\n').length;
                    await this.addProgressMessage(`✅ 已读取 conftest.py (${lines} 行)`, 'success', 'conftest.py');
                    this.logger.info('Found conftest.py file', { path: conftestPath });
                } else {
                    await this.addProgressMessage('⚠️ 未找到 conftest.py', 'warning');
                    this.logger.info('No conftest.py file found', { searchPath: conftestPath });
                }
            } catch (error) {
                await this.addProgressMessage('❌ 读取 conftest.py 失败', 'error');
                this.logger.error('Error reading conftest.py', error as Error);
            }

            // 读取所有.topox文件
            await this.addProgressMessage('正在查找 .topox 文件...', 'info');
            let topoxContent = '';
            try {
                const files = fs.readdirSync(currentFileDir);
                const topoxFiles = files.filter((file: string) => file.endsWith('.topox'));
                
                if (topoxFiles.length > 0) {
                    const topoxContents: string[] = [];
                    for (const topoxFile of topoxFiles) {
                        const topoxPath = path.join(currentFileDir, topoxFile);
                        const content = fs.readFileSync(topoxPath, 'utf8');
                        topoxContents.push(`// File: ${topoxFile}\n${content}`);
                        const lines = content.split('\n').length;
                        await this.addProgressMessage(`✅ 已读取 ${topoxFile} (${lines} 行)`, 'success', topoxFile);
                    }
                    topoxContent = topoxContents.join('\n\n');
                    this.logger.info('Found .topox files', { count: topoxFiles.length, files: topoxFiles });
                } else {
                    await this.addProgressMessage('⚠️ 未找到 .topox 文件', 'warning');
                    this.logger.info('No .topox files found', { searchDir: currentFileDir });
                }
            } catch (error) {
                await this.addProgressMessage('❌ 读取 .topox 文件失败', 'error');
                this.logger.error('Error reading .topox files', error as Error);
            }

            await this.addProgressMessage('✅ 文件读取完成，正在生成测试脚本...', 'success');

            return {
                query,
                conftest: conftestContent,
                topox: topoxContent,
                beforeScript
            };
        } catch (error) {
            await this.addProgressMessage('❌ 准备测试脚本请求失败', 'error');
            this.logger.error('Failed to prepare test script request', error as Error);
            throw new Error('Failed to prepare test script context. Please ensure you have an active editor.');
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

    private async handleOpenFile(fileName: string): Promise<void> {
        try {
            // 获取当前活动编辑器所在的目录
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                this.showError('No active editor found');
                return;
            }

            const currentFileDir = path.dirname(activeEditor.document.fileName);
            const filePath = path.join(currentFileDir, fileName);

            // 检查文件是否存在
            if (fs.existsSync(filePath)) {
                const uri = vscode.Uri.file(filePath);
                await vscode.window.showTextDocument(uri);
                this.logger.info('Opened file from progress badge', { fileName, filePath });
            } else {
                this.showError(`File not found: ${fileName}`);
                this.logger.warn('File not found when opening from badge', { fileName, filePath });
            }
        } catch (error) {
            this.logger.error('Failed to open file', error as Error, { fileName });
            this.showError(`Failed to open file: ${fileName}`);
        }
    }

    private async handleInsertCode(code: string): Promise<void> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                this.showError('No active editor found');
                return;
            }

            // 获取当前光标位置
            const position = activeEditor.selection.active;
            const document = activeEditor.document;
            
            // 获取当前行的缩进
            const currentLine = document.lineAt(position.line);
            const currentIndent = this.getLineIndentation(currentLine.text);
            
            // 处理代码缩进
            const processedCode = this.adjustCodeIndentation(code, currentIndent, position.character);
            
            // 插入代码
            await activeEditor.edit(editBuilder => {
                editBuilder.insert(position, processedCode);
            });

            // 将焦点切换到编辑器
            await vscode.window.showTextDocument(activeEditor.document);

            this.logger.info('Code inserted at cursor position with proper indentation', { 
                codeLength: code.length,
                processedLength: processedCode.length,
                position: { line: position.line, character: position.character },
                currentIndent: currentIndent.length
            });
        } catch (error) {
            this.logger.error('Failed to insert code', error as Error, { code: code.substring(0, 100) + '...' });
            this.showError('Failed to insert code at cursor position');
        }
    }

    /**
     * 获取行的缩进字符串
     */
    private getLineIndentation(lineText: string): string {
        const match = lineText.match(/^(\s*)/);
        return match ? match[1] : '';
    }

    /**
     * 调整代码的缩进以匹配当前位置
     */
    private adjustCodeIndentation(code: string, baseIndent: string, cursorColumn: number): string {
        const lines = code.split('\n');
        
        if (lines.length === 1) {
            // 单行代码，直接返回
            return code;
        }

        // 检测代码块的最小缩进（排除空行）
        let minIndent = Infinity;
        const nonEmptyLines = lines.filter(line => line.trim() !== '');
        
        for (const line of nonEmptyLines) {
            const indent = this.getLineIndentation(line);
            minIndent = Math.min(minIndent, indent.length);
        }
        
        // 如果所有行都没有缩进，minIndent 为 0
        if (minIndent === Infinity) {
            minIndent = 0;
        }

        // 多行代码处理
        const processedLines: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (i === 0) {
                // 第一行直接插入，不调整缩进
                processedLines.push(line);
            } else {
                // 后续行需要调整缩进
                if (line.trim() === '') {
                    // 空行保持空行
                    processedLines.push('');
                } else {
                    // 获取当前行的原始缩进
                    const originalIndent = this.getLineIndentation(line);
                    
                    // 计算相对缩进：当前行缩进 - 最小缩进
                    const relativeIndentLevel = Math.max(0, originalIndent.length - minIndent);
                    
                    // 移除原有的前导空格，保留相对缩进
                    const trimmedLine = line.replace(/^\s*/, '');
                    
                    // 构建新的缩进：基础缩进 + 相对缩进
                    const newIndent = baseIndent + ' '.repeat(relativeIndentLevel);
                    
                    processedLines.push(newIndent + trimmedLine);
                }
            }
        }
        
        return processedLines.join('\n');
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
                    timestamp: msg.timestamp,
                    metadata: msg.metadata
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

    public switchToTestScriptMode(): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'switchToTestScript'
            });
        }
    }

    private async addProgressMessage(message: string, status: 'info' | 'success' | 'warning' | 'error', fileName?: string): Promise<void> {
        try {
            // 确保有session
            if (!this._currentSessionId) {
                this._currentSessionId = await this.chatUseCase.createNewSession();
            }

            const progressMessage = ChatMessageEntity.create(
                'system',
                message,
                this._currentSessionId,
                { 
                    type: 'progress', 
                    status,
                    fileName
                }
            );

            // 直接添加到仓库中
            await this.chatUseCase.addSystemMessage(progressMessage);
            
            // 重新加载聊天历史以显示新的进度消息
            await this.loadChatHistory();
        } catch (error) {
            this.logger.error('Failed to add progress message', error as Error);
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
