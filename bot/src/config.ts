// Конфиг бота из переменных окружения.

export const config = {
  botToken: process.env.BOT_TOKEN ?? '',
  webAppUrl: process.env.WEBAPP_URL ?? '',
};

export function assertConfig(): void {
  if (!config.botToken) throw new Error('BOT_TOKEN не задан (см. .env.example)');
  if (!config.webAppUrl) throw new Error('WEBAPP_URL не задан (см. .env.example)');
}
