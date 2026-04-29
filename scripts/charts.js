/**
 * 图表渲染模块 - 立体粒子气泡图
 */

let particleGarden = null;
let scoreTooltip = null;

class ParticleGarden {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.particles = [];
        this.mainParticles = [];
        this.data = [];
        this.type = 'person';
        this.lastTimestamp = null;
        this.resizeTimer = null;
        this.TOP_MARGIN = 0;
        this.BOUNCE_E = 1.0;
        this.COLLISION_ITER = 6;
        this.MAX_DT = 0.025;
        this.MAIN_SPEED_RANGE = 38;
        this.BG_SPEED_RANGE = 55;
        // 更丰富鲜艳的颜色池 - 明亮、高饱和度的五颜六色
        this.dotColors = [
            '#FF6B6B', '#FECB6E', '#4ECDC4', '#FF9FF3', '#A8E6CF', 
            '#FF8A5C', '#6C5CE7', '#00CEC9', '#FFB8B8', '#B8E4F0',
            '#FFD93D', '#95E77E', '#FF9F43', '#54A0FF', '#5F27CD',
            '#FF6B8B', '#45B7D1', '#96CEB4', '#FECA57', '#00D2D3',
            '#E056A6', '#24A19C', '#F8D35C', '#6A89CC', '#F9A26C'
        ];
        this.bgDotsCount = 120;
    }

    generateSphereGradient(baseColor) {
        // 明亮清新的渐变效果，减少暗色调
        return `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9), ${baseColor} 55%, ${baseColor} 100%)`;
    }

    /**
     * 计算最佳字体大小 - 优先使用较大字体，通过换行适应气泡
     * @param {string} text 文字内容
     * @param {number} bubbleSize 气泡大小(px)
     * @returns {Object} 包含字体大小和换行策略的对象
     */
    calculateOptimalTextStyle(text, bubbleSize) {
        if (!text || text.length === 0) {
            return { fontSize: Math.max(14, bubbleSize * 0.2), lines: 1, needsWrap: false };
        }
        
        const textLen = text.length;
        // 目标：让文字尽可能大，通过换行来适应气泡
        // 根据文字长度估算最佳行数
        let targetLines = 1;
        
        if (textLen <= 4) {
            targetLines = 1;
        } else if (textLen <= 8) {
            targetLines = 2;
        } else if (textLen <= 12) {
            targetLines = 2;
        } else {
            targetLines = Math.min(3, Math.ceil(textLen / 6));
        }
        
        // 根据行数计算字体大小（每行高度约为字体大小的1.2倍）
        const maxHeight = bubbleSize * 0.8; // 文字区域占气泡的80%高度
        const lineHeightRatio = 1.2;
        let fontSize = Math.floor(maxHeight / (targetLines * lineHeightRatio));
        
        // 同时考虑宽度限制（每行最多显示字符数）
        const maxWidth = bubbleSize * 0.85; // 文字区域占气泡85%宽度
        // 中文字符宽度约等于字体大小，英文约0.5倍
        const avgCharWidth = fontSize * 0.8;
        const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
        
        // 如果每行字符数不够，增加行数
        let needsWrap = true;
        let actualLines = targetLines;
        let wrapSegments = [];
        
        if (textLen <= maxCharsPerLine) {
            // 一行就能显示完，使用大字体
            needsWrap = false;
            fontSize = Math.min(32, Math.floor(maxHeight / lineHeightRatio));
            actualLines = 1;
        } else {
            // 需要多行，计算每行放多少字
            const charsPerLine = Math.min(maxCharsPerLine, Math.ceil(textLen / targetLines));
            // 重新计算行数
            actualLines = Math.ceil(textLen / charsPerLine);
            actualLines = Math.min(actualLines, 4); // 最多4行
            
            // 重新计算字体大小
            fontSize = Math.floor(maxHeight / (actualLines * lineHeightRatio));
            
            // 生成换行位置
            for (let i = 0; i < actualLines; i++) {
                const start = i * charsPerLine;
                const end = Math.min(start + charsPerLine, textLen);
                wrapSegments.push(text.substring(start, end));
            }
        }
        
        // 字体大小范围限制
        fontSize = Math.max(12, Math.min(36, fontSize));
        
        return {
            fontSize: fontSize,
            lines: actualLines,
            needsWrap: needsWrap,
            wrapSegments: wrapSegments,
            lineHeight: fontSize * lineHeightRatio
        };
    }

    /**
     * 应用文本样式到气泡
     * @param {HTMLElement} element DOM元素
     * @param {string} text 原始文本
     * @param {number} bubbleSize 气泡大小
     */
    applyTextStyle(element, text, bubbleSize) {
        const style = this.calculateOptimalTextStyle(text, bubbleSize);
        
        // 设置字体大小
        element.style.fontSize = style.fontSize + 'px';
        element.style.lineHeight = style.lineHeight + 'px';
        
        // 根据计算结果显示文字
        if (style.needsWrap && style.lines > 1) {
            // 使用换行显示
            element.innerText = style.wrapSegments.join('\n');
            element.style.whiteSpace = 'pre-wrap';
            element.style.wordBreak = 'break-word';
        } else {
            // 单行显示，使用省略号处理超长情况（但通常不会发生）
            element.innerText = text;
            element.style.whiteSpace = 'nowrap';
            element.style.textOverflow = 'ellipsis';
            element.style.overflow = 'hidden';
        }
        
        // 通用文本样式
        element.style.fontWeight = '600';
        element.style.letterSpacing = '0.5px';
        element.style.textShadow = '0 1px 2px rgba(0,0,0,0.08)';
        element.style.color = '#2d3748';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.textAlign = 'center';
        
        // 存储换行信息用于调试
        element.dataset.fontSize = style.fontSize;
        element.dataset.lines = style.lines;
    }

    getColorByName(name) {
        // 明亮鲜艳的颜色池 - 马卡龙色系 + 糖果色系，避免暗色
        const colorPalette = [
            '#FF6B6B', '#FECB6E', '#4ECDC4', '#FF9FF3', '#A8E6CF',
            '#FF8A5C', '#6C5CE7', '#00CEC9', '#FFB8B8', '#B8E4F0',
            '#FFD93D', '#95E77E', '#FF9F43', '#54A0FF', '#5F27CD',
            '#FF6B8B', '#45B7D1', '#96CEB4', '#FECA57', '#00D2D3',
            '#E056A6', '#24A19C', '#F8D35C', '#6A89CC', '#F9A26C',
            '#78E08F', '#82CCDD', '#FDA7DF', '#D980FA', '#E1B12C'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colorPalette[Math.abs(hash) % colorPalette.length];
    }

    handleMainCollision(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);
        const minDist = p1.r + p2.r;
        if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            const correction = overlap * 0.5;
            p1.x += nx * correction;
            p1.y += ny * correction;
            p2.x -= nx * correction;
            p2.y -= ny * correction;

            const vrelx = p1.vx - p2.vx;
            const vrely = p1.vy - p2.vy;
            const vrel_n = vrelx * nx + vrely * ny;
            if (vrel_n < 0) {
                const imp = (1 + this.BOUNCE_E) * vrel_n / 2;
                p1.vx -= imp * nx;
                p1.vy -= imp * ny;
                p2.vx += imp * nx;
                p2.vy += imp * ny;
            }
        }
    }

    applyBoundary(p, bounds) {
        const leftBound = 0;
        const rightBound = bounds.width - p.size;
        const topBound = bounds.topMargin;
        const bottomBound = bounds.height - p.size;

        if (p.x < leftBound) {
            p.x = leftBound;
            p.vx = Math.abs(p.vx);
        } else if (p.x > rightBound) {
            p.x = rightBound;
            p.vx = -Math.abs(p.vx);
        }

        if (p.y < topBound) {
            p.y = topBound;
            p.vy = Math.abs(p.vy);
        } else if (p.y > bottomBound) {
            p.y = bottomBound;
            p.vy = -Math.abs(p.vy);
        }
    }

    animate(currentTime) {
        if (!this.lastTimestamp) {
            this.lastTimestamp = currentTime;
            requestAnimationFrame((t) => this.animate(t));
            return;
        }

        let dt = Math.min(this.MAX_DT, (currentTime - this.lastTimestamp) / 1000);
        if (dt <= 0) {
            requestAnimationFrame((t) => this.animate(t));
            this.lastTimestamp = currentTime;
            return;
        }

        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            requestAnimationFrame((t) => this.animate(t));
            return;
        }

        const bounds = {
            width: rect.width,
            height: rect.height,
            topMargin: this.TOP_MARGIN
        };

        for (let p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        for (let iter = 0; iter < this.COLLISION_ITER; iter++) {
            for (let i = 0; i < this.mainParticles.length; i++) {
                for (let j = i + 1; j < this.mainParticles.length; j++) {
                    this.handleMainCollision(this.mainParticles[i], this.mainParticles[j]);
                }
            }
            for (let p of this.mainParticles) {
                this.applyBoundary(p, bounds);
            }
        }

        for (let p of this.particles) {
            if (!p.isMain) {
                this.applyBoundary(p, bounds);
            }
        }

        for (let p of this.particles) {
            p.el.style.left = p.x + 'px';
            p.el.style.top = p.y + 'px';
        }

        this.lastTimestamp = currentTime;
        requestAnimationFrame((t) => this.animate(t));
    }

    init(data, type) {
        this.data = data;
        this.type = type;
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = (rect.height - this.TOP_MARGIN) / 2 + this.TOP_MARGIN;

        this.canvas.innerHTML = '';
        this.particles = [];
        this.mainParticles = [];

        const maxScore = Math.max(...data.map(item => item.totalScore));

        data.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'bubble-particle clickable';
            // 气泡大小范围限制在 40-200 像素之间
            const minSize = Math.max(45, rect.width * 0.045);
            // 最大不超过200像素
            const maxSize = Math.min(200, rect.width * 0.28);
            // 使用平方比例让高分更大，低分更小
            const scoreRatio = item.totalScore / maxScore;
            // 确保size不超过200
            let size = minSize + (maxSize - minSize) * Math.pow(scoreRatio, 0.6);
            size = Math.min(size, 200);
            size = Math.max(size, 40); // 最小不低于40像素保证可读性

            let angle = (idx / data.length) * Math.PI * 2;
            // 响应式半径
            const baseRadius = Math.min(140, rect.width * 0.18);
            const outerRadius = Math.min(260, rect.width * 0.32);
            let radius = idx === 0 ? 0 : (idx <= 3 ? baseRadius : outerRadius);
            radius += (Math.random() - 0.5) * 45;

            let x = centerX + Math.cos(angle) * radius - size / 2;
            let y = centerY + Math.sin(angle) * radius - size / 2;

            x = Math.min(Math.max(x, 5), rect.width - size - 5);
            y = Math.min(Math.max(y, this.TOP_MARGIN + 5), rect.height - size - 5);

            div.style.width = size + 'px';
            div.style.height = size + 'px';
            const baseColor = this.getColorByName(item.name);
            div.style.background = this.generateSphereGradient(baseColor);
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            
            // 文本容器样式优化
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.textAlign = 'center';
            div.style.boxSizing = 'border-box';
            div.style.padding = '8px 6px';
            div.style.borderRadius = '50%';
            div.style.overflow = 'hidden';
            
            // 应用优化的文本样式
            this.applyTextStyle(div, item.name, size);

            // 存储分数信息
            div.dataset.score = item.totalScore;
            
            // 检测是否为触摸屏
            let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // 单击跳转（桌面端），单击显示分数（触摸屏）
            let clickCount = 0;
            let clickTimer = null;
            
            div.onclick = (e) => {
                e.stopPropagation();
                clickCount++;
                
                if (clickCount === 1) {
                    // 显示分数
                    showScoreTooltip(div, item.totalScore, e);
                    
                    if (isTouchDevice) {
                        // 触摸屏：单击显示分数，双击跳转
                        clickTimer = setTimeout(() => {
                            clickCount = 0;
                        }, 300);
                    } else {
                        // 桌面端：单击直接跳转
                        setTimeout(() => {
                            window.location.href = `detail.html?type=${type}&id=${encodeURIComponent(item.name)}`;
                        }, 100);
                    }
                } else if (clickCount === 2 && isTouchDevice) {
                    // 触摸屏双击跳转
                    clearTimeout(clickTimer);
                    clickCount = 0;
                    window.location.href = `detail.html?type=${type}&id=${encodeURIComponent(item.name)}`;
                }
            };
            
            // 鼠标悬停显示分数
            div.onmouseenter = (e) => {
                showScoreTooltip(div, item.totalScore, e);
            };
            
            div.onmousemove = (e) => {
                updateTooltipPosition(e);
            };
            
            div.onmouseleave = () => {
                hideScoreTooltip();
            };
            this.canvas.appendChild(div);

            const angleSpeed = Math.random() * Math.PI * 2;
            const spdMag = (Math.random() * 0.7 + 0.3) * this.MAIN_SPEED_RANGE;
            const vx = Math.cos(angleSpeed) * spdMag;
            const vy = Math.sin(angleSpeed) * spdMag;

            const particle = {
                el: div,
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                size: size,
                r: size / 2,
                isMain: true
            };
            this.particles.push(particle);
            this.mainParticles.push(particle);
        });

        for (let i = 0; i < this.bgDotsCount; i++) {
            const size = Math.random() * 14 + 4;
            const div = document.createElement('div');
            div.className = 'bubble-particle bg-dot';
            let x = Math.random() * (rect.width - size);
            let y = Math.random() * (rect.height - this.TOP_MARGIN - size) + this.TOP_MARGIN;

            div.style.width = size + 'px';
            div.style.height = size + 'px';
            const dotColor = this.dotColors[Math.floor(Math.random() * this.dotColors.length)];
            div.style.background = `radial-gradient(circle at 35% 35%, rgba(255,255,245,0.9), ${dotColor} 70%, rgba(255,255,240,0.6))`;
            div.style.opacity = Math.random() * 0.55 + 0.3;
            div.style.left = x + 'px';
            div.style.top = y + 'px';
            div.innerText = '';
            div.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';

            this.canvas.appendChild(div);

            const spdMag = (Math.random() * 0.7 + 0.3) * this.BG_SPEED_RANGE;
            const dir = Math.random() * Math.PI * 2;
            const vx = Math.cos(dir) * spdMag;
            const vy = Math.sin(dir) * spdMag;

            this.particles.push({
                el: div,
                x: x,
                y: y,
                vx: vx,
                vy: vy,
                size: size,
                r: size / 2,
                isMain: false
            });
        }

        for (let iter = 0; iter < 8; iter++) {
            for (let i = 0; i < this.mainParticles.length; i++) {
                for (let j = i + 1; j < this.mainParticles.length; j++) {
                    const p1 = this.mainParticles[i];
                    const p2 = this.mainParticles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.hypot(dx, dy);
                    const minDist = p1.r + p2.r;
                    if (dist < minDist) {
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const correction = overlap * 0.5;
                        p1.x += nx * correction;
                        p1.y += ny * correction;
                        p2.x -= nx * correction;
                        p2.y -= ny * correction;
                        const boundsTemp = {
                            width: rect.width,
                            height: rect.height,
                            topMargin: this.TOP_MARGIN
                        };
                        this.applyBoundary(p1, boundsTemp);
                        this.applyBoundary(p2, boundsTemp);
                    }
                }
            }
        }

        for (let p of this.particles) {
            p.el.style.left = p.x + 'px';
            p.el.style.top = p.y + 'px';
        }

        this.lastTimestamp = null;
        requestAnimationFrame((t) => this.animate(t));
    }

    handleResize() {
        if (this.resizeTimer) clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            if (this.data && this.data.length > 0) {
                this.init(this.data, this.type);
            }
        }, 180);
    }
}

function initParticleGarden() {
    if (!particleGarden) {
        particleGarden = new ParticleGarden();
        particleGarden.container = document.getElementById('wp-particle-garden');
        particleGarden.canvas = document.getElementById('particle-canvas');
        window.addEventListener('resize', () => particleGarden.handleResize());
    }
}

function renderPersonBubbleChart(users) {
    console.log('渲染人员气泡图，数据:', users);
    const chartInfo = document.getElementById('chart-info');
    if (chartInfo) {
        chartInfo.style.display = 'none';
    }
    initParticleGarden();
    particleGarden.init(users, 'person');
}

function renderProductBubbleChart(products) {
    console.log('渲染产品气泡图，数据:', products);
    const chartInfo = document.getElementById('chart-info');
    if (chartInfo) {
        chartInfo.style.display = 'none';
    }
    initParticleGarden();
    particleGarden.init(products, 'product');
}

function clearChart() {
    if (particleGarden && particleGarden.canvas) {
        particleGarden.canvas.innerHTML = '';
        particleGarden.particles = [];
        particleGarden.mainParticles = [];
        particleGarden.data = [];
    }
}

function renderProductDetailBubbleChart(product, users) {
    console.log('渲染产品详情气泡图，产品:', product.name, '用户数据:', users);
    const productUsers = users.filter(user => {
        return user.tasks.some(task => task.product === product.name);
    });

    if (productUsers.length === 0) {
        console.log('该产品没有参与人员');
        return;
    }

    const userScores = productUsers.map(user => {
        const productTasks = user.tasks.filter(task => task.product === product.name);
        const productScore = productTasks.reduce((sum, task) => sum + task.score, 0);
        return {
            name: user.name,
            totalScore: productScore,
            tasks: user.tasks
        };
    });

    if (!particleGarden) {
        particleGarden = new ParticleGarden();
    }
    particleGarden.container = document.getElementById('wp-particle-garden-detail');
    particleGarden.canvas = document.getElementById('particle-canvas-detail');
    particleGarden.init(userScores, 'person');
}

function renderPersonDetailChart(person) {
    console.log('渲染个人详情图表');
}

function renderTaskDistributionChart(person) {
    console.log('渲染任务分布图表');
}

/**
 * 显示分数提示框
 */
function showScoreTooltip(element, score, event) {
    // 移除已存在的提示框
    hideScoreTooltip();
    
    // 创建新的提示框
    scoreTooltip = document.createElement('div');
    scoreTooltip.className = 'score-tooltip';
    scoreTooltip.innerHTML = `
        <div class="tooltip-content">
            <span class="tooltip-label">积分</span>
            <span class="tooltip-value">${score}</span>
        </div>
        <div class="tooltip-arrow"></div>
    `;
    
    // 添加样式
    scoreTooltip.style.position = 'fixed';
    scoreTooltip.style.zIndex = '1000';
    scoreTooltip.style.pointerEvents = 'none';
    scoreTooltip.style.fontFamily = '"Microsoft YaHei", "Segoe UI", system-ui, sans-serif';
    scoreTooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    scoreTooltip.style.color = 'white';
    scoreTooltip.style.padding = '8px 12px';
    scoreTooltip.style.borderRadius = '8px';
    scoreTooltip.style.fontSize = '14px';
    scoreTooltip.style.fontWeight = '600';
    scoreTooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    
    // 设置内容样式
    const content = scoreTooltip.querySelector('.tooltip-content');
    if (content) {
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.gap = '8px';
    }
    
    const label = scoreTooltip.querySelector('.tooltip-label');
    if (label) {
        label.style.opacity = '0.8';
        label.style.fontSize = '12px';
    }
    
    const value = scoreTooltip.querySelector('.tooltip-value');
    if (value) {
        value.style.fontSize = '16px';
        value.style.fontWeight = '700';
        value.style.color = '#3b82f6';
    }
    
    const arrow = scoreTooltip.querySelector('.tooltip-arrow');
    if (arrow) {
        arrow.style.position = 'absolute';
        arrow.style.bottom = '-6px';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderLeft = '6px solid transparent';
        arrow.style.borderRight = '6px solid transparent';
        arrow.style.borderTop = '6px solid rgba(0, 0, 0, 0.8)';
    }
    
    // 添加到页面
    document.body.appendChild(scoreTooltip);
    
    // 更新位置
    updateTooltipPosition(event);
}

/**
 * 更新提示框位置
 */
function updateTooltipPosition(event) {
    if (!scoreTooltip) return;
    
    const rect = scoreTooltip.getBoundingClientRect();
    const x = event.clientX - rect.width / 2;
    const y = event.clientY - rect.height - 10;
    
    scoreTooltip.style.left = `${Math.max(0, x)}px`;
    scoreTooltip.style.top = `${Math.max(0, y)}px`;
}

/**
 * 隐藏分数提示框
 */
function hideScoreTooltip() {
    if (scoreTooltip && scoreTooltip.parentNode) {
        scoreTooltip.parentNode.removeChild(scoreTooltip);
        scoreTooltip = null;
    }
}