export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const roundToNearestStep = (candidate, step) => {
  return Math.round(candidate / step) * step;
};