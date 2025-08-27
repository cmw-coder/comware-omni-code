const vscode = acquireVsCodeApi();
let currentMode = 'chat';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header-buttons');
    if (header) {
        const testBtn = document.createElement('button');
        testBtn.className = 'header-button';
        testBtn.textContent = 'Test Code';
        testBtn.onclick = addTestMessage;
        testBtn.title = '添加测试代码消息（演示用）';
        header.appendChild(testBtn);
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
            input.placeholder = 'Describe what you want to edit...';
            break;
        // case 'agent':
        //     input.placeholder = 'Describe the task for the AI agent...';
        //     break;
        case 'testScript':
            input.placeholder = 'Describe the test script you want to create...';
            break;
        default:
            input.placeholder = 'Type your message...';
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

// Add test button for demonstration (remove in production)
function addTestMessage() {
    const testMessages = [
        {
            id: 'test-markdown-' + Date.now(),
            role: 'assistant',
            content: `这是一个包含代码块的测试消息：

\`\`\`javascript
function calculateSum(a, b) {
    // This is a comment
    const result = a + b;
    return result;
}

// Usage example
const sum = calculateSum(5, 3);
console.log("Sum is:", sum);
\`\`\`

这里有一些行内代码：\`const greeting = "Hello World"\`

还有一个Python代码块：

\`\`\`python
def fibonacci(n):
    """计算斐波那契数列"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 测试
for i in range(10):
    print(f"fibonacci({i}) = {fibonacci(i)}")
\`\`\``,
            timestamp: new Date().toISOString()
        },
        {
            id: 'test-python-' + Date.now() + 1,
            role: 'assistant',
            content: `def test_login_success():
    """测试成功登录"""
    driver = webdriver.Chrome()
    driver.get("https://example.com/login")
    
    # 输入用户名和密码
    username_field = driver.find_element(By.ID, "username")
    password_field = driver.find_element(By.ID, "password")
    
    username_field.send_keys("test_user")
    password_field.send_keys("test_password")
    
    # 点击登录按钮
    login_button = driver.find_element(By.ID, "login-button")
    login_button.click()
    
    # 验证登录成功
    assert "dashboard" in driver.current_url
    welcome_text = driver.find_element(By.CLASS_NAME, "welcome-message")
    assert "Welcome" in welcome_text.text
    
    driver.quit()`,
            timestamp: new Date().toISOString(),
            metadata: { mode: 'testScript' }
        }
    ];
    
    updateMessages(testMessages);
}

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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <p>Start a conversation with AI</p>
                <p style="font-size: 12px;">Ask questions, get code help, or chat about anything!</p>
            </div>
        `;
    } else {
        container.innerHTML = messages.map(msg => {
            // 检查是否是进度消息
            if (msg.role === 'system' && msg.metadata && msg.metadata.type === 'progress') {
                return createProgressMessage(msg.content, msg.metadata.status, msg.metadata.fileName);
            } else {
                const processedContent = msg.role === 'assistant' ? 
                    processAssistantMessage(msg.content, msg.metadata) : 
                    escapeHtml(msg.content);
                
                return `
                <div class="message ${msg.role}">
                    <div class="message-header">
                        <strong>${msg.role === 'user' ? 'You' : 'AI'}</strong>
                        <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-content">${processedContent}</div>
                </div>
                `;
            }
        }).join('');
    }
    
    container.scrollTop = container.scrollHeight;
}

function createProgressMessage(message, status, fileName) {
    let progressHtml = `<div class="progress-message progress-${status}">`;
    progressHtml += `<span class="progress-text">${escapeHtml(message)}</span>`;
    
    if (fileName) {
        progressHtml += `<span class="file-badge" title="点击打开 ${fileName}" onclick="openFile('${fileName}')">${fileName}</span>`;
    }
    
    progressHtml += '</div>';
    return progressHtml;
}

function openFile(fileName) {
    vscode.postMessage({
        type: 'openFile',
        fileName: fileName
    });
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

function processAssistantMessage(content, metadata) {
    // 检查是否是testScript模式的消息
    if (metadata && metadata.mode === 'testScript') {
        // testScript模式：整个内容都是Python代码
        return createPythonCodeBlock(content);
    } else {
        // 其他模式：按Markdown处理，支持代码块
        return processMarkdownContent(content);
    }
}

function createPythonCodeBlock(code) {
    const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
    const trimmedCode = code.trim();
    
    // 存储原始代码
    codeDataMap.set(codeId, trimmedCode);
    
    // 使用本地语法高亮
    const highlightedCode = highlightCode(trimmedCode, 'python');
    
    return `
        <div class="code-block">
            <div class="code-header">
                <span class="code-language">python</span>
                <div class="code-actions">
                    <button class="code-action-btn" onclick="copyCode('${codeId}')" title="复制代码">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
                        </svg>
                    </button>
                    <button class="code-action-btn" onclick="insertCode('${codeId}')" title="插入到光标位置">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 2a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V3.56L5.03 5.78a.75.75 0 0 1-1.06-1.06l3.5-3.5A.75.75 0 0 1 8 2Zm-5.25 9a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5h-8a.75.75 0 0 1-.75-.75Z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <pre class="code-content" id="${codeId}"><code class="language-python">${highlightedCode}</code></pre>
        </div>
    `;
}

function processMarkdownContent(content) {
    // 处理代码块 ```language ... ```
    const codeBlockRegex = /```(\w+)?\n?(.*?)```/g;
    let processed = content;
    
    // 先处理代码块，避免HTML转义影响
    const codeBlocks = [];
    let codeBlockIndex = 0;
    
    processed = processed.replace(codeBlockRegex, (match, language, code) => {
        const lang = language || 'plaintext';
        const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
        const rawCode = code.trim();
        
        // 存储原始代码
        codeDataMap.set(codeId, rawCode);
        
        // 使用本地语法高亮
        const highlightedCode = highlightCode(rawCode, lang);
        
        const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
        codeBlocks[codeBlockIndex] = `
            <div class="code-block">
                <div class="code-header">
                    <span class="code-language">${escapeHtml(lang)}</span>
                    <div class="code-actions">
                        <button class="code-action-btn" onclick="copyCode('${codeId}')" title="复制代码">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
                            </svg>
                        </button>
                        <button class="code-action-btn" onclick="insertCode('${codeId}')" title="插入到光标位置">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 2a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V3.56L5.03 5.78a.75.75 0 0 1-1.06-1.06l3.5-3.5A.75.75 0 0 1 8 2Zm-5.25 9a.75.75 0 0 1 .75-.75h8a.75.75 0 0 1 0 1.5h-8a.75.75 0 0 1-.75-.75Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <pre class="code-content" id="${codeId}"><code class="language-${escapeHtml(lang)}">${highlightedCode}</code></pre>
            </div>
        `;
        codeBlockIndex++;
        return placeholder;
    });
    
    // 处理行内代码 `code` (在HTML转义之前)
    const inlineCodeRegex = /`([^`]+)`/g;
    const inlineCodes = [];
    let inlineCodeIndex = 0;
    
    processed = processed.replace(inlineCodeRegex, (match, code) => {
        const placeholder = `__INLINE_CODE_${inlineCodeIndex}__`;
        inlineCodes[inlineCodeIndex] = `<code class="inline-code">${escapeHtml(code)}</code>`;
        inlineCodeIndex++;
        return placeholder;
    });
    
    // HTML转义其余内容
    processed = escapeHtml(processed);
    
    // 恢复行内代码
    inlineCodes.forEach((code, index) => {
        processed = processed.replace(`__INLINE_CODE_${index}__`, code);
    });
    
    // 恢复代码块
    codeBlocks.forEach((block, index) => {
        processed = processed.replace(`__CODE_BLOCK_${index}__`, block);
    });
    
    // 处理换行
    processed = processed.replace(/\n/g, '<br>');
    
    return processed;
}

// 存储原始代码的全局映射
const codeDataMap = new Map();

// 改进的本地语法高亮函数
function highlightCode(code, language) {
    // 先转义HTML
    let highlighted = escapeHtml(code);
    
    // 定义各种语言的语法规则
    const syntaxRules = {
        python: {
            keywords: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None', 'pass', 'break', 'continue', 'global', 'nonlocal', 'yield', 'async', 'await'],
            stringQuotes: ['"', "'"],
            comments: ['#'],
            decorators: /@\w+/g,
            functions: /\b(\w+)(?=\s*\()/g
        },
        javascript: {
            keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'static', 'true', 'false', 'null', 'undefined'],
            stringQuotes: ['"', "'", '`'],
            comments: ['//', '/*'],
            functions: /\b(\w+)(?=\s*\()/g
        },
        typescript: {
            keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'interface', 'type', 'public', 'private', 'protected', 'readonly', 'static', 'abstract', 'enum', 'namespace', 'module', 'declare'],
            stringQuotes: ['"', "'", '`'],
            comments: ['//', '/*'],
            functions: /\b(\w+)(?=\s*\()/g
        },
        java: {
            keywords: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'String', 'boolean', 'if', 'else', 'for', 'while', 'return', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super', 'true', 'false', 'null'],
            stringQuotes: ['"'],
            comments: ['//', '/*'],
            functions: /\b(\w+)(?=\s*\()/g
        }
    };
    
    const rules = syntaxRules[language.toLowerCase()] || syntaxRules.javascript;
    
    // 高亮装饰器 (Python)
    if (rules.decorators) {
        highlighted = highlighted.replace(rules.decorators, '<span class="decorator">$&</span>');
    }
    
    // 高亮关键字
    rules.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    // 高亮字符串 - 更精确的处理
    if (rules.stringQuotes.includes('"')) {
        highlighted = highlighted.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="string">$1</span>');
    }
    if (rules.stringQuotes.includes("'")) {
        highlighted = highlighted.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="string">$1</span>');
    }
    if (rules.stringQuotes.includes('`')) {
        highlighted = highlighted.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="string">$1</span>');
    }
    
    // 高亮三引号字符串 (Python)
    if (language.toLowerCase() === 'python') {
        highlighted = highlighted.replace(/("""[\s\S]*?""")/g, '<span class="string">$1</span>');
        highlighted = highlighted.replace(/('''[\s\S]*?''')/g, '<span class="string">$1</span>');
    }
    
    // 高亮注释
    if (rules.comments.includes('//')) {
        highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    }
    if (rules.comments.includes('/*')) {
        highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
    }
    if (rules.comments.includes('#')) {
        highlighted = highlighted.replace(/(#.*$)/gm, '<span class="comment">$1</span>');
    }
    
    // 高亮函数调用
    if (rules.functions) {
        highlighted = highlighted.replace(rules.functions, '<span class="function">$1</span>');
    }
    
    // 高亮数字
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    
    // 高亮操作符
    highlighted = highlighted.replace(/([+\-*/%=<>!&|^~])/g, '<span class="operator">$1</span>');
    
    return highlighted;
}

function copyCode(codeId) {
    // 从映射中获取原始代码
    const code = codeDataMap.get(codeId);
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            showToast('代码已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败');
        });
    } else {
        showToast('复制失败：未找到代码内容');
    }
}

function insertCode(codeId) {
    // 从映射中获取原始代码
    const code = codeDataMap.get(codeId);
    if (code) {
        vscode.postMessage({
            type: 'insertCode',
            code: code
        });
        showToast('代码已插入到光标位置');
    } else {
        showToast('插入失败：未找到代码内容');
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}
