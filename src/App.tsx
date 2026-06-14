import { useEffect, useState } from 'react';
import { pickScene } from './scenes';
import { initTelegram } from './telegram';
import { preloadImages } from './preload';
import { PRELOAD_SPRITES } from './game/sprites';
import { BOOT_PRELOAD } from './game/bootAssets';
import { useGame } from './game/useGame';
import { SFX } from './game/sound';
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
import { BootScene } from './components/BootScene';

const IS_DEV =
    import.meta.env.DEV ||
    location.search.includes('dev') ||
    !!(window.Telegram?.WebApp);

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

    useEffect(() => {
        let cancelled = false;
        const start = Date.now();
        const srcs = [...PRELOAD_SPRITES, scene.src, ...BOOT_PRELOAD];
        preloadImages(srcs, (loaded, total) => {
            if (!cancelled) setProgress(loaded / total);
        }).then(() => {
            const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - start));
            window.setTimeout(() => {
                if (!cancelled) {
                    setReady(true);
                    // Небольшая задержка — AudioContext должен быть разблокирован
                    // первым пользовательским взаимодействием (здесь оно уже было).
                    setTimeout(() => SFX.startup(game.state.soundEnabled), 120);
                }
            }, wait);
        });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene]);

    const stage = game.state.shaveStage;
    const midShave = stage !== 'none';

    // Кнопка «Почистить берцы» активна когда: грязные, диалог уже показан, не бреемся.
    const bootsPending =
        game.state.bootsDirty &&
        !game.state.bootsDialogDue &&
        game.state.onboarded &&
        !midShave &&
        !game.bootsMode;

    const locked = !bootsPending && !midShave && !game.shaveable;

    const label = bootsPending
        ? 'Почистить берцы'
        : stage === 'foam'
            ? 'Побрить'
            : stage === 'half'
                ? 'Закончить бритьё'
                : game.shaveable
                    ? 'Нанести пену'
                    : 'Побрить';

    const holdMode = !bootsPending && midShave;

    function handleAction() {
        if (bootsPending) game.startBootCleaning();
        else game.act();
    }

    function handleMenu() {
        SFX.menuOpen(game.state.soundEnabled);
        setMenuOpen(true);
    }

    if (!ready) return <LoadingScreen progress={progress} />;

    return (
        <Stage bg={scene.src}>
            <Scene src={scene.src} />

            {game.bootsMode ? (
                <BootScene
                    key={game.bootsKey}
                    soundEnabled={game.state.soundEnabled}
                    onDone={game.finishBootCleaning}
                />
            ) : (
                <>
                    <Oleg src={game.sprite} placement={scene.oleg} onTap={game.tapOleg} />
                    <div className="foot-fade" aria-hidden />
                    <Atmosphere />
                    <Header
                        menuOpen={menuOpen}
                        onMenu={handleMenu}
                        streak={game.state.streak}
                        streakUpdatedAt={game.state.streakUpdatedAt}
                        bootsDirty={game.state.bootsDirty}
                        onStreakTap={game.tapStreak}
                    />

                    {game.dialog && (
                        <Dialog
                            key={game.dialog.pages.join('|')}
                            {...game.dialog}
                            soundEnabled={game.state.soundEnabled}
                            onClose={game.closeDialog}
                        />
                    )}

                    <ActionBar
                        label={label}
                        locked={locked}
                        holdMode={holdMode}
                        busy={game.blinking || !!game.dialog}
                        onAction={handleAction}
                        onLockedTap={game.tapLocked}
                    />
                </>
            )}

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
                    soundEnabled={game.state.soundEnabled}
                    bootsDirty={game.state.bootsDirty}
                    serviceStart={game.serviceStart}
                    serviceEnd={game.serviceEnd}
                    dev={game.dev}
                    onNewScene={() => setScene(pickScene())}
                    onToggleSound={game.dev.toggleSound}
                />
            )}
        </Stage>
    );
}
