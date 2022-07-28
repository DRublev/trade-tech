import { toNum } from "./helpers";

const currencySymbolsMap = {
  'usd': '$',
  'eur': '€',
  'gbp': '£',
  'rub': '₽',
};


export type BalanceEntity = {
  code: string;
  symbol?: string;
  amount: number;
}

export default class MoneyDTO {
  static toBalanceEntity(money: { currency: string, units: number, nano: number }[]): { [code: string]: BalanceEntity } {
    return money.reduce((acc, m) => {
      const code= m.currency.toUpperCase();
      (acc as any)[code] = {
        code,
        symbol: (currencySymbolsMap as any)[m.currency.toLowerCase()] ,
        amount: toNum(m),
      };
      return acc;
    }, {});
  }
}