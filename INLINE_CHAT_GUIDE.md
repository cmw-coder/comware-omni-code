# Inline Chat 功能文档

## 概述

Comware Omni Code 扩展现在包含了类似 GitHub Copilot 的 inline chat 功能，让您可以直接在编辑器中与AI进行交互，获得代码建议、解释和修改。

## 功能特性

### 🚀 Inline Chat
- **快捷键**: `Ctrl+K Ctrl+I` (Windows/Linux) 或 `Cmd+K Cmd+I` (Mac)
- **命令**: `Comware Omni: Start Inline Chat`
- **特性**:
  - 智能检测代码/文本响应
  - 可视化建议预览
  - 接受/拒绝/修改建议
  - 上下文感知对话
  - 美观的用户界面

## 使用方法

### 1. 启动 Inline Chat

#### 方法一：使用快捷键
- 将光标放在代码中的任意位置
- 按下 `Ctrl+K Ctrl+I` 启动inline chat

#### 方法二：使用命令面板
1. 按下 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Inline Chat" 并选择相应的命令

#### 方法三：使用右键菜单
1. 在编辑器中右键点击
2. 选择 "Start Inline Chat"

### 2. 与 AI 交互

输入您的请求，例如：
- `重构这个函数以提高性能`
- `添加错误处理`
- `解释这段代码的作用`
- `生成单元测试`
- `修复这个bug`
- `优化这个算法`

### 3. 处理 AI 响应

#### 对于代码建议：
- **✅ Accept**: 应用建议到代码中
- **❌ Reject**: 丢弃建议
- **👁 Preview**: 在新文档中查看完整建议
- **✏ Modify**: 请求修改建议

#### 对于解释/说明：
- 短响应直接显示在通知中
- 长响应在新文档中打开
- 可以继续对话询问后续问题

## 使用场景

### 代码重构
```typescript
// 选中一段代码，然后问：
// "重构这个函数使其更简洁"
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        total += items[i].price * items[i].quantity;
    }
    return total;
}
```

### 代码解释
```javascript
// 将光标放在复杂代码上，然后问：
// "解释这个正则表达式的作用"
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

### 代码生成
```python
# 在空行处问：
# "创建一个Python装饰器用于测量函数执行时间"
```

### Bug修复
```java
// 选中有问题的代码，然后问：
// "修复这个空指针异常"
String result = getText().toLowerCase();
```

## 提示技巧

### 📋 最佳实践

1. **具体描述需求**
   - ❌ "改进代码"
   - ✅ "重构此函数以减少循环嵌套"

2. **提供上下文**
   - 选择相关代码片段
   - 说明代码的用途和约束

3. **逐步优化**
   - 先获取基本实现
   - 再要求具体改进

### 🎯 常用指令模板

- **重构**: `重构这个[函数/类/模块]以提高[性能/可读性/可维护性]`
- **优化**: `优化这段代码的[时间复杂度/内存使用/性能]`
- **修复**: `修复这个[bug类型]并添加适当的错误处理`
- **生成**: `生成一个[功能描述]的[函数/类/组件]`
- **测试**: `为这个函数创建单元测试`
- **文档**: `为这个API添加JSDoc注释`

## 配置选项

可以在 VS Code 设置中配置以下选项：

- `comware-omni-code.apiUrl`: API端点URL
- `comware-omni-code.apiKey`: API密钥
- `comware-omni-code.model`: 使用的AI模型
- `comware-omni-code.maxTokens`: 最大token数
- `comware-omni-code.temperature`: 生成温度(0-1)

## 故障排除

### 常见问题

1. **命令不可用**
   - 确保扩展已激活
   - 检查是否在支持的文件类型中

2. **AI响应缓慢**
   - 检查网络连接
   - 验证API配置

3. **响应质量不佳**
   - 提供更多上下文
   - 使用更具体的描述
   - 调整temperature设置

### 联系支持

如果遇到问题，请：
1. 查看VS Code输出面板中的错误信息
2. 检查扩展设置配置
3. 在项目仓库提交issue

## 更新日志

### v0.0.1
- ✨ 新增Inline Chat功能
- 🎨 美观的用户界面设计
- ⚡ 智能代码/文本检测
- 🔧 可配置的AI参数
