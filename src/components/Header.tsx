
type Props = {
  menuOpen: boolean;
  onMenu: () => void;
};

export function Header({ menuOpen, onMenu }: Props) {
  return (
    <header className="hud-top">
      <h1 className="brand">
        Рядовой <span className="brand-accent">Авангард</span>
      </h1>
      <button className="burger" onClick={onMenu} aria-label="Меню" aria-expanded={menuOpen}>
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
