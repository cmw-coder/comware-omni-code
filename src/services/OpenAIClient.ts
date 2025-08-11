import { CompletionRequest, CompletionResponse, ChatMessage } from '../types';
import { ConfigurationService } from './ConfigurationService';

export class OpenAIClient {
    private configService: ConfigurationService;

    constructor() {
        this.configService = ConfigurationService.getInstance();
    }

    public async getCompletion(prompt: string): Promise<string | undefined> {
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

            const data = await response.json() as CompletionResponse;

            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }
        } catch (error) {
            console.error('Error getting completion from OpenAI:', error);
        }
        return undefined;
    }
}
