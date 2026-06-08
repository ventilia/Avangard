import { useEffect, useState, type CSSProperties } from 'react';
import { oleg, pickScene } from './scenes';
import { initTelegram } from './telegram';


const DUST = Array.from({ length: 16 }, () => ({
    left: Math.random() * 100,
    size: 1 + Math.random() * 2.4,
    delay: Math.random() * 14,
    dur: 16 + Math.random() * 16,
    drift: (Math.random() * 2 - 1) * 7, // влево/вправо за время полёта, vw
    max: 0.18 + Math.random() * 0.32, // пиковая яркость
}));


const RAIL_SLOTS = 3;

export function App() {
    // Сцену выбираем один раз за заход. Перезагрузка страницы = новая сцена.
    const [scene] = useState(pickScene);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        initTelegram();
    }, []);

    // Дефолты расположения Олега. Центрирован по умолчанию.
    // max-width: 96vw на .oleg не даёт рукам вылезти за края —
    // браузер сам выберет ограничивающую сторону (высота или ширина).
    const olegWrap: CSSProperties = {
        '--ox': `${scene.oleg.xPct ?? 0}%`,
        height: `${scene.oleg.heightVh ?? 78}vh`,
        bottom: `${-(scene.oleg.dropVh ?? 4)}vh`,
    } as CSSProperties;

    return (
        <div className="stage">
            {/* Фон сцены + медленный Ken Burns.
          URL в кавычках — иначе CSS ломается на пробелах и скобках в именах файлов. */}
            <div className="bg" style={{ backgroundImage: `url("${scene.src}")` }} />

            {/* Кинематографичный цветокор и затемнение по краям кадра */}
            <div className="grade" />

            {/* Затемнение пустого пола (за Олегом) */}
            <div className="floor-fade" />

            {/* Олег: центрируется флексом, низ растворяется маской */}
            <div className="oleg-wrap" style={olegWrap}>
                <img className="oleg" src={oleg} alt="Олег" draggable={false} />
            </div>

            {/* Доп. растворение самого низа поверх Олега — прячет срез торса */}
            <div className="foot-fade" />

            {/* Пылинки */}
            <div className="dust" aria-hidden>
                {DUST.map((d, i) => (
                    <span
                        key={i}
                        style={
                            {
                                left: `${d.left}%`,
                                width: `${d.size}px`,
                                height: `${d.size}px`,
                                '--dur': `${d.dur}s`,
                                '--delay': `${d.delay}s`,
                                '--drift': `${d.drift}vw`,
                                '--max': d.max,
                            } as CSSProperties
                        }
                    />
                ))}
            </div>

            {/* Зерно плёнки — еле заметная живая текстура поверх кадра */}
            <div className="grain" aria-hidden />

            {/* Виньетка для фокуса на Олеге */}
            <div className="vignette" />

            {/* Редкое мерцание ламп */}
            <div className="flicker" aria-hidden />

            {/* ── Хедер ─────────────────────────────────────────────── */}
            <header className="hud-top">
                <h1 className="brand">
                    Рядовой <span className="brand-accent">Авангард</span>
                </h1>
                <button
                    className="burger"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Меню"
                    aria-expanded={menuOpen}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </header>

            {/* ── Нижнее поле: имя/статус слева + три квадрата-действия справа ── */}
            <div className="bottom-field" aria-hidden>
                <div className="bottom-actions">
                    {Array.from({ length: RAIL_SLOTS }, (_, i) => (
                        <div key={i} className="rail-slot" />
                    ))}
                </div>
            </div>

            {/* ── Меню (пока пустое) ─────────────────────────────────── */}
            {menuOpen && (
                <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
                    <aside className="menu-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="menu-head">
                            <span>Меню</span>
                            <button
                                className="menu-close"
                                onClick={() => setMenuOpen(false)}
                                aria-label="Закрыть"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="menu-empty">пока пусто</p>
                    </aside>
                </div>
            )}
        </div>
    );
}