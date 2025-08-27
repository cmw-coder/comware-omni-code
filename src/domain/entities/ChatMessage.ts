export interface ChatMessage {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sessionId?: string;
    metadata?: Record<string, any>;
}

export class ChatMessageEntity implements ChatMessage {
    constructor(
        public id: string,
        public role: 'system' | 'user' | 'assistant',
        public content: string,
        public timestamp: Date = new Date(),
        public sessionId?: string,
        public metadata?: Record<string, any>
    ) {}

    static create(
        role: 'system' | 'user' | 'assistant',
        content: string,
        sessionId?: string,
        metadata?: Record<string, any>
    ): ChatMessageEntity {
        return new ChatMessageEntity(
            generateId(),
            role,
            content,
            new Date(),
            sessionId,
            metadata
        );
    }
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
