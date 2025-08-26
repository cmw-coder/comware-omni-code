export interface CodeCompletion {
    id: string;
    prompt: string;
    suggestion: string;
    language: string;
    timestamp: Date;
    confidence?: number;
    context?: {
        fileName?: string;
        lineNumber?: number;
        surroundingCode?: string;
    };
}

export class CodeCompletionEntity implements CodeCompletion {
    constructor(
        public id: string,
        public prompt: string,
        public suggestion: string,
        public language: string,
        public timestamp: Date = new Date(),
        public confidence?: number,
        public context?: {
            fileName?: string;
            lineNumber?: number;
            surroundingCode?: string;
        }
    ) {}

    static create(
        prompt: string,
        suggestion: string,
        language: string,
        confidence?: number,
        context?: {
            fileName?: string;
            lineNumber?: number;
            surroundingCode?: string;
        }
    ): CodeCompletionEntity {
        return new CodeCompletionEntity(
            generateId(),
            prompt,
            suggestion,
            language,
            new Date(),
            confidence,
            context
        );
    }
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
