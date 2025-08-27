import { injectable, inject } from 'inversify';
import { ICodeCompletionRepository } from '../../core/interfaces/ICodeCompletionRepository';
import { IAIClient } from '../../core/interfaces/IAIClient';
import { ILogger } from '../../core/interfaces/ILogger';
import { CodeCompletion, CodeCompletionEntity } from '../entities/CodeCompletion';
import { TYPES } from '../../core/container/types';

export interface ICodeCompletionService {
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

@injectable()
export class CodeCompletionService implements ICodeCompletionService {
    constructor(
        @inject(TYPES.CodeCompletionRepository) private codeCompletionRepository: ICodeCompletionRepository,
        @inject(TYPES.AIClient) private aiClient: IAIClient,
        @inject(TYPES.Logger) private logger: ILogger
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
        try {
            this.logger.info('Getting code completion', { prompt, language, context });

            // 获取AI补全建议
            const suggestion = await this.aiClient.getCompletion(prompt);
            if (!suggestion) {
                this.logger.warn('No completion suggestion received');
                return undefined;
            }

            // 保存补全记录
            const completion = CodeCompletionEntity.create(
                prompt,
                suggestion,
                language,
                undefined, // confidence can be added later
                context
            );
            await this.codeCompletionRepository.saveCompletion(completion);

            this.logger.info('Code completion generated successfully');
            return suggestion;
        } catch (error) {
            this.logger.error('Failed to get code completion', error as Error, { prompt, language, context });
            return undefined;
        }
    }

    async getCompletionHistory(language?: string): Promise<CodeCompletion[]> {
        try {
            return await this.codeCompletionRepository.getCompletionHistory(language);
        } catch (error) {
            this.logger.error('Failed to get completion history', error as Error, { language });
            throw error;
        }
    }

    async clearCompletionHistory(): Promise<void> {
        try {
            await this.codeCompletionRepository.clearCompletionHistory();
            this.logger.info('Completion history cleared');
        } catch (error) {
            this.logger.error('Failed to clear completion history', error as Error);
            throw error;
        }
    }
}
