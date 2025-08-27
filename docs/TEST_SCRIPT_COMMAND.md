# Comware Omni Code - Test Script 命令使用指南

## 功能说明

`comware-omni-code.testScript` 命令可以快速打开侧边栏并切换到测试脚本生成模式。

## 使用方法

### 方法 1: 命令面板
1. 按 `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`) 打开命令面板
2. 输入 "Start Test Script Chat" 或 "testScript"
3. 选择 "Comware Omni: Start Test Script Chat" 命令

### 方法 2: 快捷键
- Windows/Linux: `Ctrl+Alt+I`
- macOS: `Cmd+Alt+I`

### 方法 3: 右键菜单
1. 在任意代码编辑器中右键
2. 选择 "Start Test Script Chat"

## 预期行为

执行命令后会自动：
1. 📂 打开 Comware Omni 侧边栏
2. 🔧 切换到 "Test Script" 模式
3. 🎯 将焦点设置在输入框
4. 💬 显示测试脚本专用的提示文本

## 注意事项

- 确保有活跃的代码编辑器窗口，测试脚本功能会分析当前代码文件
- 测试脚本模式会读取 `conftest.py` 和 `.topox` 文件来提供上下文
- 输入框会显示 "Describe the test script you want to create..." 提示

## 开发者信息

此功能的实现包括：
- 扩展主入口注册命令
- ChatPanelService 提供模式切换接口
- 前端 JavaScript 处理 UI 更新和焦点设置
