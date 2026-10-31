"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { powerOff, usePower } from "@/features/power/power";
import { play, toggleSound, useSoundEnabled } from "@/features/sound/sound";
import { useSpatialNav } from "@/features/spatial-nav/useSpatialNav";
import Billboard from "./Billboard";
import ChannelOsd from "./ChannelOsd";
import DetailOverlay from "./DetailOverlay";
import Rail from "./Rail";
import Remote from "./Remote";
import TopBar from "./TopBar";
import TrailerPreview from "./TrailerPreview";

const DevOverlay = dynamic(() => import("./DevOverlay"), { ssr: false });
const Guide = dynamic(() => import("./Guide"), { ssr: false });
const ContactOverlay = dynamic(() => import("@/features/contact/ContactOverlay"), { ssr: false });
const AskOverlay = dynamic(() => import("@/features/ask/AskOverlay"), { ssr: false });

const PREVIEW_DWELL_MS = 700;
const ATTRACT_IDLE_MS = 8000;
const SLIDE_MS = 7000;

/** @typedef {import("@/content/catalog").CatalogItem} CatalogItem */
/** @typedef {import("@/content/catalog").CatalogRow} CatalogRow */
/** @typedef {{ devOverlay: boolean, previews: boolean, sound: boolean, ask: boolean, contactForm: boolean, webmcp: boolean }} Features */
/** @typedef {{ name?: string, email?: string, message?: string }} ContactDraft */

/**
 * @param {{
 *   profile: typeof import("@/content/profile").profile,
 *   about: CatalogItem,
 *   rows: CatalogRow[],
 *   featured: CatalogItem[],
 *   guide: import("@/content/catalog").GuideChannel[] | null,
 *   features: Features
 * }} props
 */
export default function TvHome({ profile, about, rows, featured, guide, features }) {
  const isOn = usePower() === "on";
  const soundOn = useSoundEnabled();
  const [detail, setDetail] = useState(/** @type {CatalogItem | null} */ (null));
  const [guideOpen, setGuideOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [turningOff, setTurningOff] = useState(false);
  const [osd, setOsd] = useState(/** @type {import("./ChannelOsd").Osd | null} */ (null));
  const [preview, setPreview] = useState(/** @type {{ row: number, col: number, rect: DOMRect, item: CatalogItem } | null} */ (null));
  const [slide, setSlide] = useState(0);
  const [attract, setAttract] = useState(false);
  const [contact, setContact] = useState(/** @type {ContactDraft | null} */ (null));
  const [askOpen, setAskOpen] = useState(false);
  const overlayOpen = !!detail || guideOpen || !!contact || askOpen;

  const nav = useSpatialNav({
    enabled: isOn && !overlayOpen,
    onBack: () => nav.focusAt(0, 0),
    onMove: () => play("tick"),
  });
  const { focusAt, refocus, activate } = nav;
  const { row: focusRow, col: focusCol } = nav.focus;

  const rowIndex = useCallback((/** @type {string} */ id) => rows.findIndex((r) => r.id === id) + 1, [rows]);

  const openDetail = useCallback((/** @type {CatalogItem} */ item) => {
    play("select");
    if (item.action === "contact") setContact({});
    else setDetail(item);
  }, []);

  const closeContact = useCallback(() => {
    play("back");
    setContact(null);
    requestAnimationFrame(refocus);
  }, [refocus]);

  const closeAsk = useCallback(() => {
    play("back");
    setAskOpen(false);
    requestAnimationFrame(refocus);
  }, [refocus]);

  const closeDetail = useCallback(() => {
    play("back");
    setDetail(null);
    requestAnimationFrame(refocus);
  }, [refocus]);

  const openGuide = useCallback(() => {
    play("open");
    setGuideOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    play("back");
    setGuideOpen(false);
    requestAnimationFrame(refocus);
  }, [refocus]);

  const surf = useCallback(
    (/** @type {number} */ target) => {
      const channels = rows.length + 1;
      const row = ((target % channels) + channels) % channels;
      focusAt(row, 0);
      setOsd({ ch: row, label: row === 0 ? "Home" : rows[row - 1].title, key: performance.now() });
      play("static");
    },
    [rows, focusAt],
  );

  const turnOff = () => {
    play("off");
    setDetail(null);
    setGuideOpen(false);
    setContact(null);
    setAskOpen(false);
    // The collapse animation is centred on the top viewport; a real TV restarts at Home anyway.
    window.scrollTo({ top: 0 });
    focusAt(0, 0, false);
    setTurningOff(true);
  };

  useEffect(() => {
    if (!isOn) return;
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      const t = /** @type {HTMLElement} */ (e.target);
      if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === "d" && features.devOverlay) setDevOpen((v) => !v);
      else if (key === "m" && features.sound) toggleSound();
      else if (detail || contact || askOpen) return;
      else if (key === "/" && features.ask && !guideOpen) {
        e.preventDefault();
        play("open");
        setAskOpen(true);
      } else if (key === "g" && guide) {
        if (guideOpen) closeGuide();
        else openGuide();
      } else if (guideOpen) return;
      else if (/^\d$/.test(key) && Number(key) <= rows.length) surf(Number(key));
      else if (key === "pageup" || key === "channelup") {
        e.preventDefault();
        surf(focusRow + 1);
      } else if (key === "pagedown" || key === "channeldown") {
        e.preventDefault();
        surf(focusRow - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOn, detail, contact, askOpen, guide, guideOpen, rows.length, focusRow, surf, openGuide, closeGuide, features]);

  useEffect(() => {
    if (!isOn || !features.webmcp) return;
    const items = [...new Map([...featured, ...rows.flatMap((r) => r.items)].map((i) => [i.id, i])).values()];
    let cleanup = () => {};
    import("@/features/webmcp/registerWebMcp").then(({ registerWebMcp }) => {
      cleanup = registerWebMcp({
        about,
        items: items.filter((i) => !i.action),
        resumes: profile.resumes,
        openTitle: (item) => {
          setGuideOpen(false);
          setDetail(item);
        },
        openContact: (draft) => setContact(draft),
        openGuide: () => setGuideOpen(true),
      });
    });
    return () => cleanup();
  }, [isOn, features.webmcp, featured, rows, about, profile.resumes]);

  // Attract mode: after a quiet spell on the billboard, cycle featured titles like a streaming home screen.
  const canAttract = featured.length > 1 && isOn && !overlayOpen && focusRow === 0;
  useEffect(() => {
    if (!canAttract) return;
    /** @type {ReturnType<typeof setTimeout>} */
    let idle;
    /** @type {ReturnType<typeof setInterval>} */
    let cycle;
    const arm = () => {
      idle = setTimeout(() => {
        setAttract(true);
        cycle = setInterval(() => setSlide((s) => (s + 1) % featured.length), SLIDE_MS);
      }, ATTRACT_IDLE_MS);
    };
    const wake = () => {
      clearTimeout(idle);
      clearInterval(cycle);
      setAttract(false);
      arm();
    };
    const events = /** @type {const} */ (["keydown", "pointermove", "pointerdown", "wheel"]);
    arm();
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      clearTimeout(idle);
      clearInterval(cycle);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [canAttract, featured.length]);

  const previewRow = rows[focusRow - 1];
  useEffect(() => {
    const variant = previewRow?.variant;
    if (!features.previews || !isOn || detail || guideOpen || !variant || variant === "quote") return;
    if (!matchMedia("(hover: hover)").matches) return;
    const id = setTimeout(() => {
      const el = document.querySelector(`[data-pos="${focusRow}:${focusCol}"]`);
      if (!el || document.activeElement !== el) return;
      play("whoosh");
      setPreview({ row: focusRow, col: focusCol, rect: el.getBoundingClientRect(), item: previewRow.items[focusCol] });
    }, PREVIEW_DWELL_MS);
    return () => clearTimeout(id);
  }, [features.previews, isOn, detail, guideOpen, previewRow, focusRow, focusCol]);

  const showPreview = preview && preview.row === focusRow && preview.col === focusCol && !detail && !guideOpen;
  useEffect(() => {
    if (!showPreview) return;
    const close = () => setPreview(null);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [showPreview]);

  const current = featured[slide] ?? about;
  const focused = focusRow === 0 ? current : rows[focusRow - 1]?.items[focusCol];
  const ambient = focused?.accent[0] ?? "#8b5cf6";

  const sections = [
    { label: "Originals", row: rowIndex("originals") },
    { label: "Career", row: rowIndex("continue") },
    { label: "Player", row: rowIndex("player") },
    { label: "Contact", row: rowIndex("cast") },
  ];

  return (
    <div
      className="tv"
      style={/** @type {import("react").CSSProperties} */ ({ "--ambient": ambient })}
      data-dev={devOpen || undefined}
      data-off={turningOff || undefined}
      onAnimationEnd={(e) => {
        if (e.animationName !== "crt-off") return;
        setTurningOff(false);
        powerOff();
      }}
    >
      <div className="tv__ambient" aria-hidden="true" />
      <TopBar
        profile={profile}
        sections={sections}
        onJump={surf}
        devEnabled={features.devOverlay}
        onToggleDev={() => setDevOpen((v) => !v)}
        onPower={turnOff}
        sound={{ enabled: features.sound, on: soundOn, toggle: toggleSound }}
        onGuide={guide ? openGuide : undefined}
        onAsk={
          features.ask
            ? () => {
                play("open");
                setAskOpen(true);
              }
            : undefined
        }
      />
      <main className="tv__main" inert={!isOn || overlayOpen}>
        <Billboard
          profile={profile}
          slides={featured}
          slide={slide}
          attract={attract && canAttract}
          slideMs={SLIDE_MS}
          onSelectSlide={setSlide}
          getItemProps={(col) => nav.getItemProps(0, col)}
          onPlay={() => openDetail(current)}
          onContact={() => surf(rowIndex("cast"))}
        />
        <div className="tv__rows">
          {rows.map((row, i) => (
            <Rail key={row.id} row={row} index={i} getItemProps={(col) => nav.getItemProps(i + 1, col)} onOpen={openDetail} />
          ))}
        </div>
        <footer className="tv__footer">
          <span>© {profile.name} · Built with Next.js, zero UI libraries</span>
          <span>
            {features.ask && "/ asks the assistant · "}
            {guide && "G opens the TV Guide · "}C plays director&apos;s commentary
            {features.devOverlay && " · D shows what's under the hood"}
          </span>
        </footer>
      </main>
      {isOn && (
        <Remote
          onOk={() => {
            const el = /** @type {HTMLElement | null} */ (document.activeElement);
            if (el && el !== document.body) el.click();
            else activate();
          }}
          onPower={turnOff}
          onMute={toggleSound}
          soundOn={soundOn}
          soundEnabled={features.sound}
        />
      )}
      {showPreview && <TrailerPreview item={preview.item} rect={preview.rect} />}
      <ChannelOsd osd={osd} />
      {guide && guideOpen && (
        <Guide channels={guide} enabled={!detail && !contact && !askOpen} onOpen={openDetail} onClose={closeGuide} />
      )}
      {detail && <DetailOverlay item={detail} onClose={closeDetail} />}
      {contact && <ContactOverlay to={profile.email} initial={contact} onClose={closeContact} />}
      {askOpen && <AskOverlay onClose={closeAsk} />}
      {devOpen && <DevOverlay focus={nav.focus} onClose={() => setDevOpen(false)} />}
    </div>
  );
}
