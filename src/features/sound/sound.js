"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bp-sound";

/** @type {AudioContext | null} */
let ctx = null;
/** @type {AudioBuffer | null} */
let noise = null;
/** @type {boolean | null} */
let enabled = null;
const listeners = new Set();

const isEnabled = () => {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      enabled = false;
    }
  }
  return enabled;
};

/** @param {boolean} value */
export function setSoundEnabled(value) {
  enabled = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {}
  // Must be created/resumed inside a user gesture or browsers keep it suspended.
  if (value) audio();
  listeners.forEach((l) => l());
}

export const toggleSound = () => setSoundEnabled(!isEnabled());

/** @type {{ dry: AudioNode, wet: AudioNode } | null} */
let bus = null;

function audio() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/** Master chain: soft limiter plus a short, dark echo that gives sounds a sense of space. @param {AudioContext} ac */
function getBus(ac) {
  if (bus) return bus;
  const master = ac.createDynamicsCompressor();
  master.threshold.value = -24;
  master.ratio.value = 3;
  master.connect(ac.destination);

  const delay = ac.createDelay(1);
  delay.delayTime.value = 0.17;
  const feedback = ac.createGain();
  feedback.gain.value = 0.28;
  const tone = ac.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2800;
  const wetLevel = ac.createGain();
  wetLevel.gain.value = 0.22;
  delay.connect(tone).connect(feedback).connect(delay);
  tone.connect(wetLevel).connect(master);

  bus = { dry: master, wet: delay };
  return bus;
}

/** @param {AudioContext} ac */
function noiseBuffer(ac) {
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** @param {AudioNode} node @param {AudioContext} ac @param {number} send */
function route(node, ac, send) {
  const { dry, wet } = getBus(ac);
  node.connect(dry);
  if (send > 0) {
    const s = ac.createGain();
    s.gain.value = send;
    node.connect(s).connect(wet);
  }
}

/**
 * Sine/triangle voice with a smooth attack/decay envelope.
 * @param {AudioContext} ac
 * @param {{ freq: number, to?: number, type?: OscillatorType, at?: number, attack?: number, dur: number, gain: number, send?: number }} o
 */
function voice(ac, { freq, to, type = "sine", at = 0, attack = 0.005, dur, gain, send = 0 }) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setTargetAtTime(0, t + attack, dur / 4);
  osc.connect(g);
  route(g, ac, send);
  osc.start(t);
  osc.stop(t + attack + dur * 1.5);
}

/**
 * Filtered noise burst.
 * @param {AudioContext} ac
 * @param {{ type?: BiquadFilterType, freq: number, to?: number, q?: number, attack?: number, dur: number, gain: number, send?: number }} o
 */
function air(ac, { type = "bandpass", freq, to, q = 0.7, attack = 0.002, dur, gain, send = 0 }) {
  const t = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setTargetAtTime(0, t + attack, dur / 3);
  src.connect(filter).connect(g);
  route(g, ac, send);
  src.start(t);
  src.stop(t + attack + dur * 1.5);
}

/** Subtle, premium UI sounds synthesised at runtime — zero audio bytes shipped. */
const sounds = {
  // A soft wooden "tock" when focus moves.
  tick: (/** @type {AudioContext} */ ac) => {
    air(ac, { type: "bandpass", freq: 3200, q: 1.2, dur: 0.012, gain: 0.05 });
    voice(ac, { freq: 1900, dur: 0.02, gain: 0.006 });
  },
  // Two-note glass chime.
  select: (/** @type {AudioContext} */ ac) => {
    voice(ac, { freq: 1318.5, dur: 0.22, gain: 0.03, send: 0.6 });
    voice(ac, { freq: 1975.5, at: 0.07, dur: 0.3, gain: 0.022, send: 0.6 });
  },
  back: (/** @type {AudioContext} */ ac) => voice(ac, { freq: 880, to: 620, dur: 0.12, gain: 0.025, send: 0.3 }),
  open: (/** @type {AudioContext} */ ac) => voice(ac, { freq: 520, to: 780, dur: 0.07, gain: 0.03, send: 0.4 }),
  whoosh: (/** @type {AudioContext} */ ac) =>
    air(ac, { freq: 300, to: 1300, q: 0.5, attack: 0.18, dur: 0.45, gain: 0.03, send: 0.3 }),
  static: (/** @type {AudioContext} */ ac) => {
    air(ac, { type: "lowpass", freq: 4200, dur: 0.1, gain: 0.025 });
    voice(ac, { freq: 2600, dur: 0.015, gain: 0.006 });
  },
  // Warm Cmaj7 bloom with a low swell — the "TV on" signature.
  power: (/** @type {AudioContext} */ ac) => {
    voice(ac, { freq: 65.4, attack: 0.35, dur: 1.4, gain: 0.05 });
    [261.6, 329.6, 392, 493.9].forEach((freq, i) =>
      voice(ac, { freq, type: "triangle", at: i * 0.06, attack: 0.25, dur: 1.6, gain: 0.014, send: 0.5 }),
    );
    voice(ac, { freq: 1046.5, at: 0.3, attack: 0.2, dur: 1.2, gain: 0.006, send: 0.8 });
  },
  off: (/** @type {AudioContext} */ ac) => voice(ac, { freq: 600, to: 200, dur: 0.3, gain: 0.03, send: 0.3 }),
};

/** @param {keyof typeof sounds} name */
export function play(name) {
  if (!isEnabled()) return;
  try {
    sounds[name](audio());
  } catch {}
}

/** @param {() => void} l */
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, isEnabled, () => false);
}
