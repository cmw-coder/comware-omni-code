import { CompletionRequest, CompletionResponse } from '../types';
import { ConfigurationService } from './ConfigurationService';

export class OpenAIClient {
    private configService: ConfigurationService;
    private apiUrl: string;
    private apiKey: string;

    constructor() {
        this.configService = ConfigurationService.getInstance();
        const apiKey = this.configService.getApiKey();
        this.apiUrl = this.configService.getApiUrl();

        if (!apiKey) {
            throw new Error('OpenAI API key not found. Please set it in the settings.');
        }
        
        this.apiKey = apiKey;
    }

    public async getCompletion(prompt: string): Promise<string | undefined> {
        try {
            const request: CompletionRequest = {
                model: this.configService.getModel(),
                prompt: prompt,
                max_tokens: this.configService.getMaxTokens(),
                temperature: this.configService.getTemperature(),
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as CompletionResponse;

            if (data.choices && data.choices.length > 0) {
                return data.choices[0].text;
            }
        } catch (error) {
            console.error('Error getting completion from OpenAI:', error);
        }
        return undefined;
    }
}
