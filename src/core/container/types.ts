export const TYPES = {
    // Core services
    AIClient: Symbol.for('AIClient'),
    ConfigurationService: Symbol.for('ConfigurationService'),
    Logger: Symbol.for('Logger'),
    
    // Repositories
    ChatRepository: Symbol.for('ChatRepository'),
    CodeCompletionRepository: Symbol.for('CodeCompletionRepository'),
    
    // Domain services
    ChatService: Symbol.for('ChatService'),
    CodeCompletionService: Symbol.for('CodeCompletionService'),
    InlineChatService: Symbol.for('InlineChatService'),
    
    // Application services
    ChatUseCase: Symbol.for('ChatUseCase'),
    CodeCompletionUseCase: Symbol.for('CodeCompletionUseCase'),
    InlineChatUseCase: Symbol.for('InlineChatUseCase'),
    
    // Presentation layer
    ChatPanelProvider: Symbol.for('ChatPanelProvider'),
    CompletionProvider: Symbol.for('CompletionProvider'),
    InlineCompletionProvider: Symbol.for('InlineCompletionProvider'),
    InlineChatProvider: Symbol.for('InlineChatProvider'),
} as const;
