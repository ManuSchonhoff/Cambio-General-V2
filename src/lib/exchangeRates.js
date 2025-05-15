const EXCHANGE_RATES_KEY = 'accountingExchangeRates_v1';

const defaultExchangeRates = {
  EUR: 1.08,
  USDT: 1.00,
  ARS: 0.001, // 1 ARS = 0.001 USD → 1 USD = 1000 ARS
  BRL: 0.20,
  GBP: 1.27
};

export const getStoredExchangeRates = () => {
  try {
    const raw = localStorage.getItem(EXCHANGE_RATES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : defaultExchangeRates;
  } catch (err) {
    console.warn('[ExchangeRates] Error al leer desde localStorage:', err);
    return defaultExchangeRates;
  }
};

export const saveExchangeRates = (rates) => {
  try {
    localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(rates));
  } catch (err) {
    console.error('[ExchangeRates] Error al guardar en localStorage:', err);
  }
};

export const updateExchangeRate = (currency, newValue, currentRates) => {
  const parsed = parseFloat(newValue);
  if (isNaN(parsed) || parsed <= 0) return currentRates;

  const updated = { ...currentRates, [currency]: parsed };
  saveExchangeRates(updated);
  return updated;
};

export const getExchangeRateInverted = (arsPerUsd) => {
  const parsed = parseFloat(arsPerUsd);
  if (isNaN(parsed) || parsed <= 0) return 0;
  return 1 / parsed;
};
