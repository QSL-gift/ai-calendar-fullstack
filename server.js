const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// SiliconFlow API 配置 - 从环境变量读取
const API_KEY = process.env.SILICONFLOW_API_KEY;
const API_URL = process.env.SILICONFLOW_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-ai/DeepSeek-V3'; // 使用免费版本

// 调用DeepSeek API的函数
async function callDeepSeekAPI(userMessage) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const prompt = `你是一个智能日程助手。请解析用户的自然语言输入，只要能识别出时间和事件内容就可以创建日程。

用户输入："${userMessage}"

解析规则（宽松解析）：
1. 只要包含时间信息（今天、明天、上午、下午、几点等）和事件内容，就可以创建日程
2. 地点信息是可选的，没有也没关系
3. 时间解析示例：
   - "明天上午" → 明天 09:00
   - "下午3点" → 今天 15:00  
   - "晚上" → 今天 19:00
   - "上午10点" → 今天 10:00
4. 如果只说了相对时间没说具体时间，使用默认时间：
   - 上午 → 09:00
   - 下午 → 14:00
   - 晚上 → 19:00
5. 如果没有日期，默认为今天

当前时间：${today.toLocaleString('zh-CN')}
今天日期：${today.toISOString().split('T')[0]}
明天日期：${tomorrow.toISOString().split('T')[0]}

请返回纯JSON格式（不要用代码块包裹），格式如下：
{
    "needsClarification": false,
    "title": "事件标题",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "location": "",
    "message": "已为您创建日程"
}`;

    const requestBody = {
        model: MODEL,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 1000
    };

    console.log('发送API请求到:', API_URL);
    console.log('使用模型:', MODEL);
    console.log('请求体:', JSON.stringify(requestBody, null, 2));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('API响应状态:', response.status);
        console.log('API响应头:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API错误响应:', errorText);
            throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API响应数据:', JSON.stringify(data, null, 2));
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('API响应格式不正确');
        }

        const aiResponse = data.choices[0].message.content;
        console.log('原始AI响应:', aiResponse);
        
        // 清理AI响应，移除可能的代码块标记
        let cleanedResponse = aiResponse.trim();
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        console.log('清理后的响应:', cleanedResponse);
        
        // 尝试解析JSON响应
        try {
            const parsedResponse = JSON.parse(cleanedResponse);
            return parsedResponse;
        } catch (parseError) {
            console.error('JSON解析错误:', parseError);
            console.error('清理后的响应:', cleanedResponse);
            // 如果JSON解析失败，返回默认响应
            return {
                needsClarification: true,
                message: '抱歉，AI解析出现问题，请重新尝试或提供更清晰的时间和事件信息。'
            };
        }
    } catch (error) {
        console.error('API调用错误:', error);
        return {
            needsClarification: true,
            message: '抱歉，服务暂时不可用，请稍后再试。错误信息：' + error.message
        };
    }
}

// API路由
app.post('/api/parse-schedule', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text || text.trim() === '') {
            return res.status(400).json({
                error: '请提供有效的输入文本'
            });
        }

        console.log('收到解析请求:', text);
        const result = await callDeepSeekAPI(text);
        console.log('AI解析结果:', result);
        
        res.json(result);
    } catch (error) {
        console.error('处理请求时出错:', error);
        res.status(500).json({
            error: '服务器内部错误'
        });
    }
});

// 提供静态文件
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('AI日历助手后端服务已启动');
});