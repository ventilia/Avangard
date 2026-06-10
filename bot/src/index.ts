// Точка входа бота «Рядовой Авангард».
// Каркас: команда /start с кнопкой, открывающей Mini App.
// Раскомментируется и дополняется по мере готовности серверной части.

import { assertConfig, config } from './config.ts';
import { getProgress } from './users.ts';

async function main() {
  assertConfig();

  // TODO: подключить grammY, когда установим зависимости:
  //
  // import { Bot, InlineKeyboard } from 'grammy';
  // const bot = new Bot(config.botToken);
  //
  // bot.command('start', async (ctx) => {
  //   const progress = getProgress(ctx.from!.id);
  //   const kb = new InlineKeyboard().webApp('Открыть казарму', config.webAppUrl);
  //   await ctx.reply('Рядовой Авангард ждёт. Загляни — щетина сама не сбреется.', {
  //     reply_markup: kb,
  //   });
  // });
  //
  // bot.start();

  // Заглушка, чтобы импорты не считались неиспользуемыми до подключения grammY.
  void getProgress;
  console.log('avangard-bot: каркас готов. WebApp:', config.webAppUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
