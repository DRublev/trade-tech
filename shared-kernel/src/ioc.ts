import { Container } from "inversify";

import killSwitch from "./KillSwitch";
import identifiers from "./constants/identifiers";
import OrderbookEmitter from "./app/emitters/Orderbook.emitter";

import tinkoffClient, { createClient } from './infra/tinkoff/client';
import ModeController from "./app/types/mode";


const baseContainer = new Container();

baseContainer.bind<AbortController>(identifiers.KillSwitch).toConstantValue(killSwitch);
baseContainer.bind<ModeController>(identifiers.ModeController).toConstantValue(new ModeController());

baseContainer.bind<typeof OrderbookEmitter>(identifiers.OrderbookEmitter).toConstantValue(OrderbookEmitter);

baseContainer.bind<typeof tinkoffClient>(identifiers.TinkoffClient).toConstantValue(tinkoffClient);
baseContainer.bind(identifiers.TinkoffBuildClientFunc).toFunction(createClient);

export default baseContainer;
