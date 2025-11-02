(function() {
    'use strict';
    
    // Конфигурация
    const config = window.neuroSalesConfig || {
        apiUrl: 'http://localhost:3000/api',
        company: 'lidorubov.net',
        scriptVersion: '1.0'
    };
    
    // Генерация уникального ID сессии
    const sessionId = generateSessionId();
    
    function generateSessionId() {
        const stored = sessionStorage.getItem('neuro-sales-session');
        if (stored) return stored;
        
        const newId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('neuro-sales-session', newId);
        return newId;
    }
    
    // Создание HTML структуры виджета
    function createWidget() {
        const widgetHTML = `
            <div id="neuro-sales-widget" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                max-height: 600px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                font-family: 'Arial', sans-serif;
                z-index: 10000;
                overflow: hidden;
                transform: translateY(100%);
                transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            ">
                <div id="widget-header" style="
                    background: rgba(255,255,255,0.1);
                    padding: 20px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    backdrop-filter: blur(10px);
                ">
                    <div style="display: flex; align-items: center;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: linear-gradient(45deg, #ff6b6b, #ffa500);
                            border-radius: 50%;
                            margin-right: 15px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                        ">🧠</div>
                        <div>
                            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Neuro Sales AI</h3>
                            <p style="margin: 0; font-size: 12px; opacity: 0.8;">Ваш AI помощник</p>
                        </div>
                    </div>
                    <button id="minimize-btn" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 5px;
                        border-radius: 50%;
                        transition: background 0.2s;
                    ">−</button>
                </div>
                
                <div id="widget-body" style="
                    padding: 20px;
                    max-height: 400px;
                    overflow-y: auto;
                    background: white;
                ">
                    <div id="chat-messages" style="
                        margin-bottom: 20px;
                        max-height: 300px;
                        overflow-y: auto;
                    ">
                        <div class="message bot-message" style="
                            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                            padding: 12px 15px;
                            border-radius: 18px 18px 18px 5px;
                            margin-bottom: 10px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        ">
                            <p style="margin: 0; color: #333; font-size: 14px;">Привет! 👋 Я ваш AI-помощник по продажам. Расскажите, чем могу помочь?</p>
                        </div>
                    </div>
                    
                    <div id="input-area" style="
                        display: flex;
                        gap: 10px;
                        align-items: flex-end;
                    ">
                        <textarea id="user-input" placeholder="Напишите ваш вопрос..." style="
                            flex: 1;
                            border: 2px solid #e1e5e9;
                            border-radius: 12px;
                            padding: 12px 15px;
                            font-size: 14px;
                            resize: none;
                            max-height: 100px;
                            font-family: inherit;
                            transition: border-color 0.2s;
                        "></textarea>
                        <button id="send-btn" style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 12px;
                            padding: 12px 15px;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s;
                            min-width: 60px;
                        ">Отправить</button>
                    </div>
                    
                    <div id="typing-indicator" style="
                        display: none;
                        margin-top: 10px;
                        color: #666;
                        font-style: italic;
                        font-size: 12px;
                    ">AI печатает...</div>
                </div>
            </div>
            
            <div id="widget-toggle" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                z-index: 10001;
                font-size: 24px;
                transition: all 0.3s ease;
            ">💬</div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }
    
    // Инициализация виджета
    function initWidget() {
        createWidget();
        
        const widget = document.getElementById('neuro-sales-widget');
        const toggle = document.getElementById('widget-toggle');
        const minimizeBtn = document.getElementById('minimize-btn');
        const sendBtn = document.getElementById('send-btn');
        const userInput = document.getElementById('user-input');
        const chatMessages = document.getElementById('chat-messages');
        const typingIndicator = document.getElementById('typing-indicator');
        
        let isOpen = false;
        
        // Открытие/закрытие виджета
        function toggleWidget() {
            isOpen = !isOpen;
            if (isOpen) {
                widget.style.transform = 'translateY(0)';
                toggle.style.display = 'none';
            } else {
                widget.style.transform = 'translateY(100%)';
                toggle.style.display = 'flex';
            }
        }
        
        // Обработчики событий
        toggle.addEventListener('click', toggleWidget);
        minimizeBtn.addEventListener('click', toggleWidget);
        
        // Отправка сообщения
        async function sendMessage() {
            const message = userInput.value.trim();
            if (!message) return;
            
            // Добавляем сообщение пользователя
            addMessage(message, 'user');
            userInput.value = '';
            
            // Показываем индикатор печатания
            typingIndicator.style.display = 'block';
            
            try {
                const response = await fetch(`${config.apiUrl}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message,
                        sessionId,
                        company: config.company,
                        timestamp: new Date().toISOString()
                    })
                });
                
                const data = await response.json();
                
                // Скрываем индикатор печатания
                typingIndicator.style.display = 'none';
                
                if (data.success) {
                    addMessage(data.response, 'bot');
                } else {
                    addMessage('Извините, произошла ошибка. Попробуйте еще раз.', 'bot');
                }
            } catch (error) {
                typingIndicator.style.display = 'none';
                addMessage('Не удалось подключиться к серверу. Проверьте подключение к интернету.', 'bot');
            }
        }
        
        // Добавление сообщения в чат
        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            const baseStyle = {
                padding: '12px 15px',
                borderRadius: sender === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
                marginBottom: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                maxWidth: '85%'
            };
            
            const userStyle = {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                marginLeft: 'auto'
            };
            
            const botStyle = {
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                color: '#333'
            };
            
            const finalStyle = { ...baseStyle, ...(sender === 'user' ? userStyle : botStyle) };
            
            messageDiv.style.cssText = Object.entries(finalStyle)
                .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
                .join('; ');
            
            messageDiv.innerHTML = `<p style="margin: 0; font-size: 14px;">${text}</p>`;
            
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        // Обработчики отправки сообщения
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Автоматическое изменение высоты textarea
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
        
        // Эффекты при наведении
        toggle.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        toggle.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        sendBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        
        sendBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        userInput.addEventListener('focus', function() {
            this.style.borderColor = '#667eea';
        });
        
        userInput.addEventListener('blur', function() {
            this.style.borderColor = '#e1e5e9';
        });
        
        // Отправка данных о загрузке виджета
        sendAnalytics('widget_loaded', {
            sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }
    
    // Отправка аналитики
    async function sendAnalytics(event, data) {
        try {
            await fetch(`${config.apiUrl}/analytics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event,
                    data,
                    company: config.company
                })
            });
        } catch (error) {
            // Тихо игнорируем ошибки аналитики
        }
    }
    
    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
    
})();
