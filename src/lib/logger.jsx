
const IS_PRODUCTION = import.meta.env.PROD;


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
