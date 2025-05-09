
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const debug = {
  log: (...args) => {
    if (!IS_PRODUCTION) {
      console.log(...args);
    }
  },
  error: (...args) => {
    if (!IS_PRODUCTION) {
      console.error(...args);
    }
  },
  warn: (...args) => {
    if (!IS_PRODUCTION) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (!IS_PRODUCTION) {
      console.info(...args);
    }
  }
};
