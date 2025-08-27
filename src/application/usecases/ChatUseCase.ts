import { injectable, inject } from 'inversify';
import { IChatService } from '../../domain/services/ChatService';
import { ILogger } from '../../core/interfaces/ILogger';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { TestScriptRequest } from '../../core/interfaces/IAIClient';
import { TYPES } from '../../core/container/types';

export interface IChatUseCase {
    sendMessage(content: string, sessionId?: string, mode?: string): Promise<ChatMessage>;
    sendTestScriptMessage(content: string, testScriptRequest: TestScriptRequest, sessionId?: string): Promise<ChatMessage>;
    getChatHistory(sessionId?: string): Promise<ChatMessage[]>;
    clearChatHistory(sessionId?: string): Promise<void>;
    createNewSession(): Promise<string>;
}

@injectable()
export class ChatUseCase implements IChatUseCase {
    constructor(
        @inject(TYPES.ChatService) private chatService: IChatService,
        @inject(TYPES.Logger) private logger: ILogger
    ) {}

    async sendMessage(content: string, sessionId?: string, mode?: string): Promise<ChatMessage> {
        this.logger.info('Chat use case: sending message', { content: content.substring(0, 50) + '...', sessionId, mode });
        
        if (!content.trim()) {
            throw new Error('Message content cannot be empty');
        }

        return await this.chatService.sendMessage(content, sessionId, mode);
    }

    async sendTestScriptMessage(content: string, testScriptRequest: TestScriptRequest, sessionId?: string): Promise<ChatMessage> {
        this.logger.info('Chat use case: sending test script message', { content: content.substring(0, 50) + '...', sessionId });
        
        if (!content.trim()) {
            throw new Error('Message content cannot be empty');
        }

        return await this.chatService.sendTestScriptMessage(content, testScriptRequest, sessionId);
    }

    async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
        this.logger.debug('Chat use case: getting chat history', { sessionId });
        return await this.chatService.getChatHistory(sessionId);
    }

    async clearChatHistory(sessionId?: string): Promise<void> {
        this.logger.info('Chat use case: clearing chat history', { sessionId });
        await this.chatService.clearChatHistory(sessionId);
    }

    async createNewSession(): Promise<string> {
        this.logger.info('Chat use case: creating new session');
        return await this.chatService.createChatSession();
    }
}
