// 重新导出核心类型和接口，避免循环引用
export * from './core/interfaces/IAIClient';
export * from './core/interfaces/IConfigurationService';
export * from './core/interfaces/IChatRepository';
export * from './core/interfaces/ICodeCompletionRepository';
export * from './core/interfaces/ILogger';

export * from './domain/entities/ChatMessage';
export * from './domain/entities/CodeCompletion';

export * from './domain/services/ChatService';
export * from './domain/services/CodeCompletionService';
export * from './domain/services/InlineChatService';

export * from './application/usecases/ChatUseCase';
export * from './application/usecases/CodeCompletionUseCase';
export * from './application/usecases/InlineChatUseCase';

export * from './core/container/types';
export * from './core/container/Container';
