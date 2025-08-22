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

// 新版内联聊天功能测试文件
// 使用 Ctrl+K Ctrl+I 在光标位置触发内联聊天

function calculateSum(a, b) {
    // 光标放在这里，然后按 Ctrl+K Ctrl+I 尝试内联聊天
    // 例如可以询问："添加参数验证"
    return a + b;
}

class UserManager {
    constructor() {
        this.users = [];
    }
    
    // 选中下面的方法，然后使用内联聊天请求重构
    addUser(name, email) {
        this.users.push({name, email});
    }
}

// 示例使用场景：
// 1. 在空行位置按 Ctrl+K Ctrl+I，询问 "生成一个数据验证函数"
// 2. 选中某段代码，按 Ctrl+K Ctrl+I，询问 "优化这段代码"
// 3. 在注释行按 Ctrl+K Ctrl+I，询问 "解释这段代码的作用"

console.log("内联聊天功能测试");

