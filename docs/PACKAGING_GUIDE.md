# 扩展打包配置指南

## 概述

本文档说明了如何确保 VS Code 扩展打包时包含所有必要的文件，特别是拆分后的 HTML、CSS 和 JavaScript 文件。

## 文件结构

```
src/presentation/views/
├── ChatPanelService.ts     # 主要服务类 (编译后在 out/ 目录)
├── ChatPanelView.html      # HTML 模板 (包含在扩展包中)
├── chatPanel.css           # 样式文件 (包含在扩展包中)
└── chatPanel.js            # JavaScript 逻辑 (包含在扩展包中)
```

## 关键配置文件

### 1. `.vscodeignore`

这个文件控制哪些文件被排除在扩展包之外。我们的配置：

```ignore
.vscode/**
.vscode-test/**
src/**
!src/presentation/views/*.html
!src/presentation/views/*.css
!src/presentation/views/*.js
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/eslint.config.mjs
**/*.map
**/*.ts
**/.vscode-test.*
```

关键点：
- `src/**` 排除所有 src 目录下的文件
- `!src/presentation/views/*.html` 包含 HTML 文件
- `!src/presentation/views/*.css` 包含 CSS 文件
- `!src/presentation/views/*.js` 包含 JS 文件

### 2. `package.json` 脚本

```json
{
  "scripts": {
    "package": "npm vsce package --no-dependencies --baseContentUrl https://github.com/cmw-coder/comware-omni-code/blob/temp/",
    "verify-package": "./scripts/verify-package.sh"
  }
}
```

### 3. TypeScript 服务 (`ChatPanelService.ts`)

使用健壮的文件路径解析和错误处理：

```typescript
private _getHtmlForWebview(webview: vscode.Webview): string {
    const viewsPath = path.join(this._context.extensionPath, 'src', 'presentation', 'views');
    const htmlPath = path.join(viewsPath, 'ChatPanelView.html');
    const scriptPath = path.join(viewsPath, 'chatPanel.js');
    const cssPath = path.join(viewsPath, 'chatPanel.css');
    
    try {
        let html = fs.readFileSync(htmlPath, 'utf8');
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptPath));
        const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
        
        html = html.replace('{{scriptUri}}', scriptUri.toString());
        html = html.replace('{{cssUri}}', cssUri.toString());
        
        return html;
    } catch (error) {
        this.logger.error('Failed to load webview template files', error as Error);
        return this._getFallbackHtml();
    }
}
```

## 验证步骤

### 1. 使用验证脚本

```bash
npm run verify-package
```

这个脚本会：
- 检查源文件是否存在
- 编译 TypeScript
- 创建扩展包
- 验证包内容

### 2. 手动验证

检查扩展包内容：
```bash
unzip -l comware-omni-code-0.0.1.vsix | grep -E "\.(html|css|js)$"
```

应该看到类似输出：
```
extension/src/presentation/views/chatPanel.js
extension/src/presentation/views/chatPanel.css  
extension/src/presentation/views/ChatPanelView.html
```

### 3. 测试安装

安装扩展并测试功能：
```bash
code --install-extension comware-omni-code-0.0.1.vsix
```

## 常见问题

### 1. 文件未包含在扩展包中

**原因**：`.vscodeignore` 配置错误
**解决**：确保使用 `!` 前缀包含特定文件

### 2. 运行时找不到文件

**原因**：路径解析错误
**解决**：使用 `this._context.extensionPath` 而不是相对路径

### 3. Webview 无法加载资源

**原因**：安全策略或 URI 转换错误
**解决**：使用 `webview.asWebviewUri()` 转换文件路径

## 开发工作流

1. **开发阶段**：编辑 HTML、CSS、JS 文件，享受 IDE 语法高亮
2. **测试阶段**：运行 `npm run compile` 和 `F5` 调试
3. **打包阶段**：运行 `npm run verify-package` 验证配置
4. **发布阶段**：运行 `npm run package` 创建最终扩展包

## 最佳实践

1. **版本控制**：确保所有视图文件都在 Git 中跟踪
2. **路径一致性**：始终使用相对于扩展根目录的路径
3. **错误处理**：提供后备 HTML 以防文件加载失败
4. **测试覆盖**：定期验证打包配置的正确性

## 依赖项

确保安装了以下工具：
- `@vscode/vsce` - VS Code 扩展打包工具
- `typescript` - TypeScript 编译器
- `npm` - 包管理器

```bash
npm add -D @vscode/vsce
```
