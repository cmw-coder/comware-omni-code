// 测试文件 - 用于验证 Comware Omni Code 扩展功能
// 在这个文件中测试各种功能

// 1. 测试内联补全
// 尝试输入以下代码片段，观察补全建议：

function calculateArea(radius) {
    // 在这里输入 "return Math." 看看补全建议
}

const users = [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 }
];

// 2. 测试代码编辑功能
// 选择下面的函数，使用右键菜单 "Edit Code with AI"
// 或在聊天面板的编辑模式中请求修改
function findUser(name) {
    return users.find(user => user.name === name);
}

// 3. 在聊天面板中可以问的问题示例：
// - "如何优化这个findUser函数？"
// - "解释一下这段代码的作用"
// - "帮我写一个排序函数"

// 4. Agent模式任务示例：
// - "帮我设计一个用户管理系统的架构"
// - "创建一个简单的API客户端"
// - "构建一个表单验证功能"

export { calculateArea, findUser, users };
