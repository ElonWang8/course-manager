# 钢琴课时管理系统

为钢琴老师设计的课时管理工具，支持学生管理、课程记录、排课、缴费跟踪和数据统计。

## 功能

- **课程表** — 周视图排课，一键签到/取消
- **学生管理** — 一对一学生 + 集体课，自动计算剩余课时
- **课程记录** — 列表/月历双视图，按学生和状态筛选
- **统计图表** — 月度课时、月度收入、学生分布
- **数据导出** — CSV 导出（UTF-8 BOM，Excel 可直接打开）
- **自动备份** — 凌晨 3 点自动备份，保留 30 份，支持一键恢复
- **密码保护** — JWT 登录认证

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Tailwind CSS + Recharts |
| 后端 | Python FastAPI + SQLAlchemy (async) + aiosqlite |
| 数据库 | SQLite |
| 部署 | Docker Compose（单容器，前后端合一） |

## 快速开始

```bash
# 1. 下载
git clone https://github.com/ElonWang8/course-manager.git
cd course-manager

# 2. 配置密码
cp .env.example .env
# 编辑 .env，修改 ADMIN_PASSWORD 和 JWT_SECRET

# 3. 启动
docker compose up -d

# 4. 打开浏览器
# http://localhost:3721
```

> 首次启动 Docker 会自动拉取预编译镜像，几秒内即可访问。

## 手动构建（可选）

如果你不想用预编译镜像，可以自己构建：

```bash
docker compose -f docker-compose.build.yml up -d
```

## 数据备份

数据存储在 `backend/data/` 目录：
- `app.db` — SQLite 数据库文件
- `backups/` — 自动备份（每天凌晨 3 点，保留 30 份）

通过 Docker volume 持久化，容器删除后数据不丢失。

在设置页面可以手动创建备份、下载备份文件、上传恢复。

## 时区

所有日期时间使用 Asia/Shanghai (UTC+8)。

## License

MIT
