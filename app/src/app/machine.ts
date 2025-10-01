import { createMachine } from 'xstate';

export const gameMachine = createMachine({
  id: 'game',
  initial: 'loading',
  states: {
    loading: {
      on: {
        READY: 'ready',
      },
    },
    ready: {
      on: {
        START: 'playing',
      },
    },
    playing: {
      on: {
        PAUSE: 'paused',
        WIN: 'win',
        LOSE: 'lose',
      },
    },
    paused: {
      on: {
        RESUME: 'playing',
        QUIT: 'ready',
      },
    },
    win: {
      on: {
        ACK: 'ready',
      },
    },
    lose: {
      on: {
        ACK: 'ready',
      },
    },
  },
});
