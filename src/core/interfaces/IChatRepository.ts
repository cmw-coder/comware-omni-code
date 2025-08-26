import { ChatMessage } from '../../domain/entities/ChatMessage';

export interface IChatRepository {
    /**
     * 保存聊天消息
     */
    saveMessage(message: ChatMessage): Promise<void>;
    
    /**
     * 获取聊天历史
     */
    getChatHistory(sessionId?: string): Promise<ChatMessage[]>;
    
    /**
     * 清空聊天历史
     */
    clearChatHistory(sessionId?: string): Promise<void>;
    
    /**
     * 删除特定消息
     */
    deleteMessage(messageId: string): Promise<void>;
    
    /**
     * 获取聊天会话列表
     */
    getChatSessions(): Promise<string[]>;
}
