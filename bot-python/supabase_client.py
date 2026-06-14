"""
Тонкий async-клиент Supabase с in-memory кешем.
Кеш снижает нагрузку: повторные читалки одного user_id за 5 минут
не идут в базу — берутся из памяти.
"""

import time
from typing import Optional
import aiohttp
import config

_TTL = 300  # секунд — время жизни кеша пользователя
_cache: dict[int, tuple[dict, float]] = {}  # telegram_id -> (data, expires_at)


def _cache_get(uid: int) -> Optional[dict]:
    entry = _cache.get(uid)
    if entry and time.monotonic() < entry[1]:
        return entry[0]
    _cache.pop(uid, None)
    return None


def _cache_set(uid: int, data: dict) -> None:
    _cache[uid] = (data, time.monotonic() + _TTL)


def _cache_invalidate(uid: int) -> None:
    _cache.pop(uid, None)


def _headers() -> dict:
    return {
        "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def get_player(session: aiohttp.ClientSession, telegram_id: int) -> Optional[dict]:
    """Возвращает запись игрока из кеша или Supabase."""
    cached = _cache_get(telegram_id)
    if cached is not None:
        return cached

    url = f"{config.SUPABASE_URL}/rest/v1/players"
    params = {"telegram_id": f"eq.{telegram_id}", "select": "*", "limit": "1"}

    async with session.get(url, headers=_headers(), params=params) as resp:
        if resp.status != 200:
            return None
        rows = await resp.json()
        if not rows:
            return None
        _cache_set(telegram_id, rows[0])
        return rows[0]


async def upsert_player(session: aiohttp.ClientSession, data: dict) -> Optional[dict]:
    """Создаёт или обновляет запись игрока; инвалидирует кеш."""
    url = f"{config.SUPABASE_URL}/rest/v1/players"
    headers = {**_headers(), "Prefer": "resolution=merge-duplicates,return=representation"}

    async with session.post(url, headers=headers, json=data) as resp:
        if resp.status not in (200, 201):
            return None
        rows = await resp.json()
        row = rows[0] if rows else None
        if row:
            _cache_set(data["telegram_id"], row)
        return row


async def ensure_player(
    session: aiohttp.ClientSession,
    telegram_id: int,
    first_name: str | None = None,
    username: str | None = None,
) -> Optional[dict]:
    """
    Гарантирует существование записи игрока.
    Сначала пробуем из кеша, при промахе — upsert только с базовыми полями.
    Это одна операция вместо SELECT + INSERT.
    """
    cached = _cache_get(telegram_id)
    if cached is not None:
        return cached

    data: dict = {"telegram_id": telegram_id}
    if first_name:
        data["first_name"] = first_name
    if username:
        data["username"] = username

    return await upsert_player(session, data)
