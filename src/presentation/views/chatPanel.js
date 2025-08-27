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
        case 'showProgress':
            showProgress(message.message, message.status, message.fileName);
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
        container.innerHTML = messages.map(msg => `
        <div class="message ${msg.role}">
            <div class="message-header">
                <strong>${msg.role === 'user' ? 'You' : 'AI'}</strong>
                <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
        </div>
        `).join('');
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

function showProgress(message, status, fileName) {
    const container = document.getElementById('chatContainer');
    const progressDiv = document.createElement('div');
    progressDiv.className = `progress-message progress-${status}`;
    
    // 创建进度消息内容
    const messageSpan = document.createElement('span');
    messageSpan.className = 'progress-text';
    messageSpan.textContent = message;
    
    progressDiv.appendChild(messageSpan);
    
    // 如果有文件名，添加可点击的文件badge
    if (fileName) {
        const fileBadge = document.createElement('span');
        fileBadge.className = 'file-badge';
        fileBadge.textContent = fileName;
        fileBadge.title = `点击打开 ${fileName}`;
        fileBadge.onclick = () => {
            // 发送消息给扩展来打开文件
            vscode.postMessage({
                type: 'openFile',
                fileName: fileName
            });
        };
        progressDiv.appendChild(fileBadge);
    }
    
    container.appendChild(progressDiv);
    container.scrollTop = container.scrollHeight;
    
    // 自动移除非错误的进度消息
    if (status !== 'error') {
        setTimeout(() => {
            if (progressDiv.parentNode) {
                progressDiv.remove();
            }
        }, 8000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
