
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatNumberForDisplay = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = parseFloat(String(value).replace(/,/g, '.'));
  if (isNaN(num)) return '';
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).replace(/\./g, '#TEMP#').replace(/,/g, '.').replace(/#TEMP#/g, ',');
};

export const parseFormattedNumber = (formattedValue) => {
  if (formattedValue === null || formattedValue === undefined || formattedValue === '') return null;
  const cleanedValue = String(formattedValue).replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleanedValue);
  return isNaN(num) ? null : num;
};


export const formatCurrency = (value, currency = "USD") => {
  const numericValue = typeof value === 'string' ? parseFormattedNumber(value) : Number(value);
  
  if (isNaN(numericValue) || numericValue === null) {
    return `0,00 ${currency}`;
  }

  if (currency === "USDT") {
    return `${numericValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\./g, '#TEMP#').replace(/,/g, '.').replace(/#TEMP#/g, ',')} USDT`;
  }

  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  } catch (error) {
    return `${numericValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\./g, '#TEMP#').replace(/,/g, '.').replace(/#TEMP#/g, ',')} ${currency}`;
  }
};
