const nanoPrecision = 1_000_000_000;


export const toNum = (qutation: { units: number, nano: number }) => qutation.units + (qutation.nano / nanoPrecision);

export const toQuotation = (number: number) => ({
  units: Math.floor(number),
  nano: Math.trunc(number),
})