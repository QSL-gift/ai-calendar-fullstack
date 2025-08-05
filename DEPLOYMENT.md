# 部署指南 - Render平台

## 🚀 在Render平台部署AI日历助手

### 前提条件
- GitHub账号
- Render账号（免费）
- SiliconFlow API密钥

### 部署步骤

#### 1. 准备代码仓库
```bash
# 1. 将代码推送到GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/ai-calendar-fullstack.git
git push -u origin main
```

#### 2. 在Render创建Web Service

1. 登录 [Render控制台](https://dashboard.render.com/)
2. 点击 "New +" → "Web Service"
3. 连接您的GitHub仓库
4. 选择 `ai-calendar-fullstack` 仓库

#### 3. 配置部署设置

**基本设置：**
- **Name**: `ai-calendar-fullstack`
- **Environment**: `Node`
- **Region**: 选择离您最近的区域
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### 4. 🔑 配置环境变量（重要！）

在Render控制台的 "Environment" 标签页中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 生产环境标识 |
| `SILICONFLOW_API_KEY` | `你的真实API密钥` | ⚠️ 必须配置 |
| `SILICONFLOW_API_URL` | `https://api.siliconflow.cn/v1/chat/completions` | API端点 |
| `DEEPSEEK_MODEL` | `deepseek-ai/DeepSeek-V3` | AI模型 |

**⚠️ 重要提醒：**
- 绝对不要将API密钥提交到代码仓库
- 只在Render控制台的环境变量中配置真实的API密钥
- `.env` 文件已被 `.gitignore` 排除，不会上传到GitHub

#### 5. 部署和验证

1. 点击 "Create Web Service" 开始部署
2. 等待部署完成（通常需要2-5分钟）
3. 部署成功后，您会获得一个类似这样的URL：
   ```
   https://ai-calendar-fullstack.onrender.com
   ```

#### 6. 测试部署

访问以下地址测试功能：
- **主应用**: `https://你的应用名.onrender.com`
- **测试界面**: `https://你的应用名.onrender.com/test`
- **健康检查**: `https://你的应用名.onrender.com/api/health`

### 🔧 故障排除

#### 常见问题：

1. **API密钥错误 (401 Invalid token)**
   - 检查Render控制台中的 `SILICONFLOW_API_KEY` 是否正确设置
   - 确认API密钥有效且有足够的配额

2. **部署失败**
   - 检查 `package.json` 中的依赖是否正确
   - 查看Render控制台的部署日志

3. **应用无法访问**
   - 确认 `PORT` 环境变量未被错误设置（Render会自动设置）
   - 检查服务器启动日志

#### 查看日志：
在Render控制台的 "Logs" 标签页可以查看实时日志。

### 🔄 更新部署

每次推送代码到GitHub的main分支，Render会自动重新部署：

```bash
git add .
git commit -m "更新功能"
git push origin main
```

### 💰 费用说明

- Render免费计划包含：
  - 750小时/月的运行时间
  - 自动休眠（无活动15分钟后）
  - 自动唤醒（收到请求时）

### 🔒 安全最佳实践

1. **永远不要在代码中硬编码API密钥**
2. **使用环境变量管理敏感信息**
3. **定期轮换API密钥**
4. **监控API使用量和费用**

### 📞 获取帮助

如果遇到问题：
1. 查看Render官方文档
2. 检查应用日志
3. 使用测试界面诊断问题