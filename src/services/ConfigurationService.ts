import * as vscode from 'vscode';

export class ConfigurationService {
    private static instance: ConfigurationService;

    private constructor() { }

    public static getInstance(): ConfigurationService {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }

    private getConfig() {
        return vscode.workspace.getConfiguration('comware-omni-code');
    }

    public getApiUrl(): string {
        return this.getConfig().get<string>('apiUrl') || 'https://api.openai.com/v1/chat/completions';
    }

    public getApiKey(): string | undefined {
        return this.getConfig().get<string>('apiKey');
    }

    public getModel(): string {
        return this.getConfig().get<string>('model') || 'gpt-3.5-turbo';
    }

    public getMaxTokens(): number {
        return this.getConfig().get<number>('maxTokens') || 50;
    }

    public getTemperature(): number {
        return this.getConfig().get<number>('temperature') || 0.5;
    }
}
