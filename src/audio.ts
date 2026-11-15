import { getSettings, musicGain, onSettingsChange, sfxGain } from "./settings";

const BGM_URL = "/audio/bgm.m4a";
const SOUND_URLS = { pop: "/audio/pop.wav" } as const;
const FADE_SECONDS = 2;
const LOOKAHEAD_SECONDS = 180;
const TOP_UP_MS = 5000;
const LEVEL_SMOOTHING = 0.05;

export type SoundName = keyof typeof SOUND_URLS;

const SOUND_LEVELS: Record<SoundName, number> = { pop: 0.5 };

let context: AudioContext | null = null;
let music: GainNode | null = null;
let effects: GainNode | null = null;
let buffer: AudioBuffer | null = null;
const sounds: Partial<Record<SoundName, AudioBuffer>> = {};
let nextStart = 0;
let begun = false;
let musicRequested = false;
let musicPlaying = false;

async function decode(audio: AudioContext, url: string): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url);
    return await audio.decodeAudioData(await response.arrayBuffer());
  } catch (error) {
    console.error(`audio failed to load: ${url}`, error);
    return null;
  }
}

function applyLevels(): void {
  if (!context || !music || !effects) return;
  const { musicVolume, sfxVolume, muted } = getSettings();
  music.gain.setTargetAtTime(musicGain(musicVolume, muted), context.currentTime, LEVEL_SMOOTHING);
  effects.gain.setTargetAtTime(sfxGain(sfxVolume, muted), context.currentTime, LEVEL_SMOOTHING);
}

function scheduleLoop(startTime: number): void {
  if (!context || !music || !buffer) return;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const envelope = context.createGain();
  const end = startTime + buffer.duration;
  envelope.gain.setValueAtTime(0, startTime);
  envelope.gain.linearRampToValueAtTime(1, startTime + FADE_SECONDS);
  envelope.gain.setValueAtTime(1, end - FADE_SECONDS);
  envelope.gain.linearRampToValueAtTime(0, end);
  source.connect(envelope);
  envelope.connect(music);
  source.start(startTime);
}

function topUp(): void {
  if (!context || !buffer) return;
  while (nextStart < context.currentTime + LOOKAHEAD_SECONDS) {
    scheduleLoop(nextStart);
    nextStart += buffer.duration - FADE_SECONDS;
  }
}

async function start(): Promise<void> {
  const audio = new AudioContext();
  context = audio;
  void audio.resume();
  music = audio.createGain();
  effects = audio.createGain();
  music.connect(audio.destination);
  effects.connect(audio.destination);
  const { musicVolume, sfxVolume, muted } = getSettings();
  music.gain.value = musicGain(musicVolume, muted);
  effects.gain.value = sfxGain(sfxVolume, muted);
  onSettingsChange(applyLevels);

  const [track, pop] = await Promise.all([decode(audio, BGM_URL), decode(audio, SOUND_URLS.pop)]);
  if (pop) sounds.pop = pop;
  if (!track) return;
  buffer = track;
  beginMusic();
}

function beginMusic(): void {
  if (!context || !buffer || !musicRequested || musicPlaying) return;
  musicPlaying = true;
  void context.resume();
  nextStart = context.currentTime + 0.1;
  topUp();
  setInterval(topUp, TOP_UP_MS);
}

export function startMusic(): void {
  musicRequested = true;
  unlockMusic();
  beginMusic();
}

export function unlockMusic(): void {
  if (!begun) {
    begun = true;
    void start();
    return;
  }
  void context?.resume();
}

export function playSound(name: SoundName, variation = 0): void {
  const sample = sounds[name];
  if (!context || !effects || !sample) return;
  const source = context.createBufferSource();
  source.buffer = sample;
  if (variation > 0) source.playbackRate.value = 1 + (Math.random() * 2 - 1) * variation;
  const level = context.createGain();
  level.gain.value = SOUND_LEVELS[name];
  source.connect(level);
  level.connect(effects);
  source.start();
}
