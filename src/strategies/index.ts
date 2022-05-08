import { Candle } from 'invest-nodejs-grpc-sdk/dist/generated/marketdata';
import { OrderState, PostOrderRequest } from 'invest-nodejs-grpc-sdk/dist/generated/orders';


export enum Strategies {
  Example,
};

export interface IStrategy {
  /**
   * Логика принятия решений по выставлению заявок
   * @param candle Свеча для обработки
   * @returns Заявки для обработки. Может вернуть несколько заявок
   */
  onCandle(candle: Candle): Generator<Partial<PostOrderRequest>>;

  /**
   * Обработка изменения состояния заявки
   * Используется для обновления информации о доступных средствах, количестве акций "в работе" и т.п.
   */ 
  onChangeOrder(order: OrderState): Promise<void>;
}

export { default as Example } from './example';
