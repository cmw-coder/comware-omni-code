import { CodeCompletion } from '../../domain/entities/CodeCompletion';

export interface ICodeCompletionRepository {
    /**
     * 保存代码补全记录
     */
    saveCompletion(completion: CodeCompletion): Promise<void>;
    
    /**
     * 获取补全历史
     */
    getCompletionHistory(language?: string): Promise<CodeCompletion[]>;
    
    /**
     * 清空补全历史
     */
    clearCompletionHistory(): Promise<void>;
    
    /**
     * 获取最近的补全记录
     */
    getRecentCompletions(limit: number): Promise<CodeCompletion[]>;
}
