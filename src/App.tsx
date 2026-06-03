import { isTelegram, tg } from './telegram';

// Заглушка-«пустырь». Реальный экран появится, когда будет концепция.
export function App() {
  const user = tg?.initDataUnsafe.user;

  return (
    <main className="screen">
      <div className="badge">пустырь · v0</div>
      <h1>Рядовой&nbsp;Авангард</h1>
      <p className="sub">
        {isTelegram
          ? user
            ? `На связи, ${user.first_name}. Каркас Mini App работает.`
            : 'Каркас Mini App работает. Ждём концепцию.'
          : 'Открой это внутри Telegram-бота — здесь появится приложение.'}
      </p>

      {isTelegram && (
        <dl className="meta">
          <div>
            <dt>Платформа</dt>
            <dd>{tg?.platform}</dd>
          </div>
          <div>
            <dt>Версия WebApp</dt>
            <dd>{tg?.version}</dd>
          </div>
          <div>
            <dt>Тема</dt>
            <dd>{tg?.colorScheme}</dd>
          </div>
        </dl>
      )}
    </main>
  );
}
