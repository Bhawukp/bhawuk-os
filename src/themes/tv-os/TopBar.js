import Clock from "./Clock";

/**
 * @param {{
 *   profile: typeof import("@/content/profile").profile,
 *   sections: { label: string, row: number }[],
 *   onJump: (row: number) => void,
 *   devEnabled: boolean,
 *   onToggleDev: () => void,
 *   onPower: () => void,
 *   sound: { enabled: boolean, on: boolean, toggle: () => void },
 *   onGuide?: () => void,
 *   onAsk?: () => void
 * }} props
 */
export default function TopBar({ profile, sections, onJump, devEnabled, onToggleDev, onPower, sound, onGuide, onAsk }) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <span className="topbar__logo">{profile.initials}</span>
        <span className="topbar__name">
          Bhawuk <span>OS</span>
        </span>
      </div>
      <nav className="topbar__nav" aria-label="Channels">
        {sections.map((s) => (
          <button key={s.label} type="button" onClick={() => onJump(s.row)}>
            <span className="topbar__ch">{String(s.row).padStart(2, "0")}</span> {s.label}
          </button>
        ))}
      </nav>
      <div className="topbar__right">
        {onAsk && (
          <button type="button" className="topbar__icon topbar__ask" onClick={onAsk} aria-label="Ask Bhawuk assistant (/)">
            ◉ Ask
          </button>
        )}
        {onGuide && (
          <button type="button" className="topbar__icon topbar__guide" onClick={onGuide} aria-label="Open TV Guide (G)">
            ▦ Guide
          </button>
        )}
        {sound.enabled && (
          <button
            type="button"
            className="topbar__icon"
            onClick={sound.toggle}
            aria-pressed={sound.on}
            aria-label={sound.on ? "Mute sound" : "Turn sound on"}
          >
            {sound.on ? "♪ On" : "♪ Off"}
          </button>
        )}
        {devEnabled && (
          <button type="button" className="topbar__icon topbar__dev" onClick={onToggleDev} aria-label="Toggle developer overlay">
            {"</>"}
          </button>
        )}
        <button type="button" className="topbar__icon topbar__power" onClick={onPower} aria-label="Turn the TV off">
          ⏻
        </button>
        <Clock />
        <span className="topbar__avatar" aria-hidden="true">
          {profile.initials}
        </span>
      </div>
    </header>
  );
}
