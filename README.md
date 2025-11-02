# 🤖 Нейро-виджет продаж 2.0

Умный виджет с GPT-5 для увеличения продаж на вашем сайте + автопубликация в Telegram.

## ✨ Возможности

- 🤖 **GPT-5 интеграция**: Умный помощник для консультаций
- 📱 **Telegram бот**: Автоматическая публикация лидов
- 🎨 **Кастомизация**: Полное управление внешним видом
- 📧 **Email нотификации**: Моментальное уведомление о новых заявках
- 📊 **Аналитика**: Отслеживание конверсий и статистики

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- Аккаунт OpenAI с API ключом
- Telegram бот токен (опционально)

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/velikiysergeyevich-sudo/AIwidget.git
cd AIwidget

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл с вашими ключами

# Запуск сервера
npm start
```

### Конфигурация .env

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Server
PORT=3000
```

## 💻 Использование

### Добавьте на свой сайт:

```html
<!-- Добавьте перед закрывающим </body> -->
<script src="http://your-server:3000/widget.js"></script>
```

### API эндпоинты:

- `POST /api/chat` - Отправка сообщения в чат
- `POST /api/lead` - Создание нового лида
- `GET /api/stats` - Получение статистики

## 🛠️ Технологии

- **Backend**: Node.js + Express
- **AI**: OpenAI GPT-5
- **Мессенджеры**: Telegram Bot API
- **Frontend**: Vanilla JavaScript

## 📝 Лицензия

ISC License

## 🤝 Поддержка

Если у вас есть вопросы или предложения - создайте issue!
