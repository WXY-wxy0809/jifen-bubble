/**
 * Excel解析和积分计算模块
 * 适配新的Excel格式：第一列是任务，后面的列是产品
 */

/**
 * 解析Excel文件
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} 解析后的原始数据
 */
function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log('解析到的原始数据（二维数组）:', jsonData);
                resolve(jsonData);
            } catch (error) {
                console.error('解析Excel错误:', error);
                reject(new Error('解析Excel文件失败: ' + error.message));
            }
        };
        reader.onerror = function(e) {
            reject(new Error('读取文件失败'));
        };
        reader.readAsArrayBuffer(file);
    });
}

/**
 * 处理二维数组格式的Excel数据并计算积分
 * @param {Array} data - 从Excel解析的二维数组数据
 * @returns {Object} 处理后的数据，包含users和products
 */
function processData(data) {
    const users = {};
    const products = {};
    
    console.log('开始处理二维数组数据:', data);
    
    // 检查数据是否有效
    if (!Array.isArray(data) || data.length < 2) {
        console.log('数据无效或行数不足');
        return { users: [], products: [] };
    }
    
    // 第一行是表头
    const headers = data[0];
    console.log('表头:', headers);
    
    // 第一列是任务，后面的列是产品
    if (headers.length < 2) {
        console.log('列数不足');
        return { users: [], products: [] };
    }
    
    // 初始化产品对象
    for (let i = 1; i < headers.length; i++) {
        const productName = headers[i];
        if (productName && productName.trim()) {
            products[productName] = {
                name: productName,
                tasks: [],
                totalScore: 0
            };
        }
    }
    
    console.log('初始化的产品:', products);
    
    // 处理每一行数据（从第二行开始）
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row || row.length === 0) {
            console.log('跳过空行，行号:', rowIndex);
            continue;
        }
        
        // 第一列是任务名称
        const taskName = row[0];
        if (!taskName || !taskName.trim()) {
            console.log('跳过没有任务名称的行，行号:', rowIndex);
            continue;
        }
        
        console.log('处理任务:', taskName);
        
        // 处理每个产品列
        for (let colIndex = 1; colIndex < headers.length; colIndex++) {
            const productName = headers[colIndex];
            if (!productName || !productName.trim()) {
                continue;
            }
            
            // 获取该单元格的参与人员
            const participantsStr = row[colIndex];
            
            // 处理特殊情况：
            // 1. 如果单元格为"\"，表示无此项任务，跳过
            // 2. 如果单元格为空或只有空格，表示任务未完成，需要处理
            if (participantsStr === '\\') {
                console.log('  无此项任务，跳过');
                continue;
            }
            
            // 空格表示任务未完成，不跳过
            
            console.log('  产品:', productName, '参与人员:', participantsStr);
            
            // 解析参与人员（支持逗号、空格、顿号分隔）
            let participants = [];
            if (typeof participantsStr === 'string') {
                participants = participantsStr
                    .split(/[,、，\s]+/)
                    .map(p => p.trim())
                    .filter(p => p);
            }
            
            // 处理空格情况（任务未完成）
            if (participants.length === 0) {
                console.log('  任务未完成（空格），记录任务但不计积分');
                // 记录任务到产品中，但积分为0
                if (products[productName]) {
                    const taskData = {
                        name: taskName,
                        participants: [],
                        score: 0,
                        completed: false
                    };
                    products[productName].tasks.push(taskData);
                    // 任务未完成，不增加积分
                }
                continue;
            }
            
            // 计算积分（任务已完成）
            const taskScore = 10; // 每个任务10积分
            const perPersonScore = taskScore / participants.length;
            
            console.log('  积分计算: 总积分', taskScore, '每人', perPersonScore);
            
            // 更新产品数据
            if (products[productName]) {
                const taskData = {
                    name: taskName,
                    participants: participants,
                    score: taskScore,
                    completed: true
                };
                products[productName].tasks.push(taskData);
                products[productName].totalScore += taskScore;
            }
            
            // 更新用户数据
            participants.forEach(name => {
                if (!users[name]) {
                    users[name] = {
                        name: name,
                        tasks: [],
                        totalScore: 0
                    };
                }
                
                users[name].tasks.push({
                    product: productName,
                    task: taskName,
                    score: perPersonScore
                });
                users[name].totalScore += perPersonScore;
            });
        }
    }
    
    // 计算每个产品的完成度
    Object.values(products).forEach(product => {
        const totalTasks = product.tasks.length;
        const completedTasks = product.tasks.filter(task => task.completed).length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        product.completionRate = Math.round(completionRate);
        product.totalTasks = totalTasks;
        product.completedTasks = completedTasks;
    });
    
    const result = {
        users: Object.values(users),
        products: Object.values(products)
    };
    
    console.log('处理完成，最终数据:', result);
    return result;
}

/**
 * 验证Excel数据格式（二维数组格式）
 * @param {Array} data - 从Excel解析的二维数组数据
 * @returns {Object} 验证结果
 */
function validateExcelData(data) {
    console.log('验证二维数组数据:', data);
    
    if (!Array.isArray(data) || data.length === 0) {
        return {
            valid: false,
            message: 'Excel文件为空或格式不正确'
        };
    }
    
    if (data.length < 2) {
        return {
            valid: false,
            message: 'Excel文件至少需要两行数据（表头 + 数据）'
        };
    }
    
    const headers = data[0];
    if (!Array.isArray(headers) || headers.length < 2) {
        return {
            valid: false,
            message: 'Excel文件至少需要两列（任务 + 至少一个产品）'
        };
    }
    
    // 检查是否有任务列
    const taskColumn = headers[0];
    if (!taskColumn) {
        return {
            valid: false,
            message: '第一列应该是任务列'
        };
    }
    
    // 检查是否有产品列
    let hasProductColumn = false;
    for (let i = 1; i < headers.length; i++) {
        if (headers[i] && headers[i].trim()) {
            hasProductColumn = true;
            break;
        }
    }
    
    if (!hasProductColumn) {
        return {
            valid: false,
            message: 'Excel文件需要至少一个产品列'
        };
    }
    
    return {
        valid: true,
        message: 'Excel数据格式正确'
    };
}