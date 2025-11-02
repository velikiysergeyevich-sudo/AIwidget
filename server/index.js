require('dotenv').config();

const express = require('express');

const cors = require('cors');

const bodyParser = require('body-parser');

const OpenAI = require('openai');

const axios = require('axios');

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware

app.use(cors());

app.use(bodyParser.json());

app.use(express.static('public'));

// OpenAI Configuration

const openai = new OpenAI({

apiKey: process.env.OPENAI_API_KEY,

});

// Системный промпт для нейропродавца

const SALES_SYSTEM_PROMPT = `Ты - нейропродавец компании ${process.env.COMPANY_NAME || 'lidorubov.net'}, использующий передовые технологии GPT-5. Твоя задача - выявить потребности клиента и продать услугу по передаче голосом подтвержденных клиентов. Ты должен строго следовать скрипту продаж, который включает:

1. ПРИВЕТСТВИЕ: Представься и кратко опиши суть услуги

"Вас приветствует нейропродавец компании lidorubov.net. Мы передаем вам только тех клиентов, которые голосом подтвердили, что хотят у вас купить. Это не реклама, а готовые продажи. У вас есть 2 минуты?"

2. АВТОРИТЕТ: Расскажи про успешные кейсы

"Мы работаем с крупными компаниями: Открытие Банк, BMW, Skillbox, Сбербанк и другими. Более 7 лет в нише, с кейсами роста продаж на 30-50% за 2-3 месяца."

3. ДИАГНОСТИКА: Задай 5 ключевых вопросов для выявления потребностей:

- "Какой у вас текущий средний чек?"

- "Каким образом вы привлекаете клиентов? (реклама, рекомендации, холдколы и т.д.)"

- "У вас есть сайт? Если да, поделитесь URL."

- "Вы используете Яндекс Директ или другие рекламные каналы?"

- "У вас есть отдел продаж? Если да, занимаются ли они холодными звонками?"

4. ПРЕЗЕНТАЦИЯ: Объясни преимущества нашей услуги

"Наши алгоритмы находят людей, которые прямо сейчас ищут ваши услуги, фильтруем их по критериям, подтверждают интерес голосом, и передаём вам уже готовых к покупке клиентов."

5. ZOOM/КОНТАКТ: Предложи встречу или попроси контакт

"Предлагаю за 20 минут в Zoom показать конкретные цифры и кейсы по вашей нише. Когда вам удобнее — завтра в 10:00 или в 14:00? Или оставьте телефон, и мы с вами свяжемся."

6. ВОЗРАЖЕНИЯ: Если отказ - настойчиво предложи Zoom или возьми телефон

"Понимаю, что вы сначала хотите всё обдумать. Но решение здесь простое: либо вы видите, как это работает в вашей нише, либо нет. 20 минут в Zoom — и вы сами решите. Когда ставим встречу?"

Особенности поведения:

- Будь настойчивым, но вежливым

- Используй полученную информацию для персонализации ответов

- Запоминай ответы клиента и используй их в дальнейшем разговоре

- Если клиент дал ключевую информацию (телефон, email, согласие на встречу) - сразу переадресуй к следующему этапу

- Говори коротко и по делу

- Используй данные из разговора для усиления убедительности

Не отклоняйся от скрипта. Переходи к следующему этапу только после получения ответа пользователя на текущий вопрос, если это уместно.`;

// Хранилище диалогов (в реальном проекте использовать БД)

const conversations = new Map();

// Определение этапа лида

function detectLeadStage(userMessage, conversationHistory) {

const message = userMessage.toLowerCase();

const triggers = {

'zoom': 'Согласие на встречу',

'встреча': 'Согласие на встречу',

'телефон': 'Оставил контакты',

'позвоните': 'Запрос звонка',

'звоните': 'Запрос звонка',

'email': 'Оставил контакты',

'почта': 'Оставил контакты',

'подумать': 'Возражение - подумать',

'нет времени': 'Возражение - нет времени',

'не интересует': 'Возражение - не интересует',

'не нужно': 'Возражение - не интересует',

'уже есть': 'Возражение - уже есть решение',

'интересует': 'Проявил интерес',

'готов обсудить': 'Проявил интерес',

'да': conversationHistory.length > 2 ? 'Положительный ответ' : null,

'ок': conversationHistory.length > 2 ? 'Положительный ответ' : null,

'ладно': conversationHistory.length > 2 ? 'Положительный ответ' : null,

'согласен': 'Согласие на встречу',

'давайте': 'Согласие на встречу',

'запишите': 'Согласие на встречу',

'мне подходит': 'Согласие на встречу',

'средний чек': 'Диагностика - средний чек упомянут',

'реклама': 'Диагностика - канал привлечения',

'сайт': 'Диагностика - упоминание сайта',

'директ': 'Диагностика - упоминание рекламы',

'отдел продаж': 'Диагностика - упоминание отдела продаж',

'холодные звонки': 'Диагностика - упоминание холодных звонков',

};

for (const [keyword, stage] of Object.entries(triggers)) {

if (message.includes(keyword) && stage) {

return stage;

}
}

return null;
}

// Извлечение контактов из сообщения

function extractContacts(message) {

const phoneRegex = /\+?[0-9]{1,4}?[-.\s]?\(?[0-9]{1,4}?\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g;

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

const phones = message.match(phoneRegex) || [];

const emails = message.match(emailRegex) || [];

const urls = message.match(urlRegex) || [];

return {

phones,

emails,

urls,

hasContacts: phones.length > 0 || emails.length > 0 || urls.length > 0

};
}

// Отправка уведомления в Telegram

async function sendTelegramNotification(leadData) {

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {

console.log('Telegram не настроен. Лид:', leadData);

return;

}

// Поддержка нескольких chat_id через запятую

const chatIds = process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(id => id);

const { stage, contacts, userMessage, conversationHistory } = leadData;

const lastMessages = conversationHistory

.slice(-5) // Увеличим до 5 последних сообщений для лучшего контекста

.map(msg => `${msg.role === 'user' ? '👤 Клиент' : '🤖 Нейропродавец'}: ${msg.content}`)

.join('\n');

let contactsInfo = 'Контакты не указаны';

if (contacts.hasContacts) {

if (contacts.phones.length > 0) contactsInfo = `📞 Телефон: ${contacts.phones.join(', ')}\n`;

if (contacts.emails.length > 0) contactsInfo += `📧 Email: ${contacts.emails.join(', ')}\n`;

if (contacts.urls.length > 0) contactsInfo += `🌐 Сайт: ${contacts.urls.join(', ')}\n`;

contactsInfo = contactsInfo.trim();

}

// Анализируем разговор, чтобы извлечь информацию о потребностях клиента

const conversationText = conversationHistory.map(msg => msg.content).join(' ');

const needsInfo = analyzeClientNeeds(conversationText);

let needsInfoText = '';

if (needsInfo.length > 0) {

needsInfoText = `\n📋 Выявленные потребности:\n${needsInfo.map(need => `• ${need}`).join('\n')}\n`;

}

const messageText = `🎯 НОВЫЙ ЛИД | ${process.env.COMPANY_NAME || 'lidorubov.net'}

──────────────

⏰ Время: ${new Date().toLocaleString('ru-RU')}

📊 Этап: ${stage}

${contactsInfo}

${needsInfoText}

💬 Последнее сообщение: "${userMessage}"

📜 История разговора (последние 5 сообщений):

${lastMessages}`;

// Отправка уведомления всем администраторам

const sendPromises = chatIds.map(chatId =>

axios.post(

`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,

{ chat_id: chatId, text: messageText, parse_mode: 'HTML' }

).catch(error => {

console.error(`❌ Ошибка отправки в Telegram (chat_id: ${chatId}):`, error.message);

return null;

})

);

try {

const results = await Promise.allSettled(sendPromises);

const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;

console.log(`✅ Уведомление отправлено ${successCount} из ${chatIds.length} администраторам`);

} catch (error) {

console.error('❌ Критическая ошибка отправки в Telegram:', error.message);

}
}

// Функция для анализа потребностей клиента по истории разговора

function analyzeClientNeeds(conversationText) {

const lowerText = conversationText.toLowerCase();

const needs = [];

// Проверяем наличие информации о среднем чеке

const avgCheckMatch = lowerText.match(/средний чек[:\s]*([0-9\s.,]+)/i);

if (avgCheckMatch) {

needs.push(`Средний чек: ${avgCheckMatch[1].trim()}`);

}

// Проверяем каналы привлечения клиентов

if (lowerText.includes('реклама') || lowerText.includes('рекламу')) {

needs.push('Привлекает клиентов через рекламу');

}

if (lowerText.includes('рекомендации') || lowerText.includes('по рекомендациям')) {

needs.push('Привлекает клиентов по рекомендациям');

}

if (lowerText.includes('холодные') && lowerText.includes('звонк')) {

needs.push('Использует холодные звонки');

}

// Проверяем наличие сайта

if (lowerText.includes('сайт') && !lowerText.includes('нет сайта') && !lowerText.includes('сайта нет')) {

needs.push('Есть сайт');

} else if (lowerText.includes('нет сайта') || lowerText.includes('сайта нет')) {

needs.push('Нет сайта');

}

// Проверяем использование рекламных каналов

if (lowerText.includes('яндекс') && lowerText.includes('директ')) {

needs.push('Использует Яндекс Директ');

}

if (lowerText.includes('google') && (lowerText.includes('ads') || lowerText.includes('adwords'))) {

needs.push('Использует Google Ads');

}

// Проверяем наличие отдела продаж

if (lowerText.includes('отдел продаж') || lowerText.includes('есть отдел')) {

needs.push('Есть отдел продаж');

}

// Если не нашли конкретной информации, указываем общие признаки

if (needs.length === 0) {

if (lowerText.includes('средний') && lowerText.includes('чек')) needs.push('Упоминал средний чек');

if (lowerText.includes('клиент') && (lowerText.includes('привлека') || lowerText.includes('нахожу'))) needs.push('Обсуждал привлечение клиентов');

if (lowerText.includes('сайт')) needs.push('Обсуждал наличие сайта');

if (lowerText.includes('реклам')) needs.push('Обсуждал рекламные каналы');

if (lowerText.includes('директ')) needs.push('Упоминал Яндекс Директ');

if (lowerText.includes('отдел') && lowerText.includes('продаж')) needs.push('Обсуждал отдел продаж');

}

return needs;
}

// API Endpoint для чата

app.post('/api/chat', async (req, res) => {

try {

const { message, sessionId } = req.body;

if (!message || !sessionId) {

return res.status(400).json({ error: 'Требуются message и sessionId' });

}

// Получаем или создаем историю диалога

if (!conversations.has(sessionId)) {

conversations.set(sessionId, [

{ role: 'system', content: SALES_SYSTEM_PROMPT }

]);

}

const conversationHistory = conversations.get(sessionId);

conversationHistory.push({ role: 'user', content: message });

// Вызов OpenAI API (предполагаем, что GPT-5 будет доступен как 'gpt-5' или 'gpt-5-turbo')

const completion = await openai.chat.completions.create({

model: process.env.OPENAI_MODEL || 'gpt-5', // Изменено на GPT-5

messages: conversationHistory,

temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3,

max_tokens: 800, // Увеличиваем лимит для более сложной модели

});

const aiResponse = completion.choices[0].message.content;

conversationHistory.push({ role: 'assistant', content: aiResponse });

// Определяем, является ли это лидом

const leadStage = detectLeadStage(message, conversationHistory);

const contacts = extractContacts(message);

if (leadStage || contacts.hasContacts) {

// Отправляем уведомление в Telegram

await sendTelegramNotification({

stage: leadStage || 'Оставил контакты',

contacts,

userMessage: message,

conversationHistory: conversationHistory.filter(msg => msg.role !== 'system')

});

}

res.json({

response: aiResponse,

isLead: !!leadStage || contacts.hasContacts,

leadStage

});

} catch (error) {

console.error('Ошибка в /api/chat:', error);

res.status(500).json({

error: 'Ошибка сервера',

message: error.message

});

}

});

// Healthcheck endpoint

app.get('/api/health', (req, res) => {

res.json({

status: 'ok',

version: process.env.SALES_SCRIPT_VERSION || '1.0',

timestamp: new Date().toISOString()

});

});

// Запуск сервера

app.listen(PORT, () => {

console.log(`🚀 Сервер запущен на порту ${PORT}`);

console.log(`📊 Версия скрипта: ${process.env.SALES_SCRIPT_VERSION || '1.0'}`);

console.log(`🤖 Модель OpenAI: ${process.env.OPENAI_MODEL || 'gpt-4'}`);

});
