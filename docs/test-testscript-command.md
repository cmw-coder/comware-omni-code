# 测试 comware-omni-code.testScript 命令

## 实现内容

我已经成功实现了 `comware-omni-code.testScript` 命令的功能，该命令将：

1. **打开侧边栏**：通过执行 `workbench.view.extension.comware-omni-sidebar` 命令来打开 Comware Omni 侧边栏
2. **切换到 testScript 模式**：自动将聊天面板切换到 testScript 模式
3. **设置焦点到输入框**：自动将焦点设置在输入框上，用户可以立即开始输入

## 修改的文件

### 1. `/src/extension.ts`
- 添加了全局变量 `globalChatPanelService` 来存储 ChatPanelService 实例
- 在 `registerCommands` 函数中添加了 `comware-omni-code.testScript` 命令的实现
- 修改了 `registerChatPanel` 函数来保存 ChatPanelService 实例到全局变量
- 将新命令添加到命令订阅列表中

### 2. `/src/presentation/views/ChatPanelService.ts`
- 添加了 `switchToTestScriptMode()` 公共方法
- 该方法向 webview 发送 `switchToTestScript` 消息

### 3. `/src/presentation/views/chatPanel.js`
- 在消息处理器中添加了对 `switchToTestScript` 消息类型的处理
- 添加了 `switchToTestScriptMode()` 函数，该函数：
  - 调用 `setMode('testScript')` 切换到 testScript 模式
  - 调用 `input.focus()` 将焦点设置到输入框

## 使用方法

1. **命令面板**：按 `Ctrl+Shift+P` 打开命令面板，输入 "Start Test Script Chat" 或 "comware-omni-code.testScript"
2. **快捷键**：`Ctrl+Alt+I` (macOS: `Cmd+Alt+I`)
3. **右键菜单**：在编辑器中右键，选择 "Start Test Script Chat"

## 预期行为

执行命令后：
1. 如果侧边栏未打开，会自动打开 Comware Omni 侧边栏
2. 聊天面板会自动切换到 "Test Script" 模式（按钮会高亮显示）
3. 输入框的占位文本会变为 "Describe the test script you want to create..."
4. 焦点会自动设置在输入框上，用户可以立即开始输入

## 技术实现细节

- 使用了 VS Code 的命令 API 来打开侧边栏
- 通过 webview 消息传递机制在扩展和前端之间通信
- 利用了现有的模式切换逻辑，确保与其他模式的一致性
- 保持了代码的模块化和可维护性
