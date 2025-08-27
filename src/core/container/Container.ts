import 'reflect-metadata';
import { Container } from 'inversify';

// 创建全局容器实例
export const container = new Container();

// 重新导出Container类型以保持兼容性
export { Container } from 'inversify';
