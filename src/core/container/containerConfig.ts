import { container } from './Container';
import { TYPES } from './types';

// Infrastructure
import { ConfigurationService } from '../../infrastructure/config/ConfigurationService';
import { OpenAIClient } from '../../infrastructure/clients/OpenAIClient';
import { VSCodeLogger } from '../../infrastructure/logger/VSCodeLogger';
import { InMemoryChatRepository } from '../../infrastructure/repositories/InMemoryChatRepository';
import { InMemoryCodeCompletionRepository } from '../../infrastructure/repositories/InMemoryCodeCompletionRepository';

// Domain Services
import { ChatService } from '../../domain/services/ChatService';
import { CodeCompletionService } from '../../domain/services/CodeCompletionService';
import { InlineChatService } from '../../domain/services/InlineChatService';

// Application Use Cases
import { ChatUseCase } from '../../application/usecases/ChatUseCase';
import { CodeCompletionUseCase } from '../../application/usecases/CodeCompletionUseCase';
import { InlineChatUseCase } from '../../application/usecases/InlineChatUseCase';

// Interfaces
import { IConfigurationService } from '../interfaces/IConfigurationService';
import { IAIClient } from '../interfaces/IAIClient';
import { ILogger } from '../interfaces/ILogger';
import { IChatRepository } from '../interfaces/IChatRepository';
import { ICodeCompletionRepository } from '../interfaces/ICodeCompletionRepository';
import { IChatService } from '../../domain/services/ChatService';
import { ICodeCompletionService } from '../../domain/services/CodeCompletionService';
import { IInlineChatService } from '../../domain/services/InlineChatService';
import { IChatUseCase } from '../../application/usecases/ChatUseCase';
import { ICodeCompletionUseCase } from '../../application/usecases/CodeCompletionUseCase';
import { IInlineChatUseCase } from '../../application/usecases/InlineChatUseCase';

export function configureDependencies(): void {
    // Infrastructure layer - 绑定接口到具体实现
    // ConfigurationService使用单例模式，需要特殊绑定
    container.bind<IConfigurationService>(TYPES.ConfigurationService).toDynamicValue(() => 
        ConfigurationService.getInstance()
    ).inSingletonScope();
    
    container.bind<ILogger>(TYPES.Logger).to(VSCodeLogger).inSingletonScope();
    container.bind<IChatRepository>(TYPES.ChatRepository).to(InMemoryChatRepository).inSingletonScope();
    container.bind<ICodeCompletionRepository>(TYPES.CodeCompletionRepository).to(InMemoryCodeCompletionRepository).inSingletonScope();
    container.bind<IAIClient>(TYPES.AIClient).to(OpenAIClient).inSingletonScope();

    // Domain services
    container.bind<IChatService>(TYPES.ChatService).to(ChatService).inSingletonScope();
    container.bind<ICodeCompletionService>(TYPES.CodeCompletionService).to(CodeCompletionService).inSingletonScope();
    container.bind<IInlineChatService>(TYPES.InlineChatService).to(InlineChatService).inSingletonScope();

    // Application use cases
    container.bind<IChatUseCase>(TYPES.ChatUseCase).to(ChatUseCase).inSingletonScope();
    container.bind<ICodeCompletionUseCase>(TYPES.CodeCompletionUseCase).to(CodeCompletionUseCase).inSingletonScope();
    container.bind<IInlineChatUseCase>(TYPES.InlineChatUseCase).to(InlineChatUseCase).inSingletonScope();
}
