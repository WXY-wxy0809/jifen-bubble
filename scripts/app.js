/**
 * 主应用逻辑
 */

// 全局变量
let currentView = 'person'; // 默认视图：按人员
let currentData = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');
    
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    
    // 判断是哪个页面
    if (filename === 'index.html' || filename === '') {
        initUploadPage();
    } else if (filename === 'chart.html') {
        initChartPage();
    }
});

/**
 * 初始化上传页面
 */
function initUploadPage() {
    console.log('初始化上传页面');
    
    const uploadBtn = document.getElementById('upload-btn');
    const excelFile = document.getElementById('excel-file');
    const uploadStatus = document.getElementById('upload-status');
    const fileName = document.getElementById('file-name');
    const dropZone = document.getElementById('drop-zone');
    
    // 文件选择事件
    excelFile.addEventListener('change', function(e) {
        if (this.files && this.files.length > 0) {
            fileName.textContent = this.files[0].name;
            fileName.classList.add('selected');
        } else {
            fileName.textContent = '未选择文件';
            fileName.classList.remove('selected');
        }
    });
    
    // 拖拽事件
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                excelFile.files = e.dataTransfer.files;
                fileName.textContent = e.dataTransfer.files[0].name;
                fileName.classList.add('selected');
            }
        });
    }
    
    // 上传按钮事件
    uploadBtn.addEventListener('click', function() {
        console.log('上传按钮被点击');
        
        if (!excelFile.files || excelFile.files.length === 0) {
            showStatus(uploadStatus, '请选择Excel文件', 'error');
            return;
        }
        
        const file = excelFile.files[0];
        console.log('选择的文件:', file);
        
        showStatus(uploadStatus, '正在解析文件...', 'info');
        
        // 解析Excel文件
        parseExcel(file)
            .then(originalData => {
                console.log('Excel原始数据解析成功:', originalData);
                
                // 验证数据
                const validation = validateExcelData(originalData);
                console.log('数据验证结果:', validation);
                
                if (!validation.valid) {
                    throw new Error(validation.message);
                }
                
                // 处理数据
                const processedData = processData(originalData);
                console.log('数据处理完成:', processedData);
                
                // 检查是否有有效数据
                if (processedData.users.length === 0 && processedData.products.length === 0) {
                    throw new Error('Excel文件中没有有效的数据');
                }
                
                // 保存数据到本地存储
                if (saveData(processedData)) {
                    // 展示产品完成度
                    showProductCompletion(processedData.products);
                    
                    showStatus(uploadStatus, '文件解析成功！请查看产品完成度', 'success');
                } else {
                    throw new Error('保存数据失败');
                }
            })
            .catch(error => {
                console.error('上传错误:', error);
                showStatus(uploadStatus, '错误: ' + error.message, 'error');
            });
    });
    
    // 查看图表按钮事件
    const viewChartBtn = document.getElementById('view-chart-btn');
    if (viewChartBtn) {
        viewChartBtn.addEventListener('click', function() {
            console.log('查看图表按钮被点击');
            window.location.href = 'chart.html';
        });
    }
}

/**
 * 初始化图表页面
 */
function initChartPage() {
    console.log('初始化图表页面');
    
    // 检查是否有数据
    if (!hasData()) {
        console.log('没有数据，跳转到上传页面');
        window.location.href = 'index.html';
        return;
    }
    
    // 加载数据
    const data = loadData();
    if (data) {
        currentData = data;
        
        // 更新统计数据
        updateStats(data);
        
        // 渲染图表
        renderChart();
    }
    
    // 返回按钮
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }
    
    // 重新上传按钮
    const reuploadBtn = document.getElementById('reupload-btn');
    if (reuploadBtn) {
        reuploadBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // 视图切换按钮
    const personViewBtn = document.getElementById('person-view');
    const productViewBtn = document.getElementById('product-view');
    
    if (personViewBtn && productViewBtn) {
        personViewBtn.addEventListener('click', function() {
            console.log('切换到人员视图');
            currentView = 'person';
            personViewBtn.classList.add('active');
            productViewBtn.classList.remove('active');
            renderChart();
        });
        
        productViewBtn.addEventListener('click', function() {
            console.log('切换到产品视图');
            currentView = 'product';
            productViewBtn.classList.add('active');
            personViewBtn.classList.remove('active');
            renderChart();
        });
    }
}

/**
 * 更新统计数据
 */
function updateStats(data) {
    const peopleCountEl = document.getElementById('people-count');
    const productCountEl = document.getElementById('product-count');
    const totalScoreEl = document.getElementById('total-score');
    
    if (peopleCountEl) {
        peopleCountEl.textContent = data.users ? data.users.length : 0;
    }
    
    if (productCountEl) {
        productCountEl.textContent = data.products ? data.products.length : 0;
    }
    
    if (totalScoreEl) {
        let totalScore = 0;
        if (data.products) {
            data.products.forEach(product => {
                totalScore += product.totalScore;
            });
        }
        totalScoreEl.textContent = totalScore;
    }
}

/**
 * 渲染图表
 */
function renderChart() {
    console.log('渲染图表，当前视图:', currentView, '数据:', currentData);
    
    if (!currentData) {
        console.log('没有数据可渲染');
        return;
    }
    
    // 隐藏提示信息
    const chartInfo = document.getElementById('chart-info');
    if (chartInfo) {
        chartInfo.style.display = 'none';
    }
    
    clearChart();
    
    if (currentView === 'person') {
        if (currentData.users && currentData.users.length > 0) {
            renderPersonBubbleChart(currentData.users);
        } else {
            console.log('没有人员数据');
            if (chartInfo) {
                chartInfo.style.display = 'flex';
            }
        }
    } else if (currentView === 'product') {
        if (currentData.products && currentData.products.length > 0) {
            renderProductBubbleChart(currentData.products);
        } else {
            console.log('没有产品数据');
            if (chartInfo) {
                chartInfo.style.display = 'flex';
            }
        }
    }
}

/**
 * 显示状态消息
 */
function showStatus(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.classList.remove('error', 'success', 'info');
    element.classList.add(type);
}

/**
 * 展示产品完成度
 */
function showProductCompletion(products) {
    const completionSection = document.getElementById('completion-section');
    const completionContent = document.getElementById('completion-content');
    
    if (!completionSection || !completionContent) return;
    
    // 清空内容
    completionContent.innerHTML = '';
    
    // 按完成度排序
    const sortedProducts = [...products].sort((a, b) => b.completionRate - a.completionRate);
    
    // 生成产品完成度卡片
    sortedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-completion-card';
        
        productCard.innerHTML = `
            <div class="product-info">
                <h5 class="product-name">${product.name}</h5>
                <div class="product-stats">
                    <span>${product.completedTasks}/${product.totalTasks} 任务</span>
                    <span class="completion-percent">${product.completionRate}%</span>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${product.completionRate}%; background-color: ${getCompletionColor(product.completionRate)}"></div>
            </div>
        `;
        
        completionContent.appendChild(productCard);
    });
    
    // 显示完成度区域
    completionSection.style.display = 'block';
}

/**
 * 根据完成度获取颜色
 */
function getCompletionColor(completionRate) {
    if (completionRate >= 90) return '#28a745'; // 绿色
    if (completionRate >= 70) return '#ffc107'; // 黄色
    if (completionRate >= 40) return '#fd7e14'; // 橙色
    return '#dc3545'; // 红色
}