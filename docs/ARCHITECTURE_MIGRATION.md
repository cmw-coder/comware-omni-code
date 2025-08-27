# 项目结构优化迁移指南

## 概述

本次重构将项目从简单的分层结构优化为基于领域驱动设计(DDD)和清洁架构的分层结构，实现了更好的关注点分离、依赖注入和可扩展性。

## 新的项目结构

```
src/
├── core/                           # 核心层
│   ├── interfaces/                 # 核心接口定义
│   │   ├── IAIClient.ts           # AI客户端接口
│   │   ├── IConfigurationService.ts # 配置服务接口
│   │   ├── IChatRepository.ts     # 聊天仓储接口
│   │   ├── ICodeCompletionRepository.ts # 代码补全仓储接口
│   │   └── ILogger.ts             # 日志接口
│   └── container/                  # 依赖注入容器
│       ├── Container.ts           # 简单的DI容器实现
│       ├── types.ts               # 依赖类型定义
│       └── containerConfig.ts     # 依赖配置
├── domain/                         # 领域层
│   ├── entities/                  # 实体
│   │   ├── ChatMessage.ts         # 聊天消息实体
│   │   └── CodeCompletion.ts      # 代码补全实体
│   └── services/                  # 领域服务
│       ├── ChatService.ts         # 聊天服务
│       ├── CodeCompletionService.ts # 代码补全服务
│       └── InlineChatService.ts   # 内联聊天服务
├── infrastructure/                 # 基础设施层
│   ├── clients/                   # 外部客户端
│   │   └── OpenAIClient.ts        # OpenAI客户端实现
│   ├── config/                    # 配置实现
│   │   └── ConfigurationService.ts # VS Code配置服务
│   ├── logger/                    # 日志实现
│   │   └── VSCodeLogger.ts        # VS Code日志实现
│   └── repositories/              # 仓储实现
│       ├── InMemoryChatRepository.ts # 内存聊天仓储
│       └── InMemoryCodeCompletionRepository.ts # 内存代码补全仓储
├── application/                    # 应用层
│   └── usecases/                  # 用例
│       ├── ChatUseCase.ts         # 聊天用例
│       ├── CodeCompletionUseCase.ts # 代码补全用例
│       └── InlineChatUseCase.ts   # 内联聊天用例
├── presentation/                   # 表示层
│   ├── providers/                 # VS Code提供者
│   │   ├── CompletionProvider.ts  # 代码补全提供者
│   │   ├── InlineCompletionProvider.ts # 内联补全提供者
│   │   └── InlineChatProvider.ts  # 内联聊天提供者
│   └── views/                     # 视图
│       └── ChatPanelService.ts    # 聊天面板服务
├── types/                         # 类型定义（保持原有）
│   └── index.ts
└── extension-new.ts               # 新的扩展入口
```

## 架构设计原则

### 1. 分层架构
- **表示层 (Presentation)**: 处理VS Code相关的UI交互
- **应用层 (Application)**: 编排业务流程，定义用例
- **领域层 (Domain)**: 核心业务逻辑和规则
- **基础设施层 (Infrastructure)**: 外部依赖的具体实现
- **核心层 (Core)**: 接口定义和容器管理

### 2. 依赖注入
- 使用简单的DI容器管理依赖关系
- 面向接口编程，提高可测试性
- 单例模式管理服务生命周期

### 3. 关注点分离
- 每个类单一职责
- 业务逻辑与框架代码解耦
- 数据访问与业务逻辑分离

## 迁移步骤

### 第一步：备份现有代码
```bash
# 备份原有结构
cp -r src src_backup
```

### 第二步：替换入口文件
```typescript
// 将 extension.ts 重命名为 extension-old.ts
// 将 extension-new.ts 重命名为 extension.ts
```

### 第三步：更新package.json中的配置
确保所有命令和视图配置正确。

### 第四步：测试功能
- 代码补全功能
- 内联聊天功能  
- 聊天面板功能
- 配置管理

## 主要改进

### 1. 更好的可测试性
- 接口抽象使得单元测试更容易
- 依赖注入便于模拟测试

### 2. 更强的扩展性
- 新增AI提供者只需实现IAIClient接口
- 新增存储方案只需实现相应的Repository接口
- 新增功能通过用例层添加

### 3. 更清晰的代码组织
- 按职责分层，代码结构清晰
- 依赖方向明确（高层不依赖低层）

### 4. 更好的错误处理
- 统一的日志记录
- 分层的错误处理机制

## 使用示例

### 添加新的AI提供者
```typescript
// 实现IAIClient接口
export class CustomAIClient implements IAIClient {
    async getCompletion(prompt: string): Promise<string | undefined> {
        // 自定义实现
    }
    // ... 其他方法
}

// 在containerConfig.ts中注册
container.bind(TYPES.AIClient, CustomAIClient);
```

### 添加新的存储方案
```typescript
// 实现IChatRepository接口
export class DatabaseChatRepository implements IChatRepository {
    async saveMessage(message: ChatMessage): Promise<void> {
        // 数据库实现
    }
    // ... 其他方法
}

// 在containerConfig.ts中注册
container.bind(TYPES.ChatRepository, DatabaseChatRepository);
```

## 注意事项

1. **渐进式迁移**: 可以保留旧代码，逐步迁移功能
2. **配置验证**: 确保VS Code扩展配置项正确
3. **测试覆盖**: 新架构增加了测试的可能性，建议添加单元测试
4. **性能考虑**: 依赖注入有轻微的性能开销，但在VS Code扩展场景下可以忽略

## 后续优化建议

1. 添加事件驱动架构
2. 实现持久化存储
3. 添加缓存机制
4. 实现插件化架构
5. 添加配置验证和迁移机制
