# 积分可视化系统

## 系统介绍

这是一个简单的积分可视化系统，可以通过上传Excel文件来统计和展示积分数据。系统分为两个页面：

1. **上传页面** - 用于上传和解析Excel文件
2. **展示页面** - 展示气泡图和详细数据统计

## 功能特性

- 📤 **拖拽上传** - 支持拖拽Excel文件上传
- 📊 **气泡图可视化** - 按人员或按产品展示积分分布
- 📈 **数据统计** - 显示总人数、总产品数、总积分
- 🎨 **美观界面** - 现代化的UI设计
- 📱 **响应式设计** - 支持移动端和桌面端
- 🔄 **页面跳转** - 上传成功后自动跳转到展示页面

## Excel格式说明

您的Excel表格应该采用以下格式：

|        | 01 洪炉-Y2 | 02 洪炉-Y20 | ... |
|--------|------------|-------------|-----|
| 01 PFD jpg | 毕建辉 | 毕建辉 | ... |
| 02 方案计算表 | 蔡治有、毕建辉 | 蔡治有、毕建辉 | ... |
| 03 方案清单 商业判断 模 | 蔡治有 | 蔡治有、毕建辉 | ... |
| ...    | ...        | ...         | ... |

**格式说明：**
- **第一列**：任务名称（可以带编号）
- **后面的列**：产品/项目名称（如"01 洪炉-Y2"、"02 洪炉-Y20"）
- **交叉单元格**：该任务在该产品中的参与人员

**参与人员分隔符支持：**
- 逗号：`,`
- 顿号：`、`
- 中文逗号：`，`
- 空格

**示例：**
- `蔡治有、毕建辉` - 正确
- `蔡治有,毕建辉` - 正确
- `蔡治有 毕建辉` - 正确

## 积分计算规则

- 每个任务在每个产品中固定10积分
- 如果任务由多人合作完成，积分平均分配给每个人
- 例如：任务由3人合作完成，每人获得 10/3 ≈ 3.33积分
- 如果一个任务在多个产品中都有人参与，每个产品都单独计算10积分

## 使用方法

### 1. 启动本地服务器

由于浏览器安全限制，不能直接在浏览器中打开HTML文件使用，需要启动本地服务器。

#### 方法一：使用VS Code的Live Server扩展（推荐）
1. 在VS Code中安装"Live Server"扩展
2. 在VS Code中打开项目文件夹
3. 右键点击 `index.html`，选择 "Open with Live Server"

#### 方法二：使用Python内置服务器
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
然后在浏览器中访问 `http://localhost:8000`

#### 方法三：使用Node.js的http-server
```bash
npm install -g http-server
http-server -p 8000
```
然后在浏览器中访问 `http://localhost:8000`

### 2. 上传Excel文件

1. 打开系统会自动跳转到上传页面
2. 可以通过以下方式上传文件：
   - 点击"浏览文件"按钮选择Excel文件
   - 直接将Excel文件拖拽到上传区域
3. 点击"开始解析"按钮
4. 解析成功后会自动跳转到展示页面

### 3. 查看可视化

1. 在展示页面顶部可以看到三个统计卡片：
   - 总人数
   - 总产品
   - 总积分
2. 使用"按人员"或"按产品"按钮切换视图
3. 点击气泡可以查看详细信息
4. 点击"返回上传"或"重新上传"可以回到上传页面

## 文件说明

- `index.html` - 上传页面，用于上传和解析Excel文件
- `chart.html` - 展示页面，显示气泡图和数据统计
- `detail.html` - 详情页面，展示个人或产品的详细数据
- `css/style.css` - 样式文件
- `scripts/app.js` - 主应用逻辑
- `scripts/excel.js` - Excel解析和积分计算
- `scripts/charts.js` - 图表渲染
- `scripts/storage.js` - 本地存储

## 浏览器支持

建议使用现代浏览器：
- Chrome (推荐)
- Firefox
- Edge
- Safari

## 调试说明

如果遇到问题，可以：
1. 打开浏览器开发者工具（F12）
2. 查看Console标签页的调试信息
3. 查看Network标签页检查资源加载情况

## 注意事项

1. 数据存储在浏览器的localStorage中，清除浏览器数据会丢失数据
2. 建议定期备份Excel原始数据
3. 系统适合中小型数据量（几百条记录）
4. Excel文件必须是.xlsx或.xls格式

## GitHub部署指南

### 1. 创建GitHub仓库

1. 在GitHub上创建一个新的仓库（例如：`jifen-bubble`）
2. 将本地代码推送到GitHub仓库：

```bash
git remote add origin https://github.com/你的用户名/jifen-bubble.git
git branch -M main
git push -u origin main
```

### 2. 启用GitHub Pages

1. 进入GitHub仓库的Settings页面
2. 在左侧菜单中找到"Pages"
3. 在"Source"部分选择"GitHub Actions"
4. 系统会自动使用`.github/workflows/deploy.yml`文件进行部署

### 3. 访问在线版本

部署完成后，可以通过以下URL访问：
```
https://你的用户名.github.io/jifen-bubble
```

## 技术栈

- HTML5 + CSS3 + JavaScript
- Bootstrap 5 - UI框架
- Chart.js - 图表库
- SheetJS (xlsx.js) - Excel解析
- localStorage - 本地存储
- GitHub Pages - 静态网站部署