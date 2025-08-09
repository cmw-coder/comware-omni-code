export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
  stop?: string | string[];
}

export interface CompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}
