# 🎯 Comware Omni Code - 专业级依赖注入版本

## 🌟 项目特色

本项目采用了**现代化架构设计**，结合**Inversify专业依赖注入框架**，实现了高质量、可维护、可扩展的VS Code AI编程助手扩展。

### 🏗️ 核心架构
- ✨ **清洁架构** - 分层设计，职责分离
- 🔄 **Inversify DI** - 专业级依赖注入框架
- 🛡️ **类型安全** - 完整的TypeScript类型支持
- 🧪 **高可测试性** - 依赖注入便于单元测试
- 📈 **高可扩展性** - 面向接口编程，易于扩展

### 🎨 技术栈
- **TypeScript** - 类型安全的开发体验
- **Inversify** - 专业依赖注入容器
- **VS Code Extension API** - 原生扩展开发
- **Reflect Metadata** - 装饰器元数据支持

## 🚀 快速开始

### 环境要求
- Node.js 16+ 
- npm 包管理器
- VS Code 1.100.0+

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd comware-omni-code
```

2. **安装依赖**
```bash
npm install
```

3. **编译项目**
```bash
npm run compile
```

4. **启动调试**
- 按 `F5` 或使用 VS Code 的"运行和调试"面板

## 🏗️ 项目架构

```
src/
├── core/                       # 🧠 核心层 - DI容器和接口
│   ├── interfaces/            # 核心接口定义
│   └── container/            # Inversify DI容器
├── domain/                    # 💼 领域层 - 业务逻辑
│   ├── entities/             # 领域实体
│   └── services/            # 领域服务
├── infrastructure/           # 🔧 基础设施层 - 外部依赖
│   ├── clients/             # AI客户端实现
│   ├── config/             # 配置服务
│   ├── logger/             # 日志服务
│   └── repositories/       # 数据仓储
├── application/             # 📋 应用层 - 用例编排
│   └── usecases/           # 业务用例
├── presentation/           # 🖥️ 表示层 - VS Code UI
│   ├── providers/         # VS Code提供者
│   └── views/            # 视图服务
└── types/                 # 📝 类型定义
```

## ⚙️ 配置设置

在VS Code设置中配置以下选项：

```json
{
  "comware-omni-code.apiUrl": "https://api.openai.com/v1/chat/completions",
  "comware-omni-code.apiKey": "your-openai-api-key",
  "comware-omni-code.model": "gpt-3.5-turbo",
  "comware-omni-code.maxTokens": 150,
  "comware-omni-code.temperature": 0.7
}
```

## 🎮 功能特性

### 🤖 AI代码补全
- **智能补全**: 基于上下文的代码建议
- **多语言支持**: TypeScript, JavaScript, Python, Java, C++, C, Go, Rust
- **实时补全**: 输入时自动触发
- **上下文感知**: 考虑周围代码环境

### 💬 智能聊天面板
- **多模式交互**: Chat、Edit、Agent三种模式
- **会话管理**: 支持多会话和历史记录
- **实时响应**: 流式AI对话体验
- **Markdown支持**: 富文本消息显示

### ✏️ 内联代码编辑
- **选中编辑**: 选择代码后直接编辑指令
- **预览模式**: Diff视图预览修改
- **智能建议**: 基于指令的代码修改
- **一键应用**: 快速应用AI建议

## 🔧 开发指南

### 依赖注入使用

#### 创建新服务
```typescript
import { injectable, inject } from 'inversify';

@injectable()
export class MyService implements IMyService {
    constructor(
        @inject(TYPES.Logger) private logger: ILogger,
        @inject(TYPES.ConfigurationService) private config: IConfigurationService
    ) {}
    
    async doSomething(): Promise<void> {
        this.logger.info('Doing something...');
        // 业务逻辑
    }
}
```

#### 注册服务
```typescript
// 在 containerConfig.ts 中添加
container.bind<IMyService>(TYPES.MyService).to(MyService).inSingletonScope();
```

#### 使用服务
```typescript
const myService = container.get<IMyService>(TYPES.MyService);
await myService.doSomething();
```

### 添加新功能

1. **定义接口** (core/interfaces)
2. **创建实体** (domain/entities)
3. **实现服务** (domain/services 或 infrastructure)
4. **编写用例** (application/usecases)
5. **构建UI** (presentation)
6. **配置依赖** (core/container/containerConfig.ts)

### 测试支持

```typescript
// 测试时模拟依赖
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
};

const testContainer = new Container();
testContainer.bind<ILogger>(TYPES.Logger).toConstantValue(mockLogger);
```

## 📊 架构优势

| 特性 | 传统方式 | Inversify DI | 提升 |
|------|---------|-------------|------|
| 类型安全 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | +67% |
| 可测试性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | +150% |
| 可维护性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | +67% |
| 扩展性 | ⭐⭐ | ⭐⭐⭐⭐⭐ | +150% |
| 开发体验 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | +67% |

## 🎯 命令快捷键

| 命令 | 快捷键 | 描述 |
|------|--------|------|
| `comware-omni-code.openChatPanel` | - | 打开聊天面板 |
| `comware-omni-code.editCode` | - | 内联代码编辑 |
| `comware-omni-code.startChatSession` | - | 创建新聊天会话 |
| `comware-omni-code.clearCompletionHistory` | - | 清除补全历史 |

## 📚 相关文档

- 📖 [架构迁移指南](./ARCHITECTURE_MIGRATION.md) - 项目架构演进
- 🔄 [Inversify迁移指南](./INVERSIFY_MIGRATION.md) - DI框架迁移详情
- 🎯 [优化总结](./OPTIMIZATION_SUMMARY.md) - 架构优化成果
- 🧪 [演示脚本](./src/demo-inversify.ts) - Inversify功能演示

## 🔬 演示和验证

运行架构演示：
```bash
# 编译项目
npm run compile

# 在VS Code中运行演示脚本
# 打开 src/demo-inversify.ts 并执行
```

## 🌐 Web环境支持

本项目完全支持VS Code Web环境：
- ✅ **Inversify兼容性** - 在浏览器环境中正常工作
- ✅ **Reflect Metadata** - 完整的装饰器支持
- ✅ **TypeScript编译** - 无需Node.js特定功能
- ✅ **模块化设计** - 清晰的ES模块结构

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Inversify](https://inversify.io/) - 优秀的依赖注入框架
- [VS Code Extension API](https://code.visualstudio.com/api) - 强大的扩展开发平台
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript

---

**用现代化架构打造专业级VS Code AI扩展 🚀**
