# Comware Omni Code - 优化架构版本

## 🎯 架构优化概述

本项目经过架构重构，采用了基于**领域驱动设计(DDD)**和**清洁架构**的分层设计，实现了：

- ✨ **清晰的分层结构** - 按职责分离代码
- 🔄 **依赖注入** - 面向接口编程，提高可测试性
- 📈 **高可扩展性** - 易于添加新功能和替换实现
- 🛡️ **类型安全** - 完整的TypeScript类型支持
- 🧪 **易于测试** - 良好的抽象便于单元测试

## 🏗️ 新架构结构

```
src/
├── core/                    # 🧠 核心层 - 接口定义和依赖管理
├── domain/                  # 💼 领域层 - 业务逻辑和实体
├── infrastructure/          # 🔧 基础设施层 - 外部依赖实现
├── application/            # 📋 应用层 - 用例编排
├── presentation/           # 🖥️ 表示层 - VS Code UI交互
└── types/                  # 📝 类型定义
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 编译项目
```bash
npm run compile
```

### 3. 运行扩展
- 按 `F5` 启动调试模式
- 或者通过 VS Code 的"运行和调试"面板

## 🎮 功能演示

### 代码补全
1. 在支持的语言文件中输入代码
2. 自动触发 AI 代码补全建议
3. 支持的语言：TypeScript, JavaScript, Python, Java, C++, C, Go, Rust

### 聊天面板
1. 使用 `Ctrl+Shift+P` 打开命令面板
2. 搜索 "Comware Omni: Open Chat Panel"
3. 在侧边栏中与 AI 对话

### 内联代码编辑
1. 选择要编辑的代码
2. 使用 `Ctrl+Shift+P` 打开命令面板
3. 搜索 "Comware Omni: Edit Code with AI"
4. 输入编辑指令

## ⚙️ 配置

在 VS Code 设置中配置以下选项：

```json
{
  "comware-omni-code.apiUrl": "https://api.openai.com/v1/chat/completions",
  "comware-omni-code.apiKey": "your-api-key",
  "comware-omni-code.model": "gpt-3.5-turbo",
  "comware-omni-code.maxTokens": 50,
  "comware-omni-code.temperature": 0.5
}
```

## 🧩 架构优势

### 依赖注入
```typescript
// 容器自动管理依赖关系
const chatUseCase = container.get<IChatUseCase>(TYPES.ChatUseCase);
```

### 接口抽象
```typescript
// 易于切换不同的AI提供者
interface IAIClient {
    getCompletion(prompt: string): Promise<string | undefined>;
    getChatResponse(messages: ChatMessage[]): Promise<string | undefined>;
}
```

### 分层隔离
```typescript
// 表示层 -> 应用层 -> 领域层 -> 基础设施层
// 依赖方向清晰，高层不依赖低层具体实现
```

## 🔧 扩展开发

### 添加新的AI提供者
```typescript
export class CustomAIClient implements IAIClient {
    async getCompletion(prompt: string): Promise<string | undefined> {
        // 实现自定义AI逻辑
    }
}

// 在容器中注册
container.bind(TYPES.AIClient, CustomAIClient);
```

### 添加新功能
1. 在 `domain/services` 中添加业务逻辑
2. 在 `application/usecases` 中添加用例
3. 在 `presentation` 中添加UI交互
4. 在容器中注册依赖关系

## 📚 更多信息

- 📖 [架构迁移指南](./ARCHITECTURE_MIGRATION.md) - 详细的迁移步骤和设计原理
- 🔍 [代码演示](./src/demo-architecture.ts) - 架构功能演示脚本
- 📝 [开发指南](./USAGE_EXAMPLES.md) - 原有的使用示例

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！新的架构使得代码更易于理解和扩展。

## 📄 许可证

[MIT License](./LICENSE)
