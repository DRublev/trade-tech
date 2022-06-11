import { Container } from "inversify";

import killSwitch from "./KillSwitch";
import identifiers from "@/constants/identifiers";
import OrderbookEmitter from "./emitters/Orderbook.emitter";

import tinkoffClient from './tinkoff/client';

const baseContainer = new Container();

baseContainer.bind<AbortController>(identifiers.KillSwitch).toConstantValue(killSwitch);

baseContainer.bind<typeof OrderbookEmitter>(identifiers.OrderbookEmitter).toConstantValue(OrderbookEmitter);

baseContainer.bind<typeof tinkoffClient>(identifiers.TinkoffClient).toConstantValue(tinkoffClient);

export default baseContainer;
