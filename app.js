document.addEventListener('DOMContentLoaded', function() {
    // 获取所有需要的DOM元素
    const calendarEl = document.getElementById('calendar');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const modal = document.getElementById('confirmation-modal');
    const eventForm = document.getElementById('event-form');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const locationInput = document.getElementById('event-location');
    const todoList = document.getElementById('todo-list');
    const todoCompleted = document.getElementById('todo-completed');
    const todoTotal = document.getElementById('todo-total');

    // 全局变量：当前编辑的事件
    let currentEditingEvent = null;

    // ---- 数据持久化功能 ----
    const STORAGE_KEY = 'ai_calendar_events';

    // 保存事件到本地存储
    function saveEventsToStorage() {
        const events = calendar.getEvents().map(event => ({
            id: event.id,
            title: event.title,
            start: event.start ? event.start.toISOString() : null,
            end: event.end ? event.end.toISOString() : null,
            location: event.extendedProps.location || '',
            priority: event.extendedProps.priority || 'medium',
            completed: event.extendedProps.completed || false
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        console.log('事件已保存到本地存储:', events.length, '个事件');
    }

    // 从本地存储加载事件
    function loadEventsFromStorage() {
        try {
            const savedEvents = localStorage.getItem(STORAGE_KEY);
            if (savedEvents) {
                const events = JSON.parse(savedEvents);
                console.log('从本地存储加载事件:', events.length, '个事件');
                return events;
            }
        } catch (error) {
            console.error('加载事件数据失败:', error);
        }
        return [];
    }

    // 清空本地存储
    function clearStorage() {
        localStorage.removeItem(STORAGE_KEY);
        console.log('本地存储已清空');
    }

    // 初始化 FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'zh-cn', // 设置为中文
        editable: true,
        selectable: true,
        events: loadEventsFromStorage(), // 从本地存储加载事件
        // 根据事件的紧急度添加不同的CSS class
        eventClassNames: function(arg) {
            let priority = arg.event.extendedProps.priority;
            if (priority) {
                return [`priority-${priority}`];
            }
            return [];
        },
        // 事件点击处理器 - 编辑事件
        eventClick: function(info) {
            currentEditingEvent = info.event;
            
            // 填充表单数据
            titleInput.value = info.event.title;
            
            // 处理日期和时间
            const startDate = info.event.start;
            if (startDate) {
                const year = startDate.getFullYear();
                const month = String(startDate.getMonth() + 1).padStart(2, '0');
                const day = String(startDate.getDate()).padStart(2, '0');
                const hours = String(startDate.getHours()).padStart(2, '0');
                const minutes = String(startDate.getMinutes()).padStart(2, '0');
                
                dateInput.value = `${year}-${month}-${day}`;
                timeInput.value = `${hours}:${minutes}`;
            }
            
            locationInput.value = info.event.extendedProps.location || '';
            
            // 设置优先级
            const priority = info.event.extendedProps.priority || 'medium';
            const priorityRadio = document.querySelector(`input[name="priority"][value="${priority}"]`);
            if (priorityRadio) {
                priorityRadio.checked = true;
            }
            
            // 显示删除按钮并更改确认按钮文本
            document.getElementById('delete-btn').style.display = 'inline-block';
            document.getElementById('confirm-btn').textContent = '确认修改';
            
            // 显示模态框
            modal.style.display = 'flex';
            
            // 添加聊天消息
            addMessage(`正在编辑事件："${info.event.title}"`, 'ai');
        },
        // 日期选择处理器 - 快速创建事件
        select: function(info) {
            const selectedDate = info.start;
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            
            // 清空当前编辑事件
            currentEditingEvent = null;
            
            // 预填充选中的日期
            titleInput.value = '';
            dateInput.value = `${year}-${month}-${day}`;
            timeInput.value = '09:00';
            locationInput.value = '';
            
            // 设置默认优先级
            const defaultPriority = document.querySelector('input[name="priority"][value="medium"]');
            if (defaultPriority) {
                defaultPriority.checked = true;
            }
            
            // 隐藏删除按钮并重置确认按钮文本
            document.getElementById('delete-btn').style.display = 'none';
            document.getElementById('confirm-btn').textContent = '确认添加';
            
            // 显示模态框
            modal.style.display = 'flex';
            
            // 添加聊天消息
            addMessage(`为 ${year}年${month}月${day}日 创建新事件`, 'ai');
        }
    });
    calendar.render();

    // 初始化待办事项列表
    updateTodoList();

    // ---- 核心功能：表单提交处理 ----
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const text = userInput.value.trim();
        if (text === '') return;

        // 在聊天框显示用户消息
        addMessage(text, 'user');
        userInput.value = '';

        // 检查是否是特殊命令
        if (handleSpecialCommands(text)) {
            return; // 如果是特殊命令，直接返回
        }

        // 模拟AI处理
        addMessage('正在为您解析...', 'ai', true);
        mockApiCall(text)
            .then(data => {
                removeTypingIndicator();
                if (data.needsClarification) {
                    addMessage(data.message, 'ai');
                } else {
                    // 填充并显示确认弹窗
                    titleInput.value = data.title;
                    dateInput.value = data.date;
                    timeInput.value = data.time;
                    locationInput.value = data.location;
                    modal.style.display = 'flex';
                }
            });
    });

    // ---- 核心功能：确认日程 ----
    eventForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = titleInput.value;
        const date = dateInput.value;
        const time = timeInput.value;
        const location = locationInput.value;
        const priority = document.querySelector('input[name="priority"]:checked').value;

        if (currentEditingEvent) {
            // 编辑现有事件
            currentEditingEvent.setProp('title', title);
            currentEditingEvent.setStart(`${date}T${time}`);
            currentEditingEvent.setExtendedProp('location', location);
            currentEditingEvent.setExtendedProp('priority', priority);
            
            // 保存到本地存储
            saveEventsToStorage();
            
            // 更新待办事项列表
            updateTodoList();
            
            // 关闭弹窗并发送确认消息
            modal.style.display = 'none';
            addMessage(`好的，已更新事件："${title}"，优先级设为"${priority}"。`, 'ai');
            
            // 清空当前编辑事件
            currentEditingEvent = null;
            
            // 重置按钮状态
            document.getElementById('delete-btn').style.display = 'none';
            document.getElementById('confirm-btn').textContent = '确认添加';
        } else {
            // 创建新事件
            calendar.addEvent({
                title: title,
                start: `${date}T${time}`,
                extendedProps: {
                    location: location,
                    priority: priority
                }
            });

            // 保存到本地存储
            saveEventsToStorage();

            // 更新待办事项列表
            updateTodoList();

            // 关闭弹窗并发送确认消息
            modal.style.display = 'none';
            addMessage(`好的，已为您安排日程："${title}"，并标记为"${priority}"紧急度。`, 'ai');
            
            // 重置按钮状态
            document.getElementById('delete-btn').style.display = 'none';
            document.getElementById('confirm-btn').textContent = '确认添加';
        }
    });
    
    // 取消按钮
    cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        currentEditingEvent = null; // 清空编辑状态
        // 重置按钮状态
        document.getElementById('delete-btn').style.display = 'none';
        document.getElementById('confirm-btn').textContent = '确认添加';
        addMessage('好的，已取消本次操作。', 'ai');
    });

    // 删除按钮
    const deleteBtn = document.getElementById('delete-btn');
    deleteBtn.addEventListener('click', function() {
        if (currentEditingEvent) {
            const eventTitle = currentEditingEvent.title;
            
            // 删除事件
            currentEditingEvent.remove();
            
            // 保存到本地存储
            saveEventsToStorage();
            
            // 更新待办事项列表
            updateTodoList();
            
            modal.style.display = 'none';
            currentEditingEvent = null;
            
            // 重置按钮状态
            document.getElementById('delete-btn').style.display = 'none';
            document.getElementById('confirm-btn').textContent = '确认添加';
            
            addMessage(`事件"${eventTitle}"已删除。`, 'ai');
        }
    });

    // ---- 待办事项功能 ----
    
    // 更新待办事项列表
    function updateTodoList() {
        const events = calendar.getEvents();
        const sortedEvents = events.sort((a, b) => {
            // 按日期排序，未完成的在前
            if (a.extendedProps.completed !== b.extendedProps.completed) {
                return a.extendedProps.completed ? 1 : -1;
            }
            return new Date(a.start) - new Date(b.start);
        });

        // 清空列表
        todoList.innerHTML = '';

        if (sortedEvents.length === 0) {
            todoList.innerHTML = '<div class="todo-empty">暂无待办事项</div>';
            updateTodoStats(0, 0);
            return;
        }

        // 生成待办事项
        sortedEvents.forEach(event => {
            const todoItem = createTodoItem(event);
            todoList.appendChild(todoItem);
        });

        // 更新统计
        const completedCount = sortedEvents.filter(e => e.extendedProps.completed).length;
        updateTodoStats(completedCount, sortedEvents.length);
    }

    // 创建单个待办事项元素
    function createTodoItem(event) {
        const item = document.createElement('div');
        item.className = `todo-item ${event.extendedProps.completed ? 'completed' : ''}`;
        item.dataset.eventId = event.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = event.extendedProps.completed || false;
        checkbox.addEventListener('change', () => toggleEventCompletion(event.id));

        const content = document.createElement('div');
        content.className = 'todo-content';

        const title = document.createElement('div');
        title.className = 'todo-title';
        title.textContent = event.title;

        const details = document.createElement('div');
        details.className = 'todo-details';

        // 时间信息
        const timeSpan = document.createElement('span');
        timeSpan.className = 'todo-time';
        if (event.start) {
            const date = new Date(event.start);
            const dateStr = date.toLocaleDateString('zh-CN', { 
                month: 'short', 
                day: 'numeric' 
            });
            const timeStr = date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            timeSpan.textContent = `${dateStr} ${timeStr}`;
        }

        // 地点信息
        const locationSpan = document.createElement('span');
        locationSpan.className = 'todo-location';
        if (event.extendedProps.location) {
            locationSpan.textContent = `📍 ${event.extendedProps.location}`;
        }

        // 优先级标签
        const prioritySpan = document.createElement('span');
        prioritySpan.className = `todo-priority ${event.extendedProps.priority || 'medium'}`;
        const priorityText = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        prioritySpan.textContent = priorityText[event.extendedProps.priority] || '中';

        details.appendChild(timeSpan);
        if (event.extendedProps.location) {
            details.appendChild(locationSpan);
        }
        details.appendChild(prioritySpan);

        content.appendChild(title);
        content.appendChild(details);

        item.appendChild(checkbox);
        item.appendChild(content);

        // 点击事项可以编辑
        content.addEventListener('click', () => {
            // 触发日历事件点击
            const calendarEvent = calendar.getEventById(event.id);
            if (calendarEvent) {
                // 模拟事件点击
                currentEditingEvent = calendarEvent;
                
                // 填充表单数据
                titleInput.value = calendarEvent.title;
                
                // 处理日期和时间
                const startDate = calendarEvent.start;
                if (startDate) {
                    const year = startDate.getFullYear();
                    const month = String(startDate.getMonth() + 1).padStart(2, '0');
                    const day = String(startDate.getDate()).padStart(2, '0');
                    const hours = String(startDate.getHours()).padStart(2, '0');
                    const minutes = String(startDate.getMinutes()).padStart(2, '0');
                    
                    dateInput.value = `${year}-${month}-${day}`;
                    timeInput.value = `${hours}:${minutes}`;
                }
                
                locationInput.value = calendarEvent.extendedProps.location || '';
                
                // 设置优先级
                const priority = calendarEvent.extendedProps.priority || 'medium';
                const priorityRadio = document.querySelector(`input[name="priority"][value="${priority}"]`);
                if (priorityRadio) {
                    priorityRadio.checked = true;
                }
                
                // 显示删除按钮并更改确认按钮文本
                document.getElementById('delete-btn').style.display = 'inline-block';
                document.getElementById('confirm-btn').textContent = '确认修改';
                
                // 显示模态框
                modal.style.display = 'flex';
                
                // 添加聊天消息
                addMessage(`正在编辑事件："${calendarEvent.title}"`, 'ai');
            }
        });

        return item;
    }

    // 切换事件完成状态
    function toggleEventCompletion(eventId) {
        const event = calendar.getEventById(eventId);
        if (event) {
            const newCompletedState = !event.extendedProps.completed;
            event.setExtendedProp('completed', newCompletedState);
            
            // 保存到本地存储
            saveEventsToStorage();
            
            // 更新待办事项列表
            updateTodoList();
            
            // 添加反馈消息
            const action = newCompletedState ? '完成' : '取消完成';
            addMessage(`已${action}事件："${event.title}"`, 'ai');
        }
    }

    // 更新统计信息
    function updateTodoStats(completed, total) {
        todoCompleted.textContent = completed;
        todoTotal.textContent = total;
    }

    // ---- 特殊命令处理 ----
    function handleSpecialCommands(text) {
        const command = text.toLowerCase().trim();
        
        switch (command) {
            case '导出数据':
            case '备份数据':
                exportData();
                return true;
                
            case '导入数据':
            case '恢复数据':
                importData();
                return true;
                
            case '清空数据':
            case '删除所有事件':
                clearAllData();
                return true;
                
            case '查看存储':
            case '存储状态':
                showStorageStatus();
                return true;
                
            case '帮助':
            case '命令':
                showHelp();
                return true;
                
            default:
                return false; // 不是特殊命令
        }
    }

    // 导出数据
    function exportData() {
        const events = calendar.getEvents().map(event => ({
            title: event.title,
            start: event.start ? event.start.toISOString() : null,
            end: event.end ? event.end.toISOString() : null,
            location: event.extendedProps.location || '',
            priority: event.extendedProps.priority || 'medium'
        }));
        
        const dataStr = JSON.stringify(events, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `calendar_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        addMessage(`已导出 ${events.length} 个事件到文件。`, 'ai');
    }

    // 导入数据
    function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const events = JSON.parse(e.target.result);
                        
                        // 清空现有事件
                        calendar.removeAllEvents();
                        
                        // 添加导入的事件
                        events.forEach(event => {
                            calendar.addEvent(event);
                        });
                        
                        // 保存到本地存储
                        saveEventsToStorage();
                        
                        addMessage(`成功导入 ${events.length} 个事件。`, 'ai');
                    } catch (error) {
                        addMessage('导入失败：文件格式不正确。', 'ai');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
        addMessage('请选择要导入的备份文件...', 'ai');
    }

    // 清空所有数据
    function clearAllData() {
        if (confirm('确定要删除所有事件吗？此操作不可撤销！')) {
            calendar.removeAllEvents();
            clearStorage();
            addMessage('所有事件已清空。', 'ai');
        } else {
            addMessage('已取消清空操作。', 'ai');
        }
    }

    // 显示存储状态
    function showStorageStatus() {
        const events = calendar.getEvents();
        const storageSize = localStorage.getItem(STORAGE_KEY)?.length || 0;
        addMessage(`当前共有 ${events.length} 个事件，本地存储占用 ${storageSize} 字符。`, 'ai');
    }

    // 显示帮助信息
    function showHelp() {
        const helpText = `可用命令：
• 导出数据 - 备份所有事件到文件
• 导入数据 - 从文件恢复事件
• 清空数据 - 删除所有事件
• 查看存储 - 显示存储状态
• 帮助 - 显示此帮助信息

您也可以直接输入自然语言来创建事件，或点击日历进行操作。`;
        addMessage(helpText, 'ai');
    }

    // ---- 辅助函数 ----

    // 添加消息到聊天框
    function addMessage(text, sender, isTyping = false) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', sender);
        if (isTyping) {
            messageEl.id = 'typing-indicator';
            messageEl.textContent = '● ● ●';
        } else {
            messageEl.textContent = text;
        }
        chatBox.appendChild(messageEl);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if(indicator) indicator.remove();
    }

    // ******************************************************
    // ******** AI能力调用函数 (DeepSeek API) ***********
    // 调用后端API来解析用户的自然语言输入
    // ******************************************************
    async function mockApiCall(text) {
        console.log("调用DeepSeek API，输入:", text);
        
        try {
            const response = await fetch('/api/parse-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("AI解析结果:", data);
            
            return data;
        } catch (error) {
            console.error('API调用失败:', error);
            // 如果API调用失败，返回错误信息
            return {
                needsClarification: true,
                message: '抱歉，AI服务暂时不可用，请稍后再试。您也可以直接在日历上添加事件。'
            };
        }
    }

    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            currentEditingEvent = null; // 清空编辑状态
            // 重置按钮状态
            document.getElementById('delete-btn').style.display = 'none';
            document.getElementById('confirm-btn').textContent = '确认添加';
            addMessage('好的，已取消本次操作。', 'ai');
        }
    });

    // 键盘快捷键支持
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none';
            currentEditingEvent = null; // 清空编辑状态
            // 重置按钮状态
            document.getElementById('delete-btn').style.display = 'none';
            document.getElementById('confirm-btn').textContent = '确认添加';
            addMessage('好的，已取消本次操作。', 'ai');
        }
    });
});