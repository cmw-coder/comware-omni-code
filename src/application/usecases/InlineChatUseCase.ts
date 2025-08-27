import { injectable, inject } from 'inversify';
import { IInlineChatService } from '../../domain/services/InlineChatService';
import { ILogger } from '../../core/interfaces/ILogger';
import { TYPES } from '../../core/container/types';

export interface IInlineChatUseCase {
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
export class InlineChatUseCase implements IInlineChatUseCase {
    constructor(
        @inject(TYPES.InlineChatService) private inlineChatService: IInlineChatService,
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
        this.logger.info('Inline chat use case: processing request', {
            selectedText: selectedText.substring(0, 50) + '...',
            instruction: instruction.substring(0, 50) + '...',
            context
        });

        if (!selectedText.trim()) {
            throw new Error('Selected text cannot be empty');
        }

        if (!instruction.trim()) {
            throw new Error('Instruction cannot be empty');
        }

        return await this.inlineChatService.processInlineChat(selectedText, instruction, context);
    }
}
