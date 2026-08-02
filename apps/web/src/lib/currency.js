const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COMPACT_UNITS = [
  { value: 1_000_000_000_000_000, suffix: 'Q' },
  { value: 1_000_000_000_000, suffix: 'T' },
  { value: 1_000_000_000, suffix: 'B' },
  { value: 1_000_000, suffix: 'M' },
  { value: 1_000, suffix: 'K' },
];

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatCurrencyFull = (value) => {
  const number = toFiniteNumber(value);
  const sign = number < 0 ? '-' : '';
  return `${sign}$${CURRENCY_FORMATTER.format(Math.abs(number))}`;
};

export const formatCurrencyCompact = (value) => {
  const number = toFiniteNumber(value);
  const sign = number < 0 ? '-' : '';
  const absolute = Math.abs(number);

  if (absolute < 1000) {
    return formatCurrencyFull(number);
  }

  const unit = COMPACT_UNITS.find((item) => absolute >= item.value);
  return `${sign}$${(absolute / unit.value).toFixed(2)}${unit.suffix}`;
};
