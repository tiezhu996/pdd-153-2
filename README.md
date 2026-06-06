# 家庭饮食健康管理系统

一个全栈的家庭饮食健康管理工具，帮助您管理全家人的健康饮食。

## 功能特性

### 👨‍👩‍👧‍👦 家庭成员管理
- 注册家庭成员信息（年龄、性别、过敏源、饮食忌口）
- 自动生成饮食标签
- 支持过敏源管理

### 📖 食谱库
- 内置多种健康食谱
- 搜索和筛选功能
- **自动过滤含过敏源的菜品**
- 查看详细营养信息

### 🍽️ 饮食记录
- 记录每日三餐和加餐
- 关联食谱获取营养数据
- 按家庭成员分配用餐
- 自动统计营养摄入

### 🏠 首页仪表盘
- 本周饮食概况统计
- 营养摄入可视化图表
- **营养素缺乏提醒**
- 家庭成员营养对比

### 🛒 购物清单
- 创建多个购物清单
- 勾选已购买物品
- 自动统计购买进度

### 📊 健康周报
- 每周饮食记录汇总
- 家庭成员营养分析
- 营养雷达图
- **个性化改善建议**

### ⚙️ 管理后台
- 系统数据统计
- 用户和家庭管理
- 食谱管理（增删改查）

## 技术栈

### 后端
- Node.js + Express
- SQLite (better-sqlite3)
- JWT 身份认证
- bcrypt 密码加密

### 前端
- React 18 + Vite
- React Router 路由
- Axios HTTP 客户端
- Tailwind CSS 样式
- Recharts 数据可视化

## 快速开始

### 1. 安装后端依赖并初始化数据库

```bash
cd backend
npm install
npm run init-db
```

### 2. 启动后端服务

```bash
cd backend
npm start
```

后端服务将在 `http://localhost:3001` 启动

### 3. 安装前端依赖

```bash
cd frontend
npm install
```

### 4. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

## 默认账号

- **管理员账号**: `admin` / `admin123`

## 项目结构

```
pdd-153/
├── backend/                 # 后端代码
│   ├── config/             # 配置文件
│   ├── middleware/         # 中间件
│   ├── routes/             # API 路由
│   ├── scripts/            # 脚本
│   ├── data/               # 数据库文件
│   ├── server.js           # 服务器入口
│   └── package.json
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── context/        # 上下文
│   │   ├── pages/          # 页面
│   │   ├── App.jsx         # 应用入口
│   │   └── main.jsx        # 渲染入口
│   ├── index.html
│   └── package.json
└── README.md
```

## API 接口

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 家庭成员
- `GET /api/members` - 获取家庭成员列表
- `POST /api/members` - 添加家庭成员
- `PUT /api/members/:id` - 更新家庭成员
- `DELETE /api/members/:id` - 删除家庭成员

### 食谱
- `GET /api/recipes` - 获取食谱列表（支持搜索和过敏源过滤）
- `GET /api/recipes/:id` - 获取食谱详情
- `POST /api/recipes` - 添加食谱（管理员）
- `PUT /api/recipes/:id` - 更新食谱（管理员）
- `DELETE /api/recipes/:id` - 删除食谱（管理员）

### 饮食记录
- `GET /api/meals` - 获取饮食记录
- `POST /api/meals` - 添加饮食记录
- `DELETE /api/meals/:id` - 删除饮食记录
- `GET /api/meals/nutrition/:memberId` - 获取成员营养统计

### 购物清单
- `GET /api/shopping/lists` - 获取购物清单列表
- `POST /api/shopping/lists` - 创建购物清单
- `GET /api/shopping/lists/:id/items` - 获取清单项目
- `POST /api/shopping/lists/:id/items` - 添加清单项目
- `PUT /api/shopping/items/:id` - 更新清单项目
- `DELETE /api/shopping/items/:id` - 删除清单项目
- `DELETE /api/shopping/lists/:id` - 删除购物清单

### 报告
- `GET /api/reports/dashboard` - 首页仪表盘数据
- `GET /api/reports/weekly` - 周报告数据

### 管理后台
- `GET /api/admin/stats` - 统计数据
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/families` - 家庭列表
- `GET /api/admin/recipes` - 食谱列表

## 使用说明

1. **注册账号**: 首次使用请先注册账号，系统会自动创建一个家庭
2. **添加家庭成员**: 在"家庭成员"页面添加每位家庭成员的信息，包括过敏源
3. **浏览食谱**: 在"食谱库"页面浏览食谱，系统会自动过滤含过敏源的菜品
4. **记录饮食**: 在"饮食记录"页面记录每天吃了什么，系统会自动统计营养
5. **查看报告**: 在"首页"和"健康周报"查看营养统计和改善建议
6. **管理购物清单**: 在"购物清单"页面管理需要购买的食材

## 核心算法

### 饮食标签生成
- 根据年龄自动分类（儿童/青少年/成人/老年人）
- 根据过敏源和忌口生成标签

### 过敏源过滤
- 搜索食谱时自动比对家庭成员过敏源
- 智能匹配食材名称和过敏源

### 营养计算
- 按用餐人数平均分配营养
- 支持多餐次汇总统计
- 基于年龄的营养推荐值比对
