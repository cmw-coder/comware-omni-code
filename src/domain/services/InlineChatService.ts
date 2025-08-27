import { injectable, inject } from 'inversify';
import { IAIClient } from '../../core/interfaces/IAIClient';
import { ILogger } from '../../core/interfaces/ILogger';
import { TYPES } from '../../core/container/types';

export interface IInlineChatService {
    processInlineChat(
        selectedText: string,
        instruction: string,
        context: {
            fileName: string;
            language: string;
            surroundingCode?: string;
        }
    ): Promise<string | undefined>;
}

@injectable()
export class InlineChatService implements IInlineChatService {
    constructor(
        @inject(TYPES.AIClient) private aiClient: IAIClient,
        @inject(TYPES.Logger) private logger: ILogger
    ) {}

    async processInlineChat(
        selectedText: string,
        instruction: string,
        context: {
            fileName: string;
            language: string;
            surroundingCode?: string;
        }
    ): Promise<string | undefined> {
        try {
            this.logger.info('Processing inline chat request', { 
                selectedText: selectedText.substring(0, 100) + '...', 
                instruction, 
                context 
            });

            // 构建上下文提示
            let contextPrompt = `File: ${context.fileName}\nLanguage: ${context.language}\n\n`;
            
            if (context.surroundingCode) {
                contextPrompt += `Surrounding code:\n${context.surroundingCode}\n\n`;
            }
            
            contextPrompt += `Selected code:\n${selectedText}\n\n`;
            contextPrompt += `Instruction: ${instruction}\n\n`;
            contextPrompt += 'Please provide the modified code based on the instruction. Return only the code that should replace the selected text.';

            const suggestion = await this.aiClient.getCodeEditSuggestion(selectedText, contextPrompt);
            
            if (!suggestion) {
                this.logger.warn('No inline chat suggestion received');
                return undefined;
            }

            this.logger.info('Inline chat processed successfully');
            return suggestion;
        } catch (error) {
            this.logger.error('Failed to process inline chat', error as Error, { 
                selectedText: selectedText.substring(0, 100) + '...', 
                instruction, 
                context 
            });
            return undefined;
        }
    }
}
