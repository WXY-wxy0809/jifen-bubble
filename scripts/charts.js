/**
 * 图表渲染模块 - 立体粒子气泡图
 */

let particleGarden = null;

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
        this.dotColors = ['#f44336', '#9c27b0', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800', '#00bcd4', '#e91e63', '#ff6d00', '#3f51b5'];
        this.bgDotsCount = 120;
    }

    generateSphereGradient(baseColor) {
        return `radial-gradient(circle at 28% 30%, rgba(255, 255, 245, 0.85), ${baseColor} 55%, rgba(0, 0, 0, 0.18) 98%)`;
    }

    getOptimalFontSize(text, bubbleSize) {
        if (!text || text.length === 0) return Math.max(14, bubbleSize / 5);
        const textLen = text.length;
        if (textLen >= 8) {
            let fontSize = Math.min(26, Math.max(16, bubbleSize * 0.22));
            if (textLen > 12) fontSize = Math.max(14, fontSize * 0.9);
            return fontSize;
        } else {
            let fontSize = Math.min(32, Math.max(14, bubbleSize * 0.2));
            return fontSize;
        }
    }

    getColorByName(name) {
        // 使用更美观的颜色方案
        const colorPalette = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
            '#A3CB38', '#1289A7', '#D980FA', '#B53471', '#EE5A24',
            '#C4E538', '#12CBC4', '#FDA7DF', '#ED4C67', '#0652DD'
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
            const minSize = 80;
            const maxSize = 200;
            const size = minSize + (maxSize - minSize) * (item.totalScore / maxScore);

            let angle = (idx / data.length) * Math.PI * 2;
            let radius = idx === 0 ? 0 : (idx <= 3 ? 150 : 280);
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

            const optimalFontSize = this.getOptimalFontSize(item.name, size);
            div.style.fontSize = optimalFontSize + 'px';
            div.innerText = item.name;
            div.style.fontWeight = '600';
            div.style.letterSpacing = '0.8px';
            div.style.textShadow = '0 1px 2px rgba(255,255,245,0.6)';

            div.onclick = (e) => {
                e.stopPropagation();
                window.location.href = `detail.html?type=${type}&id=${encodeURIComponent(item.name)}`;
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
            div.style.background = `radial-gradient(circle at 35% 35%, rgba(255,255,240,0.7), ${dotColor} 70%, rgba(0,0,0,0.1))`;
            div.style.opacity = Math.random() * 0.55 + 0.25;
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
