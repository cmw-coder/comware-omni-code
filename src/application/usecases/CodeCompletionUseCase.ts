import { ICodeCompletionService } from '../../domain/services/CodeCompletionService';
import { ILogger } from '../../core/interfaces/ILogger';
import { CodeCompletion } from '../../domain/entities/CodeCompletion';

export interface ICodeCompletionUseCase {
    getCompletion(
        prompt: string,
        language: string,
        context?: {
            fileName?: string;
            lineNumber?: number;
            surroundingCode?: string;
        }
    ): Promise<string | undefined>;
    
    getCompletionHistory(language?: string): Promise<CodeCompletion[]>;
    clearCompletionHistory(): Promise<void>;
}

export class CodeCompletionUseCase implements ICodeCompletionUseCase {
    constructor(
        private codeCompletionService: ICodeCompletionService,
        private logger: ILogger
    ) {}

    async getCompletion(
        prompt: string,
        language: string,
        context?: {
            fileName?: string;
            lineNumber?: number;
            surroundingCode?: string;
        }
    ): Promise<string | undefined> {
        this.logger.info('Code completion use case: getting completion', { 
            prompt: prompt.substring(0, 50) + '...', 
            language, 
            context 
        });

        if (!prompt.trim()) {
            this.logger.warn('Empty prompt provided for code completion');
            return undefined;
        }

        return await this.codeCompletionService.getCompletion(prompt, language, context);
    }

    async getCompletionHistory(language?: string): Promise<CodeCompletion[]> {
        this.logger.debug('Code completion use case: getting completion history', { language });
        return await this.codeCompletionService.getCompletionHistory(language);
    }

    async clearCompletionHistory(): Promise<void> {
        this.logger.info('Code completion use case: clearing completion history');
        await this.codeCompletionService.clearCompletionHistory();
    }
}
