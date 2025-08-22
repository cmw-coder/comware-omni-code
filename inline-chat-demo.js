// Comware Omni Code - Inline Chat Demo
// 这个文件用于演示和测试 inline chat 功能

/**
 * 演示函数 1: 计算数组总和
 * 这个函数需要重构以提高性能
 */
function calculateSum(numbers) {
    let sum = 0;
    for (let i = 0; i < numbers.length; i++) {
        sum = sum + numbers[i];
    }
    return sum;
}

/**
 * 演示函数 2: 用户数据处理
 * 这个函数缺少错误处理
 */
function processUserData(userData) {
    const name = userData.name.trim();
    const email = userData.email.toLowerCase();
    const age = parseInt(userData.age);
    
    return {
        name: name,
        email: email,
        age: age,
        isAdult: age >= 18
    };
}

/**
 * 演示函数 3: 排序算法
 * 这个冒泡排序需要优化
 */
function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}

/**
 * 演示函数 4: API请求
 * 需要添加异步处理和错误处理
 */
function fetchUserData(userId) {
    const url = `https://api.example.com/users/${userId}`;
    // 这里需要实现HTTP请求逻辑
}

/**
 * 演示类: 待优化的购物车
 * 这个类需要改进设计模式
 */
class ShoppingCart {
    constructor() {
        this.items = [];
        this.total = 0;
    }
    
    addItem(item) {
        this.items.push(item);
        this.total += item.price;
    }
    
    removeItem(itemId) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === itemId) {
                this.total -= this.items[i].price;
                this.items.splice(i, 1);
                break;
            }
        }
    }
    
    getTotal() {
        return this.total;
    }
}

// 测试数据
const testArray = [64, 34, 25, 12, 22, 11, 90];
const testUser = {
    name: "  John Doe  ",
    email: "JOHN@EXAMPLE.COM",
    age: "25"
};

// 复杂的正则表达式 - 需要解释
const complexRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// TODO: 使用 inline chat 功能来：
// 1. 重构 calculateSum 函数使用现代 JavaScript
// 2. 为 processUserData 添加错误处理
// 3. 优化 bubbleSort 算法
// 4. 实现 fetchUserData 函数
// 5. 改进 ShoppingCart 类设计
// 6. 解释 complexRegex 的作用
// 7. 生成相应的单元测试

/*
 * Inline Chat 测试指南:
 * 
 * 🎯 真正的 Inline Chat 体验 (类似 GitHub Copilot):
 * 
 * 1. 选中任意函数，按 Ctrl+K Ctrl+I
 *    - 会在代码行之间插入输入框："💬 Ask AI: "
 *    - 直接在输入框中输入: "重构这个函数使其更现代化"
 *    - 按 Enter 提交
 * 
 * 2. 选中 complexRegex，按 Ctrl+K Ctrl+I
 *    - 输入: "解释这个正则表达式"
 *    - AI 会直接在代码中显示解释
 * 
 * 3. 在空行处，按 Ctrl+K Ctrl+I
 *    - 输入: "创建一个日期格式化函数"
 *    - AI 会在当前位置插入生成的代码
 * 
 * 4. 选中 ShoppingCart 类，按 Ctrl+K Ctrl+I
 *    - 输入: "使用现代ES6+语法重写"
 *    - 选择 Accept/Reject/Preview 来处理建议
 * 
 * 5. 选中 processUserData，按 Ctrl+K Ctrl+I
 *    - 输入: "添加输入验证和错误处理"
 *    - 代码建议会直接显示在下方
 * 
 * 💡 特性:
 * - 真正的 inline 输入框 (不再使用 VS Code 顶部输入框)
 * - 代码建议直接在编辑器中显示
 * - 智能检测代码 vs 文本响应
 * - Tab 接受建议，Esc 拒绝
 * - 自动清理临时内容
 * 
 * 🚀 也可以右键点击代码选择 "Start Inline Chat" 或使用命令面板
 */
