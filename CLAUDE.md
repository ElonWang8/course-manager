# 钢琴课时管理系统 Web 版

## 项目概述

将 SwiftUI iOS 钢琴课时管理 App 迁移为 Web 版，部署在飞牛 NAS Docker，通过 Cloudflare Tunnel 公网访问。

- **线上地址**: https://piano.elonbot.eu.org/
- **GitHub**: https://github.com/ElonWang8/course-manager
- **飞牛路径**: `/vol1/1000/docker/课程记录-web`
- **飞牛部署命令**: `git pull origin main && docker compose up -d --build --remove-orphans`
- **本地项目路径**: `/Users/elonwang/Downloads/课程记录-web`

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Tailwind CSS v4 + Recharts + dayjs |
| 后端 | Python FastAPI + SQLAlchemy 2.0 (async) + aiosqlite |
| 数据库 | SQLite（单文件，`backend/data/app.db`） |
| 认证 | JWT（python-jose + passlib bcrypt），单用户密码登录 |
| 部署 | 单容器 Docker（多阶段构建），端口 3721→8000 |
| CI/CD | GitHub Actions → ghcr.io/elonwang8/course-manager |

## 重要约束

- **时区**：所有时间统一存本地时间（Asia/Shanghai），**不使用 UTC 转换**。前端 `dayjs()` 不带 `.utc()`，发送日期用 `"YYYY-MM-DDTHH:mm:ss"` 格式（无时区标记）。FastAPI `datetime.fromisoformat()` 解析为 naive datetime。课程表 `date_to` 需 `+7 天` 以包含周日全天。
- **Docker 构建**：pip 用清华镜像 `-i https://pypi.tuna.tsinghua.edu.cn/simple`，npm 用淘宝镜像 `https://registry.npmmirror.com`
- **模态弹窗**：z-index 用 `z-[60]`，底部留白 `pb-20` 避开 TabBar。backdrop 点击关闭用 `e.target === e.currentTarget` 判断，**不用** `stopPropagation`
- **UUID 处理**：后端所有路由的路径参数（`student_id`/`lesson_id` 等）传给 `db.get()` 或 `.where()` 前需 `uuid.UUID(id_str)` 转换，否则 SQLAlchemy Uuid 类型会尝试 `.hex` 方法报 500
- **密码**：线上密码 `123456`（`.env` 中 `ADMIN_PASSWORD`），Playwright 测试也用此密码
- **GitHub 推送**：需 `~/bin/gh` 认证（`gh auth login`），两个 git 仓库注意切换目录（`課程記錄` 是 iOS 项目 → piano-lesson-tracker，`課程記錄-web` 是 Web 项目 → course-manager）

## 项目结构

```
课程记录-web/
├── Dockerfile              # 多阶段构建（node 编译前端 + python 后端）
├── docker-compose.yml      # 单服务 app，端口 3721:8000
├── .env.example
├── backend/
│   ├── Dockerfile          # 已废弃，用根 Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py         # FastAPI + JWT 中间件 + SPA fallback
│   │   ├── config.py       # 环境变量
│   │   ├── database.py     # SQLAlchemy async engine
│   │   ├── models.py       # 6 个 ORM 模型
│   │   ├── schemas.py      # Pydantic 验证
│   │   ├── auth.py         # JWT + bcrypt
│   │   ├── routers/        # auth, students, lessons, payments, group_classes, schedule, statistics, backup, export
│   │   └── services/       # csv_export, backup (APScheduler)
│   └── data/               # volume mount: app.db + backups/
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # 路由：未登录→LoginPage，已登录→MainLayout
│   │   ├── api/client.ts   # axios + JWT 拦截器
│   │   ├── types/index.ts  # TypeScript 类型定义
│   │   ├── components/     # StatusBadge, EmptyState, StatCard, LessonFormModal, PaymentFormModal
│   │   └── pages/          # LoginPage, MainLayout, SchedulePage, StudentsPage, StudentDetailPage, LessonsPage, StatisticsPage, SettingsPage
│   └── nginx.conf          # 已废弃（单容器不需要 Nginx）
└── test.mjs                # Playwright 测试（gitignore）
```

## 当前状态（2026-05-10）

### 已完成功能

**认证系统**：JWT 密码登录，24h 过期（记住我 7 天），API 中间件保护，密码 bcrypt 哈希

**课程表** (`/schedule`)：7 列周视图（桌面 ≥768px）/ 列表视图（手机），签到/取消操作，翻上周/下周，同时显示排课 slot 匹配的课程（灰色底）和直接添加的课程（黄色底）

**学生管理** (`/students`)：一对一/集体课标签切换，每个学生行有快捷操作（签到/加课/缴费/编辑/停课/删除），点击学生名进入详情页

**学生详情页** (`/students/:id`)：
- 顶部信息卡（头像/姓名/年级/状态/手机/年龄/学琴起始日）
- 剩余课时大数字 + 已购/已上统计
- 三标签页：课程记录（已上/未上）、缴费记录、集体课
- 课程记录每行有签到和编辑按钮，编辑可改时间/时长/内容/状态/删除
- 底部操作栏：今日签到/添加课程/添加缴费
- 弹窗：LessonFormModal（支持新增和编辑模式）、PaymentFormModal

**课程记录** (`/lessons`)：列表/月历双视图，按学生和状态下拉筛选，状态快捷切换（签到/取消/恢复）

**统计** (`/statistics`)：概览卡片（总课时/总收入/活跃学生），月度课时柱状图，月度收入折线图，学生课时分布饼图，时间范围筛选（本月/近3月/近6月/本年/全部）

**设置** (`/settings`)：导出课程 CSV / 导出缴费 CSV（UTF-8 BOM），备份创建/下载（blob 方式避免弹窗拦截）/恢复，退出登录

**自动备份**：APScheduler 每天凌晨 3:00 上海时间，SQLite `VACUUM INTO` 原子备份，保留最多 30 份

**单容器 Docker**：根 Dockerfile 多阶段构建（node 编译 React → python 托管静态文件 + API），FastAPI SPA fallback（`/{full_path:path}` 返回 index.html），`/assets` 挂载 StaticFiles

### 已知已修复的 Bug

1. ✅ UUID 字符串 → `uuid.UUID()` 转换（所有路由 `db.get/where`）
2. ✅ 模态弹窗 backdrop 拦截按钮点击
3. ✅ 集体课表单错误显示学生字段（现在有独立 GroupForm）
4. ✅ 登录后无跳转（App.tsx 用 `<Navigate>`）
5. ✅ dayjs utc 插件缺失 + 时区错误（全部改用本地时间）
6. ✅ 学生详情 API 500（selectinload ScheduleSlot 的 student/group_class 关联）
7. ✅ 课程表 date_to 不包含周日全天（改为 +7 天）
8. ✅ 新增学生弹窗被 TabBar 遮挡（z-index + pb-20）

## 下一步计划

### 待实现功能

1. **缴费记录独立页面** — 目前缴费只在学生详情页的标签里查看，没有全局缴费列表
2. **集体课详情页** — 类似学生详情页，展示集体课的学生列表、课程记录、缴费记录
3. **排课 Slot 管理界面** — 后端 API 已有（CRUD schedule-slots），前端缺少新增/编辑/删除排课的 UI
4. **密码修改功能** — 设置页增加修改密码入口（改 `.env` 中 `ADMIN_PASSWORD` 或写文件）
5. **学生详情页增加缴费记录的编辑和删除**

### 已知注意事项

- 两个 git 仓库：iOS 项目在 `~/Downloads/课程记录`（→ piano-lesson-tracker），Web 项目在 `~/Downloads/课程记录-web`（→ course-manager），操作时注意 `cd` 到正确目录
- Playwright 测试脚本 `课程记录-web/test.mjs` 不在 git 中（.gitignore），密码硬编码为 `123456`
- GitHub 推送用 `~/bin/gh`（非 Homebrew 安装，手动下载的二进制）
- Docker 构建用 `--no-cache` 避免 Python 层缓存问题（pip 下载大文件易超时）
- Token 过期后 axios 拦截器自动跳转 `/login`
