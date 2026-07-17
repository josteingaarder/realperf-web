# RealPerf.ai

RealPerf.ai 是一个面向 AI 芯片选型的数据库与对比站点，聚焦两类目录：

- `Cloud`：云端训练 / 推理加速器
- `Edge`：边缘推理与嵌入式 AI 芯片

当前能力包括：

- 浏览 Cloud / Edge 芯片列表
- 按厂商与分类筛选
- 收藏芯片并在 `My Collections` 中统一查看
- 保存对比组合并重新打开
- 查看 Cloud 芯片详情与 benchmark 结果
- 查看 Edge 芯片详情

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase JS
- ECharts

## 目录结构

```text
src/
  app/
    page.tsx                 首页
    chips/                   Cloud 芯片列表与详情
    edge/                    Edge 芯片列表
    compare/                 Cloud / Edge 统一对比页
    collections/             收藏与已保存对比
  components/
    SiteHeader.tsx           共享导航
  lib/
    supabase.ts              Supabase 客户端
    storage.ts               本地收藏与对比存储
    catalog.ts               Cloud / Edge 查询与归一化
```

## 环境变量

项目启动至少需要以下环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

如果部署环境使用的是 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，代码也兼容该变量名。

## 本地启动

```bash
npm install
npm run dev
```

默认访问地址：

- [http://localhost:3000](http://localhost:3000)

## 主要数据表

前端当前直接读取 Supabase 表：

- `cloud_chips`
- `edge_chips`
- `benchmarks`

其中：

- `cloud_chips` 用于 Cloud 列表、详情页、对比页
- `edge_chips` 用于 Edge 列表、对比页、收藏页
- `benchmarks` 用于 Cloud 详情页 benchmark 展示

## 主要页面

- `/`：首页与总入口
- `/chips`：Cloud 芯片数据库
- `/chips/[id]`：Cloud 芯片详情
- `/edge`：Edge 芯片数据库
- `/edge/[id]`：Edge 芯片详情
- `/compare`：统一对比页，支持 Cloud / Edge
- `/collections`：收藏与已保存对比

## 当前实现边界

- 收藏和已保存对比保存在浏览器 `localStorage`
- 项目当前没有完整登录体系
- 项目当前仍以 Supabase 直连为主，但已通过显式 RLS 只读策略约束公开表
- 没有写操作 API，对数据库的新增/修改应放在服务端中间层或受控后台中完成

## 测试

最小回归覆盖使用 `Vitest + Testing Library`：

```bash
npm run test
```

当前覆盖重点：

- 收藏数据结构与 source 识别
- 对比参数解析与去重
- 收藏页空态展示

## Supabase 访问边界

当前前端只使用 `anon` / `publishable` key 读取公开目录数据。为避免“匿名 key 拿到整表默认权限”，已补充数据库侧约束：

- `cloud_chips`：启用 RLS，并显式开放只读策略
- `edge_chips`：启用 RLS，并显式开放只读策略
- `benchmarks`：启用 RLS，并显式开放只读策略

迁移文件位于：

- `supabase/migrations/enable_public_read_policies.sql`

建议继续遵守：

- 前端只使用公开 key，不使用 `service_role`
- 如果后续引入私有字段、运营数据或写操作，优先增加服务端中间层
- 新增表时不要依赖“默认无 RLS”，而要显式声明访问策略

## 仓库说明

- `AGENTS.md`：工作区约束文件，供 Agent / 自动化工具读取
- 根目录不再保留 `CLAUDE.md` 这类空壳跳转文件，避免对外观感像未整理模板

## 构建与部署

```bash
npm run build
npm run start
```

部署前请确认：

- Supabase URL 与公开 key 已配置
- 数据库表字段与前端读取字段一致
- 匿名访问权限与 RLS 策略符合公开站点要求
