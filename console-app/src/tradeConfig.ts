import { SubscriptionInterval } from 'invest-nodejs-grpc-sdk/dist/generated/marketdata';
import { Strategies } from './strategies';
import ShareTradeConfig from './tradeShare';

export type SharesTradeConfig = { [ticker: string]: ShareTradeConfig };

const shares: SharesTradeConfig = {
  NRIX: {
    candleInterval: SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE,
    maxBalance: 40,
    maxToTradeAmount: 5,
    priceStep: 0.01,
    commission: 0.01,
    cancelBuyOrderIfPriceGoesBelow: 0.5,
    cancelSellOrderIfPriceGoesAbove: 0.5,
    strategy: Strategies.Example,

    stopLoss: 5, // pt., so if stop is 5pt. and buy was $5.13, stop will be on $5.11

  },
  // TMOS: {
  //   candleInterval: SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE,
  //   maxBalance: 60,
  //   maxToTradeAmount: 12,
  //   priceStep: 0.002,
  //   commission: 0,
  //   cancelBuyOrderIfPriceGoesBelow: 0.5,
  //   cancelSellOrderIfPriceGoesAbove: 0.5,
  //   strategy: Strategies.Example,

  //   stopLoss: 5, // pt., so if stop is 5pt. and buy was $5.13, stop will be on $5.11

  // },
  // UWGN: {
  //   candleInterval: SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE,
  //   maxBalance: 127,
  //   maxToTradeAmount: 5,
  //   priceStep: 0.01,
  //   commission: 0.02,
  //   cancelBuyOrderIfPriceGoesBelow: 0.5,
  //   cancelSellOrderIfPriceGoesAbove: 0.5,
  //   strategy: Strategies.Example,
  // },
  // VEON: {
  //   candleInterval: SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE,
  //   maxBalance: 4.2,
  //   maxToTradeAmount: 8,
  //   priceStep: 0.01,
  //   commission: 0.01,
  //   cancelBuyOrderIfPriceGoesBelow: 1,
  //   cancelSellOrderIfPriceGoesAbove: 1,
  //   strategy: Strategies.Example,
  // },
};

export default shares;
