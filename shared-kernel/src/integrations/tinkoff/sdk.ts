import Sdk from "@/Sdk";
import OrderbookSubscriber from './OrderBookSubscriber';

const sdk = new Sdk(new OrderbookSubscriber());

export default sdk;