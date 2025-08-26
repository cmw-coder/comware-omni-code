// 简单的依赖注入容器实现
type Constructor<T = {}> = new (...args: any[]) => T;
type ServiceFactory<T> = () => T;
type ServiceDefinition<T> = Constructor<T> | ServiceFactory<T> | T;

export class Container {
    private services = new Map<symbol, any>();
    private singletons = new Map<symbol, any>();

    /**
     * 注册服务
     */
    bind<T>(token: symbol, implementation: ServiceDefinition<T>, singleton: boolean = true): void {
        this.services.set(token, { implementation, singleton });
    }

    /**
     * 获取服务实例
     */
    get<T>(token: symbol): T {
        const serviceConfig = this.services.get(token);
        if (!serviceConfig) {
            throw new Error(`Service not found for token: ${token.toString()}`);
        }

        if (serviceConfig.singleton && this.singletons.has(token)) {
            return this.singletons.get(token);
        }

        let instance: T;
        const { implementation } = serviceConfig;

        if (typeof implementation === 'function' && implementation.prototype) {
            // Constructor function
            instance = new (implementation as Constructor<T>)();
        } else if (typeof implementation === 'function') {
            // Factory function
            instance = (implementation as ServiceFactory<T>)();
        } else {
            // Direct instance
            instance = implementation as T;
        }

        if (serviceConfig.singleton) {
            this.singletons.set(token, instance);
        }

        return instance;
    }

    /**
     * 检查服务是否已注册
     */
    has(token: symbol): boolean {
        return this.services.has(token);
    }

    /**
     * 移除服务
     */
    unbind(token: symbol): void {
        this.services.delete(token);
        this.singletons.delete(token);
    }

    /**
     * 清空容器
     */
    clear(): void {
        this.services.clear();
        this.singletons.clear();
    }
}

// 全局容器实例
export const container = new Container();
