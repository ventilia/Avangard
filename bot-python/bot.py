"""
Telegram-бот «Рядовой Авангард» на aiogram 3 + aiohttp webhook.

Запуск в prod (webhook):
    BOT_TOKEN=... WEBAPP_URL=... BASE_URL=https://your-host.com python bot.py

Запуск в dev (polling):
    BOT_TOKEN=... WEBAPP_URL=... DEV=1 python bot.py
"""

import asyncio
import logging
import os
from typing import Any

import aiohttp
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web

import config
import supabase_client as db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

bot = Bot(
    token=config.BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML),
)
dp = Dispatcher()

# Общий aiohttp-сессия для запросов в Supabase — создаётся один раз.
_http: aiohttp.ClientSession | None = None


def get_http() -> aiohttp.ClientSession:
    global _http
    if _http is None or _http.closed:
        _http = aiohttp.ClientSession()
    return _http


def mini_app_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🪒 Открыть казарму",
            web_app=WebAppInfo(url=config.WEBAPP_URL),
        )
    ]])


# ── Команды ──────────────────────────────────────────────────────────────────

@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    user = message.from_user
    name = (user.first_name or "боец") if user else "боец"

    # Регистрируем пользователя в Supabase (только если настроен).
    if config.is_supabase_enabled() and user:
        try:
            await db.ensure_player(
                get_http(),
                telegram_id=user.id,
                first_name=user.first_name,
                username=user.username,
            )
        except Exception as e:
            log.warning("Supabase upsert failed: %s", e)

    text = (
        f"Здарова, {name}! Это <b>Рядовой Авангард</b>.\n\n"
        "Олег скоро уходит в армию. Пока он здесь — помоги ему побриться "
        "и не ударить в грязь лицом перед старшиной.\n\n"
        "Заходи почаще — щетина сама себя не сбреет. 🪒"
    )
    await message.answer(text, reply_markup=mini_app_keyboard())


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    text = (
        "🪒 <b>Рядовой Авангард</b> —бебебебебеа.\n\n"
        "Жми кнопку ниже, чтобы открыть казарму:"
    )
    await message.answer(text, reply_markup=mini_app_keyboard())


@dp.message(Command("stats"))
async def cmd_stats(message: Message) -> None:
    if not config.is_supabase_enabled() or not message.from_user:
        await message.answer("Статистика пока недоступна.")
        return

    try:
        player = await db.get_player(get_http(), message.from_user.id)
        if not player:
            await message.answer("Ты ещё не заходил в казарму. Нажми кнопку ниже!", reply_markup=mini_app_keyboard())
            return

        last_shave = player.get("last_shave_at")
        streak = player.get("streak", 0)
        onboarded = player.get("onboarded", False)

        status = "В казарме" if onboarded else "Ещё не заходил"
        shave_str = f"<code>{last_shave}</code>" if last_shave else "—"

        await message.answer(
            f"📊 <b>Твоя статистика</b>\n\n"
            f"Статус: {status}\n"
            f"Стрик: {streak} 🔥\n"
            f"Последнее бритьё: {shave_str}\n",
            reply_markup=mini_app_keyboard(),
        )
    except Exception as e:
        log.error("Stats error: %s", e)
        await message.answer("Не удалось получить статистику, попробуй позже.")


# ── Fallback ──────────────────────────────────────────────────────────────────

@dp.message()
async def fallback(message: Message) -> None:
    await message.answer(
        "Казарма ждёт, боец. 🪒",
        reply_markup=mini_app_keyboard(),
    )


# ── Запуск ────────────────────────────────────────────────────────────────────

async def on_startup(app: web.Application) -> None:
    webhook_url = f"{config.BASE_URL}{config.WEBHOOK_PATH}"
    await bot.set_webhook(
        webhook_url,
        secret_token=config.WEBHOOK_SECRET or None,
        drop_pending_updates=True,
    )
    log.info("Webhook set: %s", webhook_url)


async def on_shutdown(app: web.Application) -> None:
    if _http and not _http.closed:
        await _http.close()
    await bot.delete_webhook()
    await bot.session.close()


def run_webhook() -> None:
    app = web.Application()
    app.on_startup.append(on_startup)
    app.on_shutdown.append(on_shutdown)

    SimpleRequestHandler(dispatcher=dp, bot=bot, secret_token=config.WEBHOOK_SECRET or None).register(
        app, path=config.WEBHOOK_PATH
    )
    setup_application(app, dp, bot=bot)

    web.run_app(app, host=config.HOST, port=config.PORT)


async def run_polling() -> None:
    log.info("Starting polling (dev mode)...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    if os.environ.get("DEV") or not config.BASE_URL:
        asyncio.run(run_polling())
    else:
        run_webhook()
