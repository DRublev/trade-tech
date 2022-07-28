import * as strategies from './implementations';
import * as strategiesStates from './implementations/statesMap';
import { IStrategyConstructor } from "./iStrategy";
import Strategies from "./strategies.enum";
import StrategyState from './StrategyState';


export const getStrategyConstructor = (key: Strategies): IStrategyConstructor => {
  const strategyKey = Strategies[key];
  if (!strategyKey || !strategies[strategyKey]) {
    throw new ReferenceError(`Strategy not found by key ${key}`);
  }

  return strategies[strategyKey] as IStrategyConstructor;
};

export const getStrategyStateConstructor = (key: Strategies): StrategyState => {
  const strategyKey = Strategies[key];
  if (!strategyKey || !strategies[strategyKey]) {
    throw new ReferenceError(`Strategy not found by key ${key}`);
  }
  return strategiesStates[strategyKey] as StrategyState;
};
