/**
 * 本地存储模块
 */

const STORAGE_KEY = 'jifen-bubble-data';

/**
 * 保存数据到本地存储
 * @param {Object} data - 要存储的数据
 */
function saveData(data) {
    try {
        const jsonData = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, jsonData);
        console.log('数据保存成功');
        return true;
    } catch (error) {
        console.error('保存数据失败:', error);
        return false;
    }
}

/**
 * 从本地存储加载数据
 * @returns {Object|null} 存储的数据，如果不存在则返回null
 */
function loadData() {
    try {
        const jsonData = localStorage.getItem(STORAGE_KEY);
        if (jsonData) {
            const data = JSON.parse(jsonData);
            console.log('数据加载成功:', data);
            return data;
        }
        console.log('没有找到存储的数据');
        return null;
    } catch (error) {
        console.error('加载数据失败:', error);
        return null;
    }
}

/**
 * 清除本地存储的数据
 */
function clearData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('数据清除成功');
        return true;
    } catch (error) {
        console.error('清除数据失败:', error);
        return false;
    }
}

/**
 * 检查本地存储是否有数据
 * @returns {boolean} 是否有数据
 */
function hasData() {
    try {
        const jsonData = localStorage.getItem(STORAGE_KEY);
        return !!jsonData;
    } catch (error) {
        console.error('检查数据失败:', error);
        return false;
    }
}