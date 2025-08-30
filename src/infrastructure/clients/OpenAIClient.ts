import { injectable, inject } from 'inversify';
import { IAIClient, TestScriptRequest } from '../../core/interfaces/IAIClient';
import { IConfigurationService } from '../../core/interfaces/IConfigurationService';
import { ILogger } from '../../core/interfaces/ILogger';
import { ChatMessage, CompletionRequest, CompletionResponse } from '../../types';
import { TYPES } from '../../core/container/types';

@injectable()
export class OpenAIClient implements IAIClient {
    constructor(
        @inject(TYPES.ConfigurationService) private configService: IConfigurationService,
        @inject(TYPES.Logger) private logger: ILogger
    ) { }

    async getCompletion(prompt: string): Promise<string | undefined> {
        try {
            const messages: ChatMessage[] = [
                {
                    role: 'system',
                    content: 'You are a code completion assistant. Complete the given code snippet with the most likely continuation. Provide only the completion part, not the entire code. Keep it concise and relevant to the context.'
                },
                {
                    role: 'user',
                    content: `Please complete this code. Only provide the completion part that should come next:\n\n${prompt}`
                }
            ];

            const response = await this.makeRequest(messages);
            return response?.choices?.[0]?.message?.content?.trim();
        } catch (error) {
            this.logger.error('Failed to get completion', error as Error, { prompt });
            return undefined;
        }
    }

    async getChatResponse(messages: ChatMessage[]): Promise<string | undefined> {
        try {
            const response = await this.makeRequest(messages);
            return response?.choices?.[0]?.message?.content?.trim();
        } catch (error) {
            this.logger.error('Failed to get chat response', error as Error, { messageCount: messages.length });
            return undefined;
        }
    }

    async getCodeEditSuggestion(code: string, instruction: string): Promise<string | undefined> {
        try {
            const messages: ChatMessage[] = [
                {
                    role: 'system',
                    content: 'You are a code editing assistant. Modify the given code according to the instruction. Return only the modified code without explanations.'
                },
                {
                    role: 'user',
                    content: instruction
                }
            ];

            const response = await this.makeRequest(messages);
            return response?.choices?.[0]?.message?.content?.trim();
        } catch (error) {
            this.logger.error('Failed to get code edit suggestion', error as Error, { instruction });
            return undefined;
        }
    }

    async generateTestScript(request: TestScriptRequest): Promise<string | undefined> {
        try {
            this.logger.info('[OpenAIClient] Generating test script with external API', {
                query: request.query.substring(0, 50) + '...',
                conftest: request.conftest.length > 0 ? 'provided' : 'empty',
                topox: request.topox.length > 0 ? 'provided' : 'empty',
                beforeScript: request.beforeScript.length > 0 ? 'provided' : 'empty'
            });

            const response = await fetch('http://10.114.138.73:9070/sendpy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: request.query,
                    conftest: request.conftest,
                    topox: request.topox,
                    beforeScript: request.beforeScript
                })
            });

            if (!response.ok || !response.body) {
                const errorBody = await response.json()
                throw new Error(`[OpenAIClient] HTTP error, status: ${response.status} ${response.statusText}, details: ${JSON.stringify(errorBody)}`);
            }

            this.logger.info('[OpenAIClient] Streaming answer started', { status: response.status })

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let fullAnswer = ''
            let finished = false

            try {
                while (!finished) {
                    const { done, value } = await reader.read()
                    if (done) {
                        break
                    }

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        const trimmedLine = line.trim()
                        this.logger.info('[OpenAIClient] Received line:', trimmedLine)
                        fullAnswer += trimmedLine + '\n'
                    }
                }
            } finally {
                reader.releaseLock()
            }

            // const result = await response.json() as { content?: string };
            // if (result && typeof result.content === 'string') {
            //     this.logger.info('Test script generated successfully');
            //     return result.content;
            // } else {
            //     throw new Error('Invalid response format from test script API');
            // }
            return fullAnswer;
        } catch (error) {
            this.logger.raw(error);
            return undefined;
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            const testMessage: ChatMessage[] = [
                {
                    role: 'user',
                    content: 'Hello'
                }
            ];

            const response = await this.makeRequest(testMessage);
            return !!response?.choices?.[0]?.message?.content;
        } catch (error) {
            this.logger.error('Health check failed', error as Error);
            return false;
        }
    }

    private async makeRequest(messages: ChatMessage[]): Promise<CompletionResponse | undefined> {
        const request: CompletionRequest = {
            model: this.configService.getModel(),
            messages: messages,
            max_tokens: this.configService.getMaxTokens(),
            temperature: this.configService.getTemperature(),
        };

        const apiKey = this.configService.getApiKey();
        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please set it in the settings.');
        }

        const response = await fetch(this.configService.getApiUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        return await response.json() as CompletionResponse;
    }
}
