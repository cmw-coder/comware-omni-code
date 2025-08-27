import { ChatMessage, CompletionRequest, CompletionResponse } from '../../types';

export interface TestScriptRequest {
    query: string;
    conftest: string;
    topox: string;
    beforeScript: string;
}

export interface IAIClient {
    /**
     * 获取代码补全建议
     */
    getCompletion(prompt: string): Promise<string | undefined>;
    
    /**
     * 获取聊天响应
     */
    getChatResponse(messages: ChatMessage[]): Promise<string | undefined>;
    
    /**
     * 获取代码编辑建议
     */
    getCodeEditSuggestion(code: string, instruction: string): Promise<string | undefined>;
    
    /**
     * 生成测试脚本
     */
    generateTestScript(request: TestScriptRequest): Promise<string | undefined>;
    
    /**
     * 检查客户端健康状态
     */
    isHealthy(): Promise<boolean>;
}
