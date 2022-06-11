import Sdk from "../../interfaces/Sdk";
import OrderbookSubscriber from './Orderbook.subscriber';
import AccountProvider from '../Account.provider';

const sdk = new Sdk(
  new OrderbookSubscriber(),
  AccountProvider,
);

export default sdk;