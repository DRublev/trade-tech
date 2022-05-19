import { Container } from "inversify";

import { CONSTANTS } from "./identifiers";
import shares, { SharesTradeConfig } from "./tradeConfig";


const container = new Container();

const killSwitch = new AbortController();

container.bind<AbortController>(CONSTANTS.KillSwitch).toConstantValue(killSwitch);
container.bind<SharesTradeConfig>(CONSTANTS.SharesTradeConfig).toConstantValue(shares);

export default container;