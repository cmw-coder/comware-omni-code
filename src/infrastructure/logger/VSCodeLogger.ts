import { injectable } from 'inversify';
import { ILogger } from '../../core/interfaces/ILogger';

@injectable()
export class VSCodeLogger implements ILogger {
    private outputChannel = require('vscode').window.createOutputChannel('Comware Omni Code');

    info(message: string, meta?: any): void {
        const logMessage = this.formatMessage('INFO', message, meta);
        console.log(logMessage);
        this.outputChannel.appendLine(logMessage);
    }

    warn(message: string, meta?: any): void {
        const logMessage = this.formatMessage('WARN', message, meta);
        console.warn(logMessage);
        this.outputChannel.appendLine(logMessage);
    }

    error(message: string, error?: Error, meta?: any): void {
        const logMessage = this.formatMessage('ERROR', message, meta);
        const errorDetails = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
        const fullMessage = logMessage + errorDetails;
        
        console.error(fullMessage);
        this.outputChannel.appendLine(fullMessage);
    }

    debug(message: string, meta?: any): void {
        if (process.env.NODE_ENV === 'development') {
            const logMessage = this.formatMessage('DEBUG', message, meta);
            console.debug(logMessage);
            this.outputChannel.appendLine(logMessage);
        }
    }

    private formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }
}
