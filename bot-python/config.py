import os

BOT_TOKEN: str = os.environ["BOT_TOKEN"]
WEBAPP_URL: str = os.environ.get("WEBAPP_URL", "https://ventilia.github.io/Avangard/")
WEBHOOK_SECRET: str = os.environ.get("WEBHOOK_SECRET", "")

# Supabase (опционально — нужны только если включён серверный синк прогресса)
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "")

# Хост и порт для aiohttp-сервера (webhook mode)
HOST: str = os.environ.get("HOST", "0.0.0.0")
PORT: int = int(os.environ.get("PORT", "8080"))
WEBHOOK_PATH: str = os.environ.get("WEBHOOK_PATH", f"/webhook/{BOT_TOKEN}")
BASE_URL: str = os.environ.get("BASE_URL", "")  # напр. https://your-worker.example.com

def is_supabase_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
