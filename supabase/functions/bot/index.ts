// Edge-функция Supabase: вебхук Telegram-бота.
// Пока — реакция на /start: приветствие + кнопка, открывающая Mini App.
//
// Деплой: supabase functions deploy bot --no-verify-jwt   (Telegram не шлёт JWT)
// Вебхук: setWebhook на URL этой функции (см. README).

const BOT_TOKEN = Deno.env.get('BOT_TOKEN') ?? '';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';
const WEBAPP_URL = 'https://ventilia.github.io/Avangard/';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string, replyMarkup?: unknown) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok');

  // Защита вебхука: если задан секрет — проверяем заголовок от Telegram.
  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  let update: { message?: { chat: { id: number }; text?: string } };
  try {
    update = await req.json();
  } catch {
    return new Response('ok');
  }

  const msg = update.message;
  if (msg?.text && msg.text.split(' ')[0] === '/start') {
    await sendMessage(
      msg.chat.id,
      'Рядовой Авангард на месте! Олег ждёт — щетина сама не сбреется. Загляни в казарму.',
      { inline_keyboard: [[{ text: '🪒 Открыть казарму', web_app: { url: WEBAPP_URL } }]] },
    );
  }

  return new Response('ok');
});
