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
- `/compare`：统一对比页，支持 Cloud / Edge
- `/collections`：收藏与已保存对比

## 当前实现边界

- 收藏和已保存对比保存在浏览器 `localStorage`
- 项目当前没有完整登录体系
- 项目当前没有独立后端 API，中间层能力主要依赖 Supabase 权限控制
- Edge 详情页尚未实现

## 构建与部署

```bash
npm run build
npm run start
```

部署前请确认：

- Supabase URL 与公开 key 已配置
- 数据库表字段与前端读取字段一致
- 匿名访问权限与 RLS 策略符合公开站点要求
