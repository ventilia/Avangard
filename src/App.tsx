import { useEffect, useState } from 'react';
import { pickScene } from './scenes';
import { initTelegram } from './telegram';
import { preloadImages } from './preload';
import { PRELOAD_SPRITES } from './game/sprites';
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
import { LoadingScreen } from './components/LoadingScreen';

// DEV-панель: локальная разработка, явный ?dev в URL, или Telegram Mini App
// (приложение пока в стадии разработки — дев-инструменты нужны всегда).
const IS_DEV =
    import.meta.env.DEV ||
    location.search.includes('dev') ||
    !!(window.Telegram?.WebApp);

// Минимальное время показа лоадера — чтобы при кеше он не «моргал».
const MIN_LOADER_MS = 400;

export function App() {
    const [scene, setScene] = useState(pickScene);
    const [menuOpen, setMenuOpen] = useState(false);
    const [ready, setReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const game = useGame();

    useEffect(() => {
        initTelegram();
    }, []);

    // Предзагружаем все спрайты + фон текущей сцены ДО старта игры, чтобы смена
    // спрайта в бою была мгновенной (на телефоне иначе спрайт качается по сети).
    useEffect(() => {
        let cancelled = false;
        const start = Date.now();
        const srcs = [...PRELOAD_SPRITES, scene.src];
        preloadImages(srcs, (loaded, total) => {
            if (!cancelled) setProgress(loaded / total);
        }).then(() => {
            const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - start));
            window.setTimeout(() => {
                if (!cancelled) setReady(true);
            }, wait);
        });
        return () => {
            cancelled = true;
        };
    }, [scene]);

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

    // Пока не предзагрузились ассеты — стилизованный экран загрузки.
    if (!ready) return <LoadingScreen progress={progress} />;

    return (
        <Stage bg={scene.src}>
            <Scene src={scene.src} />
            <Oleg src={game.sprite} placement={scene.oleg} onTap={game.tapOleg} />
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

            <BlinkOverlay
                phase={game.blinkPhase}
                onClosed={game.handleBlinkClosed}
                onOpened={game.handleBlinkOpened}
            />

            {menuOpen && (
                <Menu
                    onClose={() => setMenuOpen(false)}
                    isDev={IS_DEV}
                    day={game.day}
                    onboarded={game.state.onboarded}
                    serviceStart={game.serviceStart}
                    serviceEnd={game.serviceEnd}
                    dev={game.dev}
                    onNewScene={() => setScene(pickScene())}
                />
            )}
        </Stage>
    );
}