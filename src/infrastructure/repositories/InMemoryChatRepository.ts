import { injectable } from 'inversify';
import { IChatRepository } from '../../core/interfaces/IChatRepository';
import { ChatMessage } from '../../domain/entities/ChatMessage';

@injectable()
export class InMemoryChatRepository implements IChatRepository {
    private messages: Map<string, ChatMessage[]> = new Map();
    private defaultSessionId = 'default';

    async saveMessage(message: ChatMessage): Promise<void> {
        const sessionId = message.sessionId || this.defaultSessionId;
        
        if (!this.messages.has(sessionId)) {
            this.messages.set(sessionId, []);
        }
        
        const sessionMessages = this.messages.get(sessionId)!;
        sessionMessages.push(message);
    }

    async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
        const id = sessionId || this.defaultSessionId;
        return this.messages.get(id) || [];
    }

    async clearChatHistory(sessionId?: string): Promise<void> {
        const id = sessionId || this.defaultSessionId;
        this.messages.delete(id);
    }

    async deleteMessage(messageId: string): Promise<void> {
        for (const [sessionId, messages] of this.messages.entries()) {
            const index = messages.findIndex(msg => msg.id === messageId);
            if (index !== -1) {
                messages.splice(index, 1);
                if (messages.length === 0) {
                    this.messages.delete(sessionId);
                }
                break;
            }
        }
    }

    async getChatSessions(): Promise<string[]> {
        return Array.from(this.messages.keys());
    }
}
