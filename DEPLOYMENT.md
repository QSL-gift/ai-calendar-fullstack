# 部署到Render平台指南

## 步骤1：准备代码

1. 确保所有代码已提交到GitHub仓库
2. 确保 `.env` 文件已添加到 `.gitignore`（不要提交API密钥到代码仓库）

## 步骤2：在Render创建服务

1. 登录 [Render控制台](https://render.com)
2. 点击 "New +" → "Web Service"
3. 连接您的GitHub仓库
4. 选择 `ai-calendar-fullstack` 仓库

## 步骤3：配置服务设置

### 基本设置：
- **Name**: `ai-calendar-fullstack`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (或根据需要选择)

### 环境变量设置：
在 "Environment" 标签页中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SILICONFLOW_API_KEY` | `您的真实API密钥` | ⚠️ 必须填入真实密钥 |
| `SILICONFLOW_API_URL` | `https://api.siliconflow.cn/v1/chat/completions` | API端点地址 |
| `DEEPSEEK_MODEL` | `deepseek-ai/DeepSeek-V3` | 使用的AI模型 |
| `NODE_ENV` | `production` | 生产环境标识 |

## 步骤4：部署

1. 点击 "Create Web Service"
2. Render会自动开始构建和部署
3. 等待部署完成（通常需要几分钟）

## 步骤5：验证部署

1. 访问Render提供的URL（例如：`https://ai-calendar-fullstack.onrender.com`）
2. 测试基本功能
3. 访问 `/test` 路径进行API测试

## 常见问题

### Q: 部署后API调用失败
A: 检查环境变量是否正确配置，特别是 `SILICONFLOW_API_KEY`

### Q: 服务启动失败
A: 检查构建日志，确保所有依赖都正确安装

### Q: 如何更新部署
A: 推送新代码到GitHub，Render会自动重新部署

## 安全注意事项

1. ⚠️ **永远不要**将API密钥提交到代码仓库
2. 使用Render的环境变量功能来管理敏感信息
3. 定期轮换API密钥
4. 监控API使用量和费用

## 本地开发 vs 生产环境

- **本地开发**: 使用 `.env` 文件
- **生产环境**: 使用Render环境变量
- 代码会自动检测环境并使用正确的配置