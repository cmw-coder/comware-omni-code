export interface IConfigurationService {
    /**
     * 获取API URL
     */
    getApiUrl(): string;
    
    /**
     * 获取API密钥
     */
    getApiKey(): string | undefined;
    
    /**
     * 获取模型名称
     */
    getModel(): string;
    
    /**
     * 获取最大令牌数
     */
    getMaxTokens(): number;
    
    /**
     * 获取温度参数
     */
    getTemperature(): number;
    
    /**
     * 更新配置
     */
    updateConfiguration(key: string, value: any): Promise<void>;
    
    /**
     * 验证配置是否有效
     */
    validateConfiguration(): boolean;
}
