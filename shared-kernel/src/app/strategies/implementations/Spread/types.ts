export type ToPlaceOrderInfo = {
  lots: number;
  price: number;
  idx: number;
  isStop?: boolean;
  forBid?: string;
};

/*
  -- Купить на часть (minBid * lotsDistribution / availableBalance, те. поделить баланс на части, указанные в lotsDistribution) денег, на исполнение ордера покупки - выставление ордера на продажу
     + % прибыли или ближайший сайз
  -- на выполнение ордера вызывать onOrderbook с последним orderbook (хранить его)
*/

export type PositionState = {
  price: number;
  lots: number;
  orderId: string;
  dealSum: number;
  stopLoss?: number;
  isReserved?: boolean;
  isExecuted?: boolean;
  isPartiallyExecuted?: boolean;
  isStop?: boolean;
  becauseOfOrderId?: string;
  executedLots: number;
  idx: number;
}