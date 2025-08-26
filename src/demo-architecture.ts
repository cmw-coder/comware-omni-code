import { configureDependencies } from './core/container/containerConfig';
import { container } from './core/container/Container';
import { TYPES } from './core/container/types';
import { IChatUseCase } from './application/usecases/ChatUseCase';
import { ICodeCompletionUseCase } from './application/usecases/CodeCompletionUseCase';
import { ILogger } from './core/interfaces/ILogger';

/**
 * 演示新架构的功能
 * 这个脚本可以用来验证依赖注入和各层之间的协作
 */
async function demonstrateArchitecture() {
    console.log('🚀 开始演示新架构...\n');

    try {
        // 配置依赖注入
        configureDependencies();
        console.log('✅ 依赖注入配置完成');

        // 获取服务实例
        const logger = container.get<ILogger>(TYPES.Logger);
        const chatUseCase = container.get<IChatUseCase>(TYPES.ChatUseCase);
        const codeCompletionUseCase = container.get<ICodeCompletionUseCase>(TYPES.CodeCompletionUseCase);

        console.log('✅ 服务实例获取成功');

        // 演示日志功能
        console.log('\n📝 演示日志功能:');
        logger.info('这是一条信息日志');
        logger.warn('这是一条警告日志', { demo: true });
        logger.debug('这是一条调试日志');

        // 演示聊天功能（模拟）
        console.log('\n💬 演示聊天功能:');
        try {
            const sessionId = await chatUseCase.createNewSession();
            console.log(`📱 创建聊天会话: ${sessionId}`);
            
            // 注意：这里会因为没有真实的API密钥而失败，但展示了架构流程
            console.log('💡 正在发送消息...');
            // const response = await chatUseCase.sendMessage('Hello!', sessionId);
            console.log('⚠️  需要配置真实的API密钥才能测试聊天功能');
        } catch (error) {
            console.log(`⚠️  聊天功能测试: ${(error as Error).message}`);
        }

        // 演示代码补全功能（模拟）
        console.log('\n🔧 演示代码补全功能:');
        try {
            console.log('💡 正在获取代码补全...');
            // const completion = await codeCompletionUseCase.getCompletion(
            //     'function hello',
            //     'typescript'
            // );
            console.log('⚠️  需要配置真实的API密钥才能测试代码补全功能');
        } catch (error) {
            console.log(`⚠️  代码补全功能测试: ${(error as Error).message}`);
        }

        // 演示历史记录功能
        console.log('\n📚 演示历史记录功能:');
        const chatHistory = await chatUseCase.getChatHistory();
        const completionHistory = await codeCompletionUseCase.getCompletionHistory();
        console.log(`📝 聊天历史记录数量: ${chatHistory.length}`);
        console.log(`🔧 补全历史记录数量: ${completionHistory.length}`);

        console.log('\n🎉 架构演示完成！');
        console.log('\n📋 架构优势总结:');
        console.log('   ✨ 清晰的分层结构');
        console.log('   🔄 依赖注入管理');
        console.log('   🧪 易于测试');
        console.log('   📈 易于扩展');
        console.log('   🛡️  类型安全');

    } catch (error) {
        console.error('❌ 演示过程中出现错误:', error);
    }
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
    demonstrateArchitecture();
}

export { demonstrateArchitecture };
