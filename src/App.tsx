import { useGame } from './game/useGame';
import { Oleg } from './components/Oleg';
import { DembelTimer } from './components/DembelTimer';
import { WeekBoard } from './components/WeekBoard';
import { Dialogue } from './components/Dialogue';
import { Stats } from './components/Stats';
import { ActionButton } from './components/ActionButton';
import { isTelegram } from './telegram';

export function App() {
  const g = useGame();

  return (
    <main className="app">
      <header className="topbar">
        <h1 className="title">
          РЯДОВОЙ <b>АВАНГАРД</b>
        </h1>
        <div className="streak" title="стрик">🔥 {g.streak}</div>
      </header>

      <DembelTimer />

      <section className="stage">
        <Oleg stubble={g.stubble} flash={g.flash} />
        <Dialogue text={g.olegLine} />
      </section>

      <ActionButton ritual={g.todayRitual} done={g.todayDone} onDo={g.complete} />

      <WeekBoard rituals={g.week} todayWeekday={g.todayWeekday} doneWeekdays={g.doneThisWeek} />

      <Stats streak={g.streak} best={g.bestStreak} total={g.total} served={g.served} progress={g.progress} />

      {/* Dev-панель видна только вне Telegram — чтобы тестировать неделю. */}
      {!isTelegram && (
        <div className="dev">
          <span>dev:</span>
          <button onClick={() => g.travel(-1)}>← день</button>
          <button onClick={() => g.travel(1)}>день →</button>
          <button onClick={g.reset}>сброс</button>
          <span className="dev__off">offset {g.dayOffset}</span>
        </div>
      )}
    </main>
  );
}
