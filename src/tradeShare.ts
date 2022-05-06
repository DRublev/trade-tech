import { SubscriptionInterval } from 'invest-nodejs-grpc-sdk/dist/generated/marketdata';
import { Strategies } from './strategies';


type TradeShare = {
  candleInterval: SubscriptionInterval,
  /**
   * Максимальное количество лотов для торговли
   */
  maxToTradeAmount: number;
  /**
   * Минимальная разница цен (High и Low), при которой будет выставлен ордер
   */
  priceStep: number;
  /**
   * Каким алгоритмом торговать
   */
  strategy: Strategies,
}

export default TradeShare;