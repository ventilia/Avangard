import { useEffect, useState } from 'react';
import { pickScene } from './scenes';
import { initTelegram } from './telegram';
import { useGame } from './game/useGame';
import { Stage } from './components/Stage';
import { Scene } from './components/Scene';
import { Oleg } from './components/Oleg';
import { Atmosphere } from './components/Atmosphere';
import { Header } from './components/Header';
import { Dialog } from './components/Dialog';
import { ActionBar } from './components/ActionBar';
import { Menu } from './components/Menu';
import { BlinkOverlay } from './components/BlinkOverlay';

// DEV-панель: локальная разработка, явный ?dev в URL, или Telegram Mini App
// (приложение пока в стадии разработки — дев-инструменты нужны всегда).
const IS_DEV =
    import.meta.env.DEV ||
    location.search.includes('dev') ||
    !!(window.Telegram?.WebApp);

export function App() {
    const [scene, setScene] = useState(pickScene);
    const [menuOpen, setMenuOpen] = useState(false);
    const game = useGame();

    useEffect(() => {
        initTelegram();
    }, []);

    const stage = game.state.shaveStage;
    const midShave = stage !== 'none';
    const locked = !midShave && !game.shaveable;
    const label =
        stage === 'foam'
            ? 'Побрить'
            : stage === 'half'
                ? 'Закончить бритьё'
                : game.shaveable
                    ? 'Нанести пену'
                    : 'Побрить';

    return (
        <Stage bg={scene.src}>
            <Scene src={scene.src} />
            <Oleg src={game.sprite} placement={scene.oleg} />
            <div className="foot-fade" aria-hidden />
            <Atmosphere />

            <Header menuOpen={menuOpen} onMenu={() => setMenuOpen(true)} />

            {game.dialog && (
                <Dialog
                    key={game.dialog.pages.join('|')}
                    {...game.dialog}
                    onClose={() => game.setDialog(null)}
                />
            )}

            <ActionBar
                label={label}
                locked={locked}
                holdMode={midShave}
                busy={game.blinking || !!game.dialog}
                onAction={game.act}
                onLockedTap={game.tapLocked}
            />

            <BlinkOverlay active={game.blinking} />

            {menuOpen && (
                <Menu
                    onClose={() => setMenuOpen(false)}
                    isDev={IS_DEV}
                    day={game.day}
                    onboarded={game.state.onboarded}
                    dev={game.dev}
                    onNewScene={() => setScene(pickScene())}
                />
            )}
        </Stage>
    );
}