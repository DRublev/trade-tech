import Sdk from "../Sdk";
import OrderbookSubscriber from './Orderbook.subscriber';

const sdk = new Sdk(new OrderbookSubscriber());

export default sdk;