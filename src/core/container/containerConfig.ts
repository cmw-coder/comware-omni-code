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

export function configureDependencies(): void {
    // Infrastructure layer
    container.bind(TYPES.ConfigurationService, () => ConfigurationService.getInstance());
    container.bind(TYPES.Logger, VSCodeLogger);
    container.bind(TYPES.ChatRepository, InMemoryChatRepository);
    container.bind(TYPES.CodeCompletionRepository, InMemoryCodeCompletionRepository);
    
    // AI Client with dependencies
    container.bind(TYPES.AIClient, () => new OpenAIClient(
        container.get(TYPES.ConfigurationService),
        container.get(TYPES.Logger)
    ));

    // Domain services with dependencies
    container.bind(TYPES.ChatService, () => new ChatService(
        container.get(TYPES.ChatRepository),
        container.get(TYPES.AIClient),
        container.get(TYPES.Logger)
    ));

    container.bind(TYPES.CodeCompletionService, () => new CodeCompletionService(
        container.get(TYPES.CodeCompletionRepository),
        container.get(TYPES.AIClient),
        container.get(TYPES.Logger)
    ));

    container.bind(TYPES.InlineChatService, () => new InlineChatService(
        container.get(TYPES.AIClient),
        container.get(TYPES.Logger)
    ));

    // Application use cases with dependencies
    container.bind(TYPES.ChatUseCase, () => new ChatUseCase(
        container.get(TYPES.ChatService),
        container.get(TYPES.Logger)
    ));

    container.bind(TYPES.CodeCompletionUseCase, () => new CodeCompletionUseCase(
        container.get(TYPES.CodeCompletionService),
        container.get(TYPES.Logger)
    ));

    container.bind(TYPES.InlineChatUseCase, () => new InlineChatUseCase(
        container.get(TYPES.InlineChatService),
        container.get(TYPES.Logger)
    ));
}
