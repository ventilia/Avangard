import { useEffect, useState, type CSSProperties } from 'react';
import { SPRITES, DEFAULT_SPRITE_INDEX, pickScene } from './scenes';
import { initTelegram } from './telegram';


const DUST = Array.from({ length: 16 }, () => ({
    left: Math.random() * 100,
    size: 1 + Math.random() * 2.4,
    delay: Math.random() * 14,
    dur: 16 + Math.random() * 16,
    drift: (Math.random() * 2 - 1) * 7, // влево/вправо за время полёта, vw
    max: 0.18 + Math.random() * 0.32,   // пиковая яркость
}));

const RAIL_SLOTS = 3;

export function App() {
    // Сцену выбираем один раз за заход. Перезагрузка страницы = новая сцена.
    const [scene] = useState(pickScene);
    const [menuOpen, setMenuOpen] = useState(false);

    // Индекс активного спрайта. По дефолту — 7-й (индекс 6).
    // Чтобы сменить спрайт из игровой логики — передавай сюда useState-setter
    // или поднимай состояние выше.
    const [spriteIndex] = useState(DEFAULT_SPRITE_INDEX);

    useEffect(() => {
        initTelegram();
    }, []);

    // Позиция и размер героя в текущей сцене.
    // --oleg-max-h и max-width в CSS гарантируют корректный вид
    // как на TG Mini App (узкий WebView), так и на TG Desktop (широкий).
    const olegWrap: CSSProperties = {
        '--ox':         `${scene.oleg.xPct    ?? 0}%`,
        '--oleg-max-h': `${scene.oleg.heightVh ?? 90}vh`,
        bottom:         `${-(scene.oleg.dropVh  ?? 4)}vh`,
    } as CSSProperties;

    return (
        <div className="stage">
            {/* Фон сцены + Ken Burns */}
            <div className="bg" style={{ backgroundImage: `url("${scene.src}")` }} />

            {/* Цветокор и затемнение краёв */}
            <div className="grade" />

            {/* Затемнение пустого пола за героем */}
            <div className="floor-fade" />

            {/* Герой: пиксельная тень + спрайт */}
            <div className="oleg-wrap" style={olegWrap}>
                {/*
                  .oleg-shadow — отдельный div под спрайтом (z-index: 0).
                  Строится через многослойный box-shadow без blur:
                  каждый «ряд» — жёсткий пиксельный овал, как в ретро-RPG.
                  Дышит синхронно со спрайтом через animation: shadow-breathe.
                */}
                <div className="oleg-shadow" aria-hidden />
                <img
                    className="oleg"
                    src={SPRITES[spriteIndex]}
                    alt="Герой"
                    draggable={false}
                />
            </div>

            {/* Дополнительное растворение низа поверх героя — прячет срез */}
            <div className="foot-fade" />

            {/* Пылинки */}
            <div className="dust" aria-hidden>
                {DUST.map((d, i) => (
                    <span
                        key={i}
                        style={
                            {
                                left:      `${d.left}%`,
                                width:     `${d.size}px`,
                                height:    `${d.size}px`,
                                '--dur':   `${d.dur}s`,
                                '--delay': `${d.delay}s`,
                                '--drift': `${d.drift}vw`,
                                '--max':   d.max,
                            } as CSSProperties
                        }
                    />
                ))}
            </div>

            <div className="grain"   aria-hidden />
            <div className="vignette" />
            <div className="flicker" aria-hidden />

            {/* Хедер */}
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

            {/* Нижняя панель: три слота действий */}
            <div className="bottom-field" aria-hidden>
                <div className="bottom-actions">
                    {Array.from({ length: RAIL_SLOTS }, (_, i) => (
                        <div key={i} className="rail-slot" />
                    ))}
                </div>
            </div>

            {/* Боковое меню */}
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