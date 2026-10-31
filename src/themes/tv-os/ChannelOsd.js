/** @typedef {{ ch: number | string, label: string, key: number }} Osd */

/** On-screen display + a burst of static, restarted by changing `osd.key`. @param {{ osd: Osd | null }} props */
export default function ChannelOsd({ osd }) {
  if (!osd) return null;
  const ch = typeof osd.ch === "number" ? String(osd.ch).padStart(2, "0") : osd.ch;
  return (
    <>
      <div key={`s${osd.key}`} className="static" aria-hidden="true" />
      <div key={`o${osd.key}`} className="osd" role="status">
        <span className="osd__ch">CH {ch}</span>
        <span className="osd__label">{osd.label}</span>
      </div>
    </>
  );
}
