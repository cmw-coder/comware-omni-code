import { injectable, inject } from 'inversify';
import { IChatRepository } from '../../core/interfaces/IChatRepository';
import { IAIClient, TestScriptRequest } from '../../core/interfaces/IAIClient';
import { ILogger } from '../../core/interfaces/ILogger';
import { ChatMessage, ChatMessageEntity } from '../entities/ChatMessage';
import { TYPES } from '../../core/container/types';

export interface IChatService {
    sendMessage(content: string, sessionId?: string, mode?: string): Promise<ChatMessage>;
    sendTestScriptMessage(content: string, testScriptRequest: TestScriptRequest, sessionId?: string): Promise<ChatMessage>;
    sendMessageWithoutUserMessage(sessionId?: string, mode?: string): Promise<ChatMessage>;
    sendTestScriptMessageWithoutUserMessage(testScriptRequest: TestScriptRequest, sessionId?: string): Promise<ChatMessage>;
    addUserMessage(content: string, sessionId?: string): Promise<ChatMessage>;
    addSystemMessage(message: ChatMessage): Promise<void>;
    getChatHistory(sessionId?: string): Promise<ChatMessage[]>;
    clearChatHistory(sessionId?: string): Promise<void>;
    createChatSession(): Promise<string>;
}

@injectable()
export class ChatService implements IChatService {
    constructor(
        @inject(TYPES.ChatRepository) private chatRepository: IChatRepository,
        @inject(TYPES.AIClient) private aiClient: IAIClient,
        @inject(TYPES.Logger) private logger: ILogger
    ) {}

    async sendMessage(content: string, sessionId?: string, mode?: string): Promise<ChatMessage> {
        try {
            this.logger.info('Sending chat message', { content, sessionId, mode });

            // 创建用户消息
            const userMessage = ChatMessageEntity.create('user', content, sessionId);
            await this.chatRepository.saveMessage(userMessage);

            // 获取聊天历史以提供上下文
            const history = await this.chatRepository.getChatHistory(sessionId);
            const messages = history.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // 获取AI响应
            const aiResponse = await this.aiClient.getChatResponse(messages);
            if (!aiResponse) {
                throw new Error('Failed to get AI response');
            }

            // 创建助手消息
            const assistantMessage = ChatMessageEntity.create('assistant', aiResponse, sessionId);
            await this.chatRepository.saveMessage(assistantMessage);

            this.logger.info('Chat message processed successfully');
            return assistantMessage;
        } catch (error) {
            this.logger.error('Failed to send chat message', error as Error, { content, sessionId });
            throw error;
        }
    }

    async sendTestScriptMessage(content: string, testScriptRequest: TestScriptRequest, sessionId?: string): Promise<ChatMessage> {
        try {
            this.logger.info('Sending test script message', { content, sessionId });

            // 创建用户消息
            const userMessage = ChatMessageEntity.create('user', content, sessionId);
            await this.chatRepository.saveMessage(userMessage);

            // 调用测试脚本生成API
            const aiResponse = await this.aiClient.generateTestScript(testScriptRequest);
            if (!aiResponse) {
                throw new Error('Failed to get test script response');
            }

            // 创建助手消息
            const assistantMessage = ChatMessageEntity.create('assistant', aiResponse, sessionId);
            await this.chatRepository.saveMessage(assistantMessage);

            this.logger.info('Test script message processed successfully');
            return assistantMessage;
        } catch (error) {
            this.logger.error('Failed to send test script message', error as Error, { content, sessionId });
            throw error;
        }
    }

    async sendMessageWithoutUserMessage(sessionId?: string, mode?: string): Promise<ChatMessage> {
        try {
            this.logger.info('Sending chat message without user message', { sessionId, mode });

            // 获取聊天历史以提供上下文
            const history = await this.chatRepository.getChatHistory(sessionId);
            const messages = history.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // 获取AI响应
            const aiResponse = await this.aiClient.getChatResponse(messages);
            if (!aiResponse) {
                throw new Error('Failed to get AI response');
            }

            // 创建助手消息
            const assistantMessage = ChatMessageEntity.create('assistant', aiResponse, sessionId);
            await this.chatRepository.saveMessage(assistantMessage);

            this.logger.info('Chat message processed successfully');
            return assistantMessage;
        } catch (error) {
            this.logger.error('Failed to send chat message', error as Error, { sessionId });
            throw error;
        }
    }

    async sendTestScriptMessageWithoutUserMessage(testScriptRequest: TestScriptRequest, sessionId?: string): Promise<ChatMessage> {
        try {
            this.logger.info('Sending test script message without user message', { sessionId });

            // 调用测试脚本生成API
            const aiResponse = await this.aiClient.generateTestScript(testScriptRequest);
            if (!aiResponse) {
                throw new Error('Failed to get test script response');
            }

            // 创建助手消息
            const assistantMessage = ChatMessageEntity.create('assistant', aiResponse, sessionId);
            await this.chatRepository.saveMessage(assistantMessage);

            this.logger.info('Test script message processed successfully');
            return assistantMessage;
        } catch (error) {
            this.logger.error('Failed to send test script message', error as Error, { sessionId });
            throw error;
        }
    }

    async addUserMessage(content: string, sessionId?: string): Promise<ChatMessage> {
        try {
            this.logger.debug('Adding user message', { content: content.substring(0, 50) + '...', sessionId });
            
            // 创建用户消息
            const userMessage = ChatMessageEntity.create('user', content, sessionId);
            await this.chatRepository.saveMessage(userMessage);

            this.logger.info('User message added successfully', { messageId: userMessage.id, sessionId });
            return userMessage;
        } catch (error) {
            this.logger.error('Failed to add user message', error as Error, { content, sessionId });
            throw error;
        }
    }

    async addSystemMessage(message: ChatMessage): Promise<void> {
        try {
            await this.chatRepository.saveMessage(message);
            this.logger.debug('System message added', { messageId: message.id, sessionId: message.sessionId });
        } catch (error) {
            this.logger.error('Failed to add system message', error as Error, { messageId: message.id });
            throw error;
        }
    }

    async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
        try {
            return await this.chatRepository.getChatHistory(sessionId);
        } catch (error) {
            this.logger.error('Failed to get chat history', error as Error, { sessionId });
            throw error;
        }
    }

    async clearChatHistory(sessionId?: string): Promise<void> {
        try {
            await this.chatRepository.clearChatHistory(sessionId);
            this.logger.info('Chat history cleared', { sessionId });
        } catch (error) {
            this.logger.error('Failed to clear chat history', error as Error, { sessionId });
            throw error;
        }
    }

    async createChatSession(): Promise<string> {
        const sessionId = generateSessionId();
        this.logger.info('Created new chat session', { sessionId });
        return sessionId;
    }
}

function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
