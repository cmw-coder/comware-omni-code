# Comware Omni Code

Comware Omni Code 是一个基于 AI 的代码补全扩展，提供类似 GitHub Copilot 的内联代码补全体验。

## 功能特性

- 🤖 **智能代码补全**: 基于 OpenAI GPT 模型的智能代码建议
- 💡 **内联显示**: 代码建议以灰色文本显示在光标后方，无需弹出菜单
- 🌐 **多语言支持**: 支持所有编程语言
- ⚙️ **可配置**: 支持自定义 API 端点、模型和参数
- 🎯 **上下文感知**: 基于当前文件的上下文提供相关建议

## 快速开始

1. **安装扩展**: 在 VS Code 扩展市场搜索并安装 "Comware Omni Code"

2. **配置 API**: 打开 VS Code 设置 (Ctrl+,)，搜索 "comware-omni-code"，设置您的 OpenAI API 密钥

3. **开始使用**: 在任何代码文件中开始输入，观察灰色的内联补全提示

4. **接受补全**: 按 Tab 键接受内联补全建议

## 配置选项

本扩展提供以下配置选项：

- `comware-omni-code.apiUrl`: OpenAI API 端点 URL
- `comware-omni-code.apiKey`: OpenAI API 密钥 (必需)
- `comware-omni-code.model`: 使用的 AI 模型 (默认: gpt-3.5-turbo)
- `comware-omni-code.maxTokens`: 最大生成 token 数 (默认: 50)
- `comware-omni-code.temperature`: 生成温度 (默认: 0.5)

## 使用示例

```javascript
// 输入函数定义，AI 会建议函数体
function calculateTotal(items) {
    // AI 建议: return items.reduce((sum, item) => sum + item.price, 0);
```

```typescript
// 输入类属性，AI 会建议相关方法
class UserService {
    private users: User[] = [];
    
    // 输入 "getUserBy" 后 AI 可能建议: "Id(id: string): User | undefined"
```

## 注意事项

- 需要有效的 OpenAI API 密钥
- 建议使用较新的 GPT 模型以获得更好的代码补全效果
- 内联补全仅在行末显示，避免干扰现有代码编辑

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
