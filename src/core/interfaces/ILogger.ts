export interface ILogger {
    /**
     * 记录信息日志
     */
    info(message: string, meta?: any): void;
    
    /**
     * 记录警告日志
     */
    warn(message: string, meta?: any): void;
    
    /**
     * 记录错误日志
     */
    error(message: string, error?: Error, meta?: any): void;
    
    /**
     * 记录调试日志
     */
    debug(message: string, meta?: any): void;
}
