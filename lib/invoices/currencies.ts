export type Currency = {
  code: string;
  name: string;
  symbol: string;
  exponent: number;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", exponent: 2 },
  { code: "EUR", name: "Euro", symbol: "€", exponent: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", exponent: 2 },
  { code: "CAD", name: "Canadian Dollar", symbol: "$", exponent: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "$", exponent: 2 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", exponent: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", exponent: 0 },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", exponent: 2 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", exponent: 2 },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", exponent: 2 },
  { code: "DKK", name: "Danish Krone", symbol: "kr", exponent: 2 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", exponent: 2 },
  { code: "SGD", name: "Singapore Dollar", symbol: "$", exponent: 2 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$", exponent: 2 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", exponent: 2 },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((item) => item.code === code) ?? CURRENCIES[0];
}
