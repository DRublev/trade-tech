const nanoPrecision = 1_000_000_000;



export const toQuotation = (number: number) => {
  const decimal = (number - Math.floor(Number(number))).toFixed(9);
  return ({
  units: Math.floor(number),
  nano: decimal.slice(2) as any as number,
})};
export const toNum = (qutation: { units: number, nano: number }) => Number(qutation.units + (qutation.nano / nanoPrecision));