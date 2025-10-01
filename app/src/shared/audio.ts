import { Howl } from 'howler';

const sounds = {
  collect: new Howl({ src: ['/sounds/collect.wav'], volume: 0.4 }),
  miss: new Howl({ src: ['/sounds/miss.wav'], volume: 0.3 }),
  summary: new Howl({ src: ['/sounds/summary.wav'], volume: 0.35 }),
};

let muted = false;

export const audioBus = {
  playCollect() {
    if (!muted) sounds.collect.play();
  },
  playMiss() {
    if (!muted) sounds.miss.play();
  },
  playSummary() {
    if (!muted) sounds.summary.play();
  },
  setMuted(state: boolean) {
    muted = state;
  },
};
