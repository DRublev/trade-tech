import * as strategies from './implementations';
import { IStrategyConstructor } from "./iStrategy";
import Strategies from "./strategies.enum";


export const getStrategyConstructor = (key: Strategies): IStrategyConstructor => {
  const strategyKey = Strategies[key];
  if (!strategyKey || !strategies[strategyKey]) {
    throw new ReferenceError(`Strategy not found by key ${key}`);
  }

  return strategies[strategyKey] as IStrategyConstructor;
}