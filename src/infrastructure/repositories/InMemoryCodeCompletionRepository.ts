import { injectable } from 'inversify';
import { ICodeCompletionRepository } from '../../core/interfaces/ICodeCompletionRepository';
import { CodeCompletion } from '../../domain/entities/CodeCompletion';

@injectable()
export class InMemoryCodeCompletionRepository implements ICodeCompletionRepository {
    private completions: CodeCompletion[] = [];

    async saveCompletion(completion: CodeCompletion): Promise<void> {
        this.completions.push(completion);
        
        // 保持最多1000条记录
        if (this.completions.length > 1000) {
            this.completions = this.completions.slice(-1000);
        }
    }

    async getCompletionHistory(language?: string): Promise<CodeCompletion[]> {
        if (language) {
            return this.completions.filter(completion => completion.language === language);
        }
        return [...this.completions];
    }

    async clearCompletionHistory(): Promise<void> {
        this.completions = [];
    }

    async getRecentCompletions(limit: number): Promise<CodeCompletion[]> {
        return this.completions
            .slice(-limit)
            .reverse(); // 最新的在前面
    }
}
