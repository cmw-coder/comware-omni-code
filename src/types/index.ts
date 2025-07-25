export interface CompletionRequest {
  model: string;
  prompt: string;
  max_tokens: number;
  temperature: number;
  stop?: string | string[];
}

export interface CompletionResponse {
  choices: {
    text: string;
  }[];
}
