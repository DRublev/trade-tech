import { Container } from "inversify";

import { CONSTANTS } from "./identifiers";
import ordersEmitter, { OrdersEmitter } from "./orders/Emitter";
import shares, { SharesTradeConfig } from "./tradeConfig";


const container = new Container();

const killSwitch = new AbortController();

container.bind<AbortController>(CONSTANTS.KillSwitch).toConstantValue(killSwitch);
container.bind<SharesTradeConfig>(CONSTANTS.SharesTradeConfig).toConstantValue(shares);

container.bind<OrdersEmitter>(CONSTANTS.OrdersEmitter).toConstantValue(ordersEmitter);

export default container;